import { rssXml } from './_lib/seo';
import { liveCardsQuery, readEnv, rest, type CardRow } from './_lib/supabaseRest';

/** /rss.xml and /rss.xml?section=news (rewritten here by vercel.json) */
export async function GET(request: Request) {
  const env = readEnv(request.url);
  if (!env) return new Response('Supabase is not configured', { status: 500 });
  const section = new URL(request.url).searchParams.get('section');
  const filter = section && /^[a-z0-9-]+$/.test(section) ? `section_slug=eq.${section}` : '';
  const rows = await rest<CardRow[]>(env, liveCardsQuery(filter, 30));
  const xml = rssXml(
    env.siteUrl,
    rows.map((r) => ({ slug: r.slug, title: r.title, excerpt: r.dek || r.excerpt, publishedAt: r.published_at, section: r.section_name, byline: r.byline })),
    section && rows[0] ? `Amaranth — ${rows[0].section_name}` : undefined,
  );
  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, s-maxage=900, stale-while-revalidate=86400' },
  });
}
