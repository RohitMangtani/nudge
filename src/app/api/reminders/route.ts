import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('reminders')
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
  if (snoozed_until !== undefined) updates.snoozed_until = snoozed_until;

  await supabase.from('reminders').update(updates).eq('id', reminderId).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reminderId } = await req.json();
  if (!reminderId) return NextResponse.json({ error: 'Missing reminderId' }, { status: 400 });

  const supabase = getServerSupabase();
  await supabase.from('reminders').delete().eq('id', reminderId).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
