// Pure helpers shared by the Vercel middleware and functions (no runtime deps; unit-tested).

export type PageMeta = {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  imageAlt?: string | null;
  type?: 'website' | 'article';
  publishedAt?: string | null;
  section?: string | null;
};

export type FeedItem = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string | null;
  section?: string | null;
  byline?: string | null;
};

export const SITE_NAME = 'Amaranth';
export const SITE_DESCRIPTION =
  'Amaranth — the official student publication of Visayas State University, Baybay City, Leyte. News, sports, features, literary and views written by students, for students.';

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Crawlers that read Open Graph tags but don't run JavaScript. */
export const CRAWLER_UA =
  /facebookexternalhit|facebot|twitterbot|slackbot|linkedinbot|whatsapp|telegrambot|discordbot|pinterest|skypeuripreview|viber|embedly|redditbot|applebot|googlebot|bingbot|duckduckbot|yandex|baiduspider/i;

export function metaTags(m: PageMeta) {
  const tags = [
    `<title>${escapeHtml(m.title)}</title>`,
    `<meta name="description" content="${escapeHtml(m.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(m.url)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${m.type ?? 'website'}" />`,
    `<meta property="og:title" content="${escapeHtml(m.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(m.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(m.url)}" />`,
    `<meta property="og:locale" content="en_PH" />`,
    `<meta name="twitter:card" content="${m.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeHtml(m.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(m.description)}" />`,
  ];
  if (m.image) {
    tags.push(
      `<meta property="og:image" content="${escapeHtml(m.image)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(m.image)}" />`,
    );
    if (m.imageAlt) tags.push(`<meta property="og:image:alt" content="${escapeHtml(m.imageAlt)}" />`);
  }
  if (m.type === 'article') {
    if (m.publishedAt) tags.push(`<meta property="article:published_time" content="${escapeHtml(m.publishedAt)}" />`);
    if (m.section) tags.push(`<meta property="article:section" content="${escapeHtml(m.section)}" />`);
  }
  return tags.join('\n    ');
}

/** Replaces the <title> and description in index.html with page-specific tags. */
export function injectMeta(html: string, m: PageMeta) {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/i, '')
    .replace(/<link\s+rel="canonical"[^>]*>/i, '')
    .replace(/<meta\s+(property|name)="(og|twitter):[^"]*"[^>]*>/gi, '');
  return cleaned.replace(/<\/head>/i, `    ${metaTags(m)}\n  </head>`);
}

export function storageUrl(supabaseUrl: string, bucket: string | null, path: string | null) {
  if (!bucket || !path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const base = supabaseUrl.replace(/\/$/, '');
  return path.startsWith('/') ? null : `${base}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function sitemapXml(site: string, staticPaths: string[], sections: string[], articles: FeedItem[]) {
  const url = (loc: string, lastmod?: string | null, priority?: string) =>
    `  <url><loc>${escapeXml(site + loc)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}${priority ? `<priority>${priority}</priority>` : ''}</url>`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    url('/', null, '1.0'),
    ...staticPaths.map((p) => url(p, null, '0.5')),
    ...sections.map((s) => url(`/${s}`, null, '0.8')),
    ...articles.map((a) => url(`/article/${a.slug}`, a.updatedAt ?? a.publishedAt, '0.7')),
    '</urlset>',
  ].join('\n');
}

export function rssXml(site: string, items: FeedItem[], title = `${SITE_NAME} — Visayas State University`) {
  const item = (a: FeedItem) =>
    [
      '    <item>',
      `      <title>${escapeXml(a.title)}</title>`,
      `      <link>${escapeXml(`${site}/article/${a.slug}`)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(`${site}/article/${a.slug}`)}</guid>`,
      `      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>`,
      a.section ? `      <category>${escapeXml(a.section)}</category>` : '',
      a.byline ? `      <dc:creator>${escapeXml(a.byline)}</dc:creator>` : '',
      `      <description>${escapeXml(a.excerpt)}</description>`,
      '    </item>',
    ]
      .filter(Boolean)
      .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(site)}</link>`,
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    '    <language>en-ph</language>',
    `    <atom:link href="${escapeXml(`${site}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    items[0] ? `    <lastBuildDate>${new Date(items[0].publishedAt).toUTCString()}</lastBuildDate>` : '',
    ...items.map(item),
    '  </channel>',
    '</rss>',
  ]
    .filter(Boolean)
    .join('\n');
}
