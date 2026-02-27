import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';
import { STALENESS_RULES, isStale } from '@/lib/checkins';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServerSupabase();

  // Fetch user's answers that have staleness rules
  const ruleKeys = STALENESS_RULES.map((r) => r.key);
  const { data: answers } = await supabase
    .from('nudge_answers')
    .select('*')
    .eq('user_id', user.id)
    .in('key', ruleKeys);

  // Fetch existing active check-ins to avoid duplicates
  const { data: existing } = await supabase
    .from('nudge_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('dismissed', false)
    .eq('answered', false);

  const existingKeys = new Set((existing || []).map((c) => c.key));
  const today = new Date().toISOString().split('T')[0];

  // Create check-ins for stale answers that don't already have one
  const toInsert = [];
  for (const rule of STALENESS_RULES) {
    if (existingKeys.has(rule.key)) continue;
    const answer = (answers || []).find((a) => a.key === rule.key);
    if (!answer) continue;
    if (!isStale(answer.updated_at || answer.created_at, rule.months)) continue;

    toInsert.push({
      user_id: user.id,
      category: rule.category,
      key: rule.key,
      prompt: rule.prompt,
      due_date: today,
    });
  }

  if (toInsert.length > 0) {
    await supabase.from('nudge_checkins').insert(toInsert);
  }

  // Return all active check-ins
  const { data: checkins } = await supabase
    .from('nudge_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('dismissed', false)
    .eq('answered', false)
    .order('created_at', { ascending: true });

  return NextResponse.json({ checkins: checkins || [] });
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { checkinId, key, category, value } = await req.json();
  if (!checkinId || !key || !value) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getServerSupabase();

  // Update the answer with new value and refresh updated_at
  await supabase
    .from('nudge_answers')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('key', key)
    .eq('category', category);

  // Mark check-in as answered
  await supabase
    .from('nudge_checkins')
    .update({ answered: true })
    .eq('id', checkinId)
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { checkinId } = await req.json();
  if (!checkinId) return NextResponse.json({ error: 'Missing checkinId' }, { status: 400 });

  const supabase = getServerSupabase();
  await supabase
    .from('nudge_checkins')
    .update({ dismissed: true })
    .eq('id', checkinId)
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
