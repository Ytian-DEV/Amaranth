// Sends signed-out readers' public Supabase reads through /api/r, which Vercel's CDN caches for a
// minute (see api/r.ts). Anything else — writes, signed-in staff, live scores, counts — goes
// straight to Supabase as before, and so does any read the proxy can't answer.

/** Keep in step with CACHEABLE in api/r.ts (a test checks they match). */
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

const OBJECT = 'application/vnd.pgrst.object+json';

/** The /api/r URL for a request, or null when it has to go to Supabase directly. */
export function edgeUrl(url: string, method: string, headers: Headers, supabaseUrl: string, anonKey: string) {
  if (method !== 'GET') return null;
  const prefix = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/`;
  if (!url.startsWith(prefix)) return null;
  // signed-in staff send their own token (drafts, previews): never share those through a cache
  if (headers.get('authorization') !== `Bearer ${anonKey}`) return null;
  if (headers.has('prefer') || headers.has('range')) return null; // counts and ranges need response headers
  const accept = headers.get('accept') ?? 'application/json';
  if (accept !== OBJECT && !accept.includes('application/json') && accept !== '*/*') return null;
  const path = url.slice(prefix.length);
  const resource = /^([a-z_]+(?:\/[a-z_]+)?)(?:\?|$)/.exec(path)?.[1];
  if (!resource || !CACHEABLE.has(resource) || path.length > 2000) return null;
  return `/api/r?p=${encodeURIComponent(path)}${accept === OBJECT ? '&a=object' : ''}`;
}

export function edgeCachedFetch(supabaseUrl: string, anonKey: string): typeof fetch {
  return async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const target = edgeUrl(url, method, new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)), supabaseUrl, anonKey);
    if (target) {
      try {
        const res = await fetch(target, { signal: init?.signal });
        if (res.ok) return res;
      } catch (e) {
        if (init?.signal?.aborted) throw e;
      }
      // proxy missing (local preview), not configured or failed: ask Supabase directly
    }
    return fetch(input, init);
  };
}

/** Only on deployed sites, where /api exists. */
export const edgeCacheEnabled = () => import.meta.env.PROD && typeof window !== 'undefined' && !/^(localhost|127\.|\[::1\])/.test(window.location.hostname);
