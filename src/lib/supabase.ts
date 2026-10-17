import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env, isSupabaseConfigured } from './env';

export type Supabase = SupabaseClient<Database>;

let client: Supabase | null = null;

/**
 * The typed Supabase client. Throws a clear error when the project isn't
 * configured, so screens show an error state instead of silently empty data.
 */
export function getSupabase(): Supabase {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
  }
  client ??= createClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

/** Unwraps a Supabase response, throwing its error. */
export function unwrap<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}
