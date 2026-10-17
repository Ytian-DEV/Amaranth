import { CRAWLER_UA, escapeHtml, injectMeta, rssXml, sitemapXml, storageUrl } from './seo.js';

const shell = `<!doctype html><html><head><meta charset="UTF-8" /><meta name="description" content="old" /><title>Old</title></head><body><div id="root"></div></body></html>`;

describe('injectMeta', () => {
  it('replaces title/description and adds Open Graph tags', () => {
    const html = injectMeta(shell, {
      title: 'Forests & "rangers" · Amaranth',
      description: 'What is at stake <for> the mountain',
      url: 'https://amaranth.example/article/forests',
      image: 'https://x.supabase.co/storage/v1/object/public/media/a.webp',
      type: 'article',
      publishedAt: '2026-10-15T00:00:00Z',
      section: 'News',
    });
    expect(html).not.toContain('<title>Old</title>');
    expect(html).not.toContain('content="old"');
    expect(html).toContain('<title>Forests &amp; &quot;rangers&quot; · Amaranth</title>');
    expect(html).toContain('<meta property="og:type" content="article" />');
    expect(html).toContain('<meta property="og:image" content="https://x.supabase.co/storage/v1/object/public/media/a.webp" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<link rel="canonical" href="https://amaranth.example/article/forests" />');
    expect(html).toContain('&lt;for&gt;');
    expect(html.indexOf('og:title')).toBeLessThan(html.indexOf('</head>'));
  });
});

describe('crawler detection', () => {
  it('matches Facebook/Messenger and X but not browsers', () => {
    expect(CRAWLER_UA.test('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(true);
    expect(CRAWLER_UA.test('Twitterbot/1.0')).toBe(true);
    expect(CRAWLER_UA.test('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36')).toBe(false);
  });
});

describe('feeds', () => {
  const items = [{ slug: 'a-b', title: 'Vipers & co', excerpt: 'Win <big>', publishedAt: '2026-10-13T00:00:00Z', section: 'Sports', byline: 'Sports Desk' }];

  it('builds a sitemap with absolute URLs', () => {
    const xml = sitemapXml('https://amaranth.example', ['/about'], ['news'], items);
    expect(xml).toContain('<loc>https://amaranth.example/article/a-b</loc><lastmod>2026-10-13</lastmod>');
    expect(xml).toContain('<loc>https://amaranth.example/news</loc>');
  });

  it('builds escaped RSS', () => {
    const xml = rssXml('https://amaranth.example', items);
    expect(xml).toContain('<title>Vipers &amp; co</title>');
    expect(xml).toContain('<description>Win &lt;big&gt;</description>');
    expect(xml).toContain('<dc:creator>Sports Desk</dc:creator>');
  });

  it('builds public storage URLs and skips site-relative paths', () => {
    expect(storageUrl('https://x.supabase.co/', 'media', 'a b.webp')).toBe('https://x.supabase.co/storage/v1/object/public/media/a%20b.webp');
    expect(storageUrl('https://x.supabase.co', 'media', '/images/a.jpg')).toBeNull();
    expect(escapeHtml(`'`)).toBe('&#39;');
  });
});
