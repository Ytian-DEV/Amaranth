// Minimal Supabase REST access for Vercel middleware/functions (anon key; RLS applies).

export type Env = { supabaseUrl: string; anonKey: string; siteUrl: string };

export function readEnv(requestUrl: string): Env | null {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;
  const siteUrl = (process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? new URL(requestUrl).origin).replace(/\/$/, '');
  return { supabaseUrl: supabaseUrl.replace(/\/$/, ''), anonKey, siteUrl };
}

export async function rest<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: env.anonKey, Authorization: `Bearer ${env.anonKey}`, Accept: 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export type CardRow = {
  slug: string;
  title: string;
  excerpt: string;
  dek: string | null;
  published_at: string;
  updated_at: string;
  section_name: string;
  section_slug: string;
  byline: string | null;
  cover_bucket: string | null;
  cover_path: string | null;
  cover_alt: string | null;
};

/** article_cards query for live rows; the time is taken per call (warm instances live for a while). */
export const liveCardsQuery = (extra: string, limit: number) => {
  const live = `status=in.(published,scheduled)&published_at=lte.${encodeURIComponent(new Date().toISOString())}`;
  const columns = 'slug,title,excerpt,dek,published_at,updated_at,section_name,section_slug,byline,cover_bucket,cover_path,cover_alt';
  return `article_cards?select=${columns}&${live}${extra ? `&${extra}` : ''}&order=published_at.desc&limit=${limit}`;
};
