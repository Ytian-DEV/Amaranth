import { sitemapXml, type FeedItem } from './_lib/seo';
import { liveCardsQuery, readEnv, rest, type CardRow } from './_lib/supabaseRest';

const STATIC_PATHS = ['/latest', '/salingkusog', '/salingkusog/schedule', '/salingkusog/winners', '/salingkusog/factions', '/about', '/editorial-board', '/archives', '/contact', '/submit', '/submit/event'];

/** /sitemap.xml (rewritten here by vercel.json) */
export async function GET(request: Request) {
  const env = readEnv(request.url);
  if (!env) return new Response('Supabase is not configured', { status: 500 });
  const [sections, articles] = await Promise.all([
    rest<{ slug: string }[]>(env, 'sections?select=slug&nav_placement=neq.hidden&order=nav_order'),
    rest<CardRow[]>(env, liveCardsQuery('', 5000)),
  ]);
  const items: FeedItem[] = articles.map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, publishedAt: a.published_at, updatedAt: a.updated_at }));
  return new Response(sitemapXml(env.siteUrl, STATIC_PATHS, sections.map((s) => s.slug), items), {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
