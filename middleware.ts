// Vercel Routing Middleware: link previews for a single-page app.
// Facebook, Messenger, X and other crawlers don't run JavaScript, so for them we return
// index.html with the article's (or section's) Open Graph tags already in <head>.
// Everyone else gets the normal SPA untouched.
import { CRAWLER_UA, injectMeta, SITE_DESCRIPTION, SITE_NAME, storageUrl, type PageMeta } from './api/_lib/seo';
import { liveCardsQuery, readEnv, rest, type CardRow } from './api/_lib/supabaseRest';

export const config = {
  matcher: ['/article/:slug*', '/((?!api|assets|admin|dev|images|fonts|documents|.*\\..*).*)'],
};

const passThrough = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

async function metaFor(pathname: string, env: NonNullable<ReturnType<typeof readEnv>>): Promise<PageMeta | null> {
  const url = `${env.siteUrl}${pathname === '/' ? '' : pathname}`;
  const article = /^\/article\/([a-z0-9-]+)\/?$/.exec(pathname);
  if (article) {
    const rows = await rest<CardRow[]>(env, liveCardsQuery(`slug=eq.${article[1]}`, 1));
    const a = rows[0];
    if (!a) return null;
    const seo = await rest<{ seo_title: string | null; seo_description: string | null; og_image_asset_id: string | null }[]>(
      env,
      `articles?select=seo_title,seo_description,og_image_asset_id&slug=eq.${article[1]}&limit=1`,
    ).catch(() => []);
    const ogAsset = seo[0]?.og_image_asset_id
      ? (await rest<{ bucket: string; path: string }[]>(env, `media_assets?select=bucket,path&id=eq.${seo[0].og_image_asset_id}&limit=1`).catch(() => []))[0]
      : undefined;
    return {
      title: `${seo[0]?.seo_title || a.title} · ${SITE_NAME}`,
      description: seo[0]?.seo_description || a.dek || a.excerpt || SITE_DESCRIPTION,
      url,
      image:
        (ogAsset && storageUrl(env.supabaseUrl, ogAsset.bucket, ogAsset.path)) ??
        storageUrl(env.supabaseUrl, a.cover_bucket, a.cover_path) ??
        `${env.siteUrl}/og-default.jpg`,
      imageAlt: a.cover_alt,
      type: 'article',
      publishedAt: a.published_at,
      section: a.section_name,
    };
  }
  const section = /^\/([a-z0-9-]+)\/?$/.exec(pathname);
  if (section) {
    const rows = await rest<{ name: string; description: string | null }[]>(env, `sections?select=name,description&slug=eq.${section[1]}&limit=1`);
    if (!rows[0]) return null;
    return { title: `${rows[0].name} · ${SITE_NAME}`, description: rows[0].description || SITE_DESCRIPTION, url, image: `${env.siteUrl}/og-default.jpg` };
  }
  if (pathname === '/') {
    return { title: `${SITE_NAME} | The Official Student Publication of Visayas State University`, description: SITE_DESCRIPTION, url: env.siteUrl, image: `${env.siteUrl}/og-default.jpg` };
  }
  return null;
}

export default async function middleware(request: Request) {
  if (!CRAWLER_UA.test(request.headers.get('user-agent') ?? '')) return passThrough();
  const env = readEnv(request.url);
  if (!env) return passThrough();
  try {
    const { pathname, origin } = new URL(request.url);
    const meta = await metaFor(pathname, env);
    if (!meta) return passThrough();
    const shell = await fetch(`${origin}/index.html`, { headers: { 'user-agent': 'amaranth-middleware' } });
    if (!shell.ok) return passThrough();
    return new Response(injectMeta(await shell.text(), meta), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400' },
    });
  } catch {
    return passThrough();
  }
}
