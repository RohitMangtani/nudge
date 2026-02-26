import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServerSupabase();

  const { data: answers } = await supabase
    .from('nudge_answers')
    .select('*')
    .eq('user_id', user.id);

  if (!answers || answers.length === 0) {
    return NextResponse.json({ error: 'No answers yet' }, { status: 400 });
  }

  // Delete old AI-generated reminders before regenerating
  await supabase.from('nudge_reminders').delete().eq('user_id', user.id);

  const answersText = answers
    .map((a) => `[${a.category}] ${a.key}: ${a.value}`)
    .join('\n');

  const today = new Date().toISOString().split('T')[0];

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a life maintenance assistant. Based on this person's answers, generate a list of reminders for things they need to do or schedule.

Today's date: ${today}

User's answers:
${answersText}

Rules:
- Generate practical, actionable reminders with specific due dates
- If someone said "don't remember" for when they last did something, assume it's overdue and set the date within the next 2 weeks
- For recurring things (oil changes, checkups), set the next one and mark as recurring
- Be specific: "Schedule annual physical" not "Think about health"
- Set realistic due dates based on urgency
- Keep descriptions to one helpful sentence
- Cover everything their answers suggest they need

Return ONLY a JSON array. Each object must have:
- "category": the life area (health, car, home, finance, personal, pets)
- "title": short actionable title
- "description": one sentence of context
- "due_date": "${today}" format (YYYY-MM-DD)
- "recurring": boolean
- "recurrence_label": if recurring, how often (e.g. "Every 6 months", "Yearly", "Every 5,000 miles")

Return ONLY the JSON array, no markdown, no explanation.`,
      },
    ],
  });

  const text = (msg.content[0] as { type: string; text: string }).text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let reminders;
  try {
    reminders = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Failed to parse reminders' }, { status: 500 });
  }

  const rows = reminders.map((r: Record<string, unknown>) => ({
    user_id: user.id,
    category: r.category,
    title: r.title,
    description: r.description,
    due_date: r.due_date,
    recurring: r.recurring || false,
    recurrence_label: r.recurrence_label || null,
  }));

  const { error } = await supabase.from('nudge_reminders').insert(rows);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: rows.length });
}
