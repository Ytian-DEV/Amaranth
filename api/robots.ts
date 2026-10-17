import { readEnv } from './_lib/supabaseRest.js';

/** /robots.txt (rewritten here by vercel.json) — needs the absolute sitemap URL. */
export function GET(request: Request) {
  const site = readEnv(request.url)?.siteUrl ?? new URL(request.url).origin;
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /dev', '', `Sitemap: ${site}/sitemap.xml`, ''].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, s-maxage=86400' } });
}
