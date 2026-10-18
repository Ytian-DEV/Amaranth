// /api/r — CDN-cached reads of public Supabase data for signed-out readers.
// The browser's Supabase client sends anonymous GETs of the tables below here instead of
// straight to Supabase (see src/lib/edgeCache.ts). Vercel's CDN keeps each response for a
// minute, so a busy front page costs the database one query per minute instead of one per
// reader, and readers skip the CORS preflight to supabase.co. Only the anon key is used, so
// RLS still decides what comes back; staff (signed in) never come through here.
import { readEnv } from './_lib/supabaseRest.js';

/** Public, slow-changing reads. Live scores, comments and anything personal stay direct. */
export const CACHEABLE = new Set([
  'article_cards',
  'articles',
  'article_authors',
  'article_tags',
  'tags',
  'sections',
  'categories',
  'site_settings',
  'home_slots',
  'publication_issues',
  'team_terms',
  'team_members',
  'department_contacts',
  'media_assets',
  'sk_editions',
  'sk_factions',
  'sk_sports',
  'sk_events',
  'sk_venues',
  'sk_athletes',
  'rpc/most_read_articles',
  'rpc/archive_months',
]);

/** "article_cards?select=*&slug=eq.x" → the resource name, or null if it isn't a plain PostgREST path. */
export function resourceOf(path: string) {
  const m = /^([a-z_]+(?:\/[a-z_]+)?)(?:\?|$)/.exec(path);
  return m ? m[1] : null;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function GET(request: Request) {
  const env = readEnv(request.url);
  if (!env) return json(501, { message: 'Supabase is not configured' });

  const url = new URL(request.url);
  const path = url.searchParams.get('p') ?? '';
  const resource = resourceOf(path);
  if (!resource || !CACHEABLE.has(resource) || path.length > 2000) return json(400, { message: 'Not a cacheable read' });
  // .single() asks for one object instead of a list
  const accept = url.searchParams.get('a') === 'object' ? 'application/vnd.pgrst.object+json' : 'application/json';

  const upstream = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: env.anonKey, Authorization: `Bearer ${env.anonKey}`, Accept: accept },
  });
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
      // errors aren't cached; successes are fresh for a minute, then served stale while one request refreshes
      'cache-control': upstream.ok ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' : 'no-store',
    },
  });
}
