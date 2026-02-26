import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServerSupabase();

  // Delete all reminders and answers, reset onboarding
  await supabase.from('nudge_reminders').delete().eq('user_id', user.id);
  await supabase.from('nudge_answers').delete().eq('user_id', user.id);
  await supabase.from('nudge_users').update({ onboarding_complete: false }).eq('id', user.id);

  return NextResponse.json({ ok: true });
}
