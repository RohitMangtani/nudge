import { cookies } from 'next/headers';
import { verifyIdToken } from './firebase-admin';
import { getServerSupabase, type DbUser } from './supabase';

const COOKIE_NAME = 'nudge-token';

export async function getUser(): Promise<DbUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = await verifyIdToken(token);
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('nudge_users')
    .select('*')
    .eq('firebase_uid', decoded.uid)
    .single();

  return data as DbUser | null;
}

export function getTokenCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  };
}
