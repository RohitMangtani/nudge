import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('answers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ answers: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { answers } = await req.json();
  if (!answers || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
  }

  const supabase = getServerSupabase();

  for (const a of answers) {
    await supabase
      .from('answers')
      .upsert(
        { user_id: user.id, category: a.category, key: a.key, value: a.value },
        { onConflict: 'user_id,category,key' }
      );
  }

  // Mark onboarding complete
  await supabase.from('users').update({ onboarding_complete: true }).eq('id', user.id);

  return NextResponse.json({ ok: true });
}
