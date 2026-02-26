import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { getServerSupabase } from '@/lib/supabase';
import { getTokenCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const decoded = await verifyIdToken(idToken);
  const supabase = getServerSupabase();

  const { data: existing } = await supabase
    .from('nudge_users')
    .select('*')
    .eq('firebase_uid', decoded.uid)
    .single();

  let user = existing;
  if (!user) {
    const { data: newUser } = await supabase
      .from('nudge_users')
      .insert({
        email: decoded.email || '',
        name: decoded.name || 'Friend',
        firebase_uid: decoded.uid,
      })
      .select()
      .single();
    user = newUser;
  }

  const res = NextResponse.json({ user });
  const opts = getTokenCookieOptions();
  res.cookies.set(opts.name, idToken, opts);
  return res;
}
