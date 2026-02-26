import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase env vars');
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

export interface DbUser {
  id: string;
  email: string;
  name: string;
  firebase_uid: string | null;
  onboarding_complete: boolean;
  created_at: string;
}

export interface DbAnswer {
  id: string;
  user_id: string;
  category: string;
  key: string;
  value: string;
  created_at: string;
}

export interface DbReminder {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string | null;
  due_date: string;
  recurring: boolean;
  recurrence_label: string | null;
  completed: boolean;
  snoozed_until: string | null;
  created_at: string;
}
