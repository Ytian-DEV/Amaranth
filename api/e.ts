// POST /api/e — anonymous, write-only statistics endpoint (the name avoids ad-blocker lists).
// The browser sends batched events with navigator.sendBeacon. Here we drop bots and other sites,
// reduce the user-agent to device/browser/OS families, classify the traffic source, and hand the
// batch to public.stats_ingest() with the service role. The IP address is never forwarded.
import { readEnv } from './_lib/supabaseRest.js';
import { classifySource, classifyUa, isBot, refHost } from './_lib/traffic.js';

const MAX_BODY = 16_000;
const MAX_EVENTS = 25;
const ID_RE = /^[A-Za-z0-9-]{8,64}$/;

type InEvent = { t?: unknown; id?: unknown; path?: unknown; ref?: unknown; us?: unknown; um?: unknown; uc?: unknown; secs?: unknown; scroll?: unknown; ch?: unknown };
type Body = { v?: unknown; s?: unknown; e?: unknown };

const str = (v: unknown, max: number) => (typeof v === 'string' && v.length <= max ? v : undefined);
const num = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : undefined);
const noContent = (status = 204) => new Response(null, { status, headers: { 'cache-control': 'no-store' } });

/** Shapes the client's events for stats_ingest (unknown fields dropped, sizes capped). */
export function shapeEvents(events: InEvent[], siteHost: string) {
  const out: Record<string, string | number>[] = [];
  for (const e of events.slice(0, MAX_EVENTS)) {
    const path = str(e.path, 300);
    if (e.t === 'pv' && str(e.id, 36) && path?.startsWith('/')) {
      const host = refHost(str(e.ref, 500));
      const us = str(e.us, 80);
      out.push({ t: 'pv', id: e.id as string, path, src: classifySource(host, siteHost, us), ...(host && host !== siteHost ? { ref: host } : {}), ...(us ? { us } : {}), ...(str(e.um, 80) ? { um: e.um as string } : {}), ...(str(e.uc, 80) ? { uc: e.uc as string } : {}) });
    } else if (e.t === 'eng' && str(e.id, 36)) {
      out.push({ t: 'eng', id: e.id as string, secs: num(e.secs, 14_400) ?? 0, scroll: num(e.scroll, 100) ?? 0 });
    } else if (e.t === 'share' && path?.startsWith('/article/')) {
      out.push({ t: 'share', path, ch: str(e.ch, 20) ?? 'other' });
    }
  }
  return out;
}

export async function POST(request: Request) {
  const env = readEnv(request.url);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // 501 tells the tracker statistics are not set up, so it keeps counting article views the old way
  if (!env || !serviceKey) return noContent(501);

  const ua = request.headers.get('user-agent');
  if (isBot(ua)) return noContent();

  // only our own pages may report (no cross-site posting)
  const siteHost = new URL(env.siteUrl).hostname.replace(/^www\./, '');
  const origin = request.headers.get('origin') ?? request.headers.get('referer');
  const originHost = refHost(origin);
  const requestHost = new URL(request.url).hostname.replace(/^www\./, '');
  if (!originHost || (originHost !== siteHost && originHost !== requestHost)) return noContent();

  const text = await request.text();
  if (!text || text.length > MAX_BODY) return noContent();
  let body: Body;
  try {
    body = JSON.parse(text) as Body;
  } catch {
    return noContent();
  }
  if (!Array.isArray(body.e) || body.e.length === 0) return noContent();
  const events = shapeEvents(body.e as InEvent[], siteHost);
  if (!events.length) return noContent();

  const visitor = typeof body.v === 'string' && ID_RE.test(body.v) ? body.v : null;
  const session = typeof body.s === 'string' && ID_RE.test(body.s) ? body.s : null;
  const client = classifyUa(ua ?? '');

  try {
    await fetch(`${env.supabaseUrl}/rest/v1/rpc/stats_ingest`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ p_visitor: visitor, p_session: session, p_events: events, p_device: client.device, p_browser: client.browser, p_os: client.os }),
    });
  } catch {
    // statistics must never break the site
  }
  return noContent();
}

export function GET() {
  return noContent(405);
}
