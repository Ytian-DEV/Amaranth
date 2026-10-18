import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { edgeCacheEnabled, edgeCachedFetch } from './edgeCache';
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
    // signed-out public reads go through the CDN-cached /api/r on deployed sites
    ...(edgeCacheEnabled() ? { global: { fetch: edgeCachedFetch(env.supabaseUrl!, env.supabaseAnonKey!) } } : {}),
  });
  return client;
}

type Response = { data: unknown; error: unknown };

/** Unwraps a Supabase list/RPC response, throwing its error (data is never null on success). */
export function unwrap<R extends Response>(result: R): NonNullable<R['data']> {
  if (result.error) throw result.error;
  return result.data as NonNullable<R['data']>;
}

/** Unwraps a `.maybeSingle()` response: the row or null. */
export function unwrapMaybe<R extends Response>(result: R): NonNullable<R['data']> | null {
  if (result.error) throw result.error;
  return (result.data ?? null) as NonNullable<R['data']> | null;
}

/** A page number past the last page (PostgREST 416, PGRST103): show an empty page, not an error. */
export function pastLastPage(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'PGRST103';
}
