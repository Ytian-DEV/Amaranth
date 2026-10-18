import { CACHEABLE as SERVER_CACHEABLE, GET } from '../../api/r.js';
import { liveCutoff } from '@/features/public/articles';
import { CACHEABLE, edgeCachedFetch, edgeUrl } from './edgeCache';

const SB = 'https://proj.supabase.co';
const ANON = 'anon-key';
const anonHeaders = (extra: Record<string, string> = {}) => new Headers({ apikey: ANON, Authorization: `Bearer ${ANON}`, Accept: 'application/json', ...extra });

describe('edgeUrl', () => {
  const rest = `${SB}/rest/v1/`;
  it('routes anonymous public reads through /api/r', () => {
    const url = `${rest}article_cards?select=*&section_slug=eq.news`;
    expect(edgeUrl(url, 'GET', anonHeaders(), SB, ANON)).toBe(`/api/r?p=${encodeURIComponent('article_cards?select=*&section_slug=eq.news')}`);
    expect(edgeUrl(`${rest}rpc/most_read_articles?p_days=7`, 'GET', anonHeaders(), SB, ANON)).toContain('/api/r?p=rpc%2Fmost_read_articles');
    expect(edgeUrl(`${rest}articles?select=body_html`, 'GET', anonHeaders({ Accept: 'application/vnd.pgrst.object+json' }), SB, ANON)).toMatch(/&a=object$/);
  });

  it('keeps everything else direct', () => {
    const url = `${rest}article_cards?select=*`;
    expect(edgeUrl(url, 'POST', anonHeaders(), SB, ANON)).toBeNull(); // writes / POST RPCs
    expect(edgeUrl(url, 'GET', anonHeaders({ Authorization: 'Bearer user-jwt' }), SB, ANON)).toBeNull(); // signed-in staff
    expect(edgeUrl(url, 'GET', anonHeaders({ Prefer: 'count=exact' }), SB, ANON)).toBeNull(); // counts
    expect(edgeUrl(`${rest}sk_matches?select=*`, 'GET', anonHeaders(), SB, ANON)).toBeNull(); // live scores
    expect(edgeUrl(`${rest}article_comments?select=*`, 'GET', anonHeaders(), SB, ANON)).toBeNull();
    expect(edgeUrl(`${SB}/auth/v1/user`, 'GET', anonHeaders(), SB, ANON)).toBeNull();
    expect(edgeUrl(`${SB}/storage/v1/object/list/media`, 'GET', anonHeaders(), SB, ANON)).toBeNull();
  });

  it('uses the same list as the server', () => {
    expect([...CACHEABLE].sort()).toEqual([...SERVER_CACHEABLE].sort());
  });
});

describe('edgeCachedFetch', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('falls back to Supabase when the proxy is missing', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);
        return url.startsWith('/api/r') ? new Response('Not found', { status: 404 }) : new Response('[]', { status: 200 });
      }),
    );
    const f = edgeCachedFetch(SB, ANON);
    const res = await f(`${SB}/rest/v1/sections?select=*`, { method: 'GET', headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
    expect(res.status).toBe(200);
    expect(calls).toEqual([`/api/r?p=${encodeURIComponent('sections?select=*')}`, `${SB}/rest/v1/sections?select=*`]);
  });
});

describe('api/r', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = SB;
    process.env.SUPABASE_ANON_KEY = ANON;
  });
  afterEach(() => vi.unstubAllGlobals());

  it('forwards whitelisted reads with the anon key and caches successes for a minute', async () => {
    const upstream = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response('[{"slug":"a"}]', { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', upstream);
    const res = await GET(new Request(`https://site.test/api/r?p=${encodeURIComponent('article_cards?select=slug&limit=1')}`));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('s-maxage=60');
    expect(await res.text()).toBe('[{"slug":"a"}]');
    expect(String(upstream.mock.calls[0][0])).toBe(`${SB}/rest/v1/article_cards?select=slug&limit=1`);
    expect(new Headers(upstream.mock.calls[0][1]?.headers).get('authorization')).toBe(`Bearer ${ANON}`);
  });

  it('refuses other tables and never caches errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"message":"boom"}', { status: 500 })));
    expect((await GET(new Request(`https://site.test/api/r?p=${encodeURIComponent('profiles?select=email')}`))).status).toBe(400);
    expect((await GET(new Request(`https://site.test/api/r?p=${encodeURIComponent('../auth/v1/user')}`))).status).toBe(400);
    const failed = await GET(new Request(`https://site.test/api/r?p=${encodeURIComponent('sections?select=*')}`));
    expect(failed.status).toBe(500);
    expect(failed.headers.get('cache-control')).toBe('no-store');
  });
});

describe('liveCutoff', () => {
  it('rounds down to the minute so readers share cache entries', () => {
    expect(liveCutoff(Date.parse('2026-10-18T03:21:47.123Z'))).toBe('2026-10-18T03:21:00.000Z');
  });
});
