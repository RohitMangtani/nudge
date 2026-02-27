import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';
import { computeNextDueDate } from '@/lib/recurrence';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('nudge_reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true });

  return NextResponse.json({ reminders: data || [] });
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reminderId, completed, snoozed_until } = await req.json();
  if (!reminderId) return NextResponse.json({ error: 'Missing reminderId' }, { status: 400 });

  const supabase = getServerSupabase();
  const updates: Record<string, unknown> = {};
  if (completed !== undefined) updates.completed = completed;
  if (completed) updates.completed_at = new Date().toISOString();
  if (snoozed_until !== undefined) updates.snoozed_until = snoozed_until;

  await supabase.from('nudge_reminders').update(updates).eq('id', reminderId).eq('user_id', user.id);

  // Auto-create next occurrence for recurring reminders
  if (completed) {
    const { data: done } = await supabase
      .from('nudge_reminders')
      .select('*')
      .eq('id', reminderId)
      .single();

    if (done?.recurring && done.recurrence_interval) {
      const nextDue = computeNextDueDate(done.due_date, done.recurrence_interval);
      await supabase.from('nudge_reminders').insert({
        user_id: user.id,
        category: done.category,
        title: done.title,
        description: done.description,
        due_date: nextDue,
        recurring: true,
        recurrence_label: done.recurrence_label,
        recurrence_interval: done.recurrence_interval,
        source: 'recurrence',
        parent_id: done.id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reminderId } = await req.json();
  if (!reminderId) return NextResponse.json({ error: 'Missing reminderId' }, { status: 400 });

  const supabase = getServerSupabase();
  await supabase.from('nudge_reminders').delete().eq('id', reminderId).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
