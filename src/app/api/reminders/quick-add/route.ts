import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';
import { parseRecurrenceLabel } from '@/lib/recurrence';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text } = await req.json();
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Parse this reminder into structured JSON. Today is ${today}.

"${text.trim()}"

Return ONLY a JSON object with:
- "category": one of health, car, home, finance, personal, pets (best guess)
- "title": short actionable title
- "description": one helpful sentence (or null)
- "due_date": YYYY-MM-DD (default: 7 days from today if no date mentioned)
- "recurring": boolean
- "recurrence_label": if recurring, human-readable (e.g. "Every 6 months")
- "recurrence_interval": if recurring, machine format (e.g. "6_months")

Return ONLY the JSON object, no markdown.`,
      },
    ],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Failed to parse reminder' }, { status: 500 });
  }

  const row = {
    user_id: user.id,
    category: parsed.category || 'personal',
    title: parsed.title,
    description: parsed.description || null,
    due_date: parsed.due_date || today,
    recurring: parsed.recurring || false,
    recurrence_label: parsed.recurrence_label || null,
    recurrence_interval: parsed.recurrence_interval || parseRecurrenceLabel(parsed.recurrence_label) || null,
    source: 'manual' as const,
  };

  const { data, error } = await getServerSupabase()
    .from('nudge_reminders')
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reminder: data });
}
