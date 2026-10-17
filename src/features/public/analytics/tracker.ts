// First-party statistics tracker (no third-party service). Events are queued and sent in
// batches to /api/e: every 10 s, and with navigator.sendBeacon when the page is hidden.
// Nothing is sent on dev/preview hosts or while staff are signed in. With Do Not Track /
// Global Privacy Control, only pageviews are sent, without any id.
import { env } from '@/lib/env';

const ENDPOINT = '/api/e';
const FLUSH_MS = 10_000;
const ENGAGEMENT_MS = 15_000;
const IDLE_MS = 30_000;
const SESSION_MS = 30 * 60_000;
const VISITOR_KEY = 'amaranth:v';
const SESSION_KEY = 'amaranth:s';

export type ShareChannel = 'facebook' | 'messenger' | 'x' | 'copy' | 'native' | 'other';
type Event =
  | { t: 'pv'; id: string; path: string; ref?: string; us?: string; um?: string; uc?: string }
  | { t: 'eng'; id: string; secs: number; scroll: number }
  | { t: 'share'; path: string; ch: ShareChannel };
/** off: not tracking here · ok: /api/e records views · legacy: /api/e not set up, count views the old way */
export type TrackerStatus = 'off' | 'ok' | 'legacy';

// ---------------------------------------------------------------- pure helpers (tested)

/** Only the production site counts (dev, previews and localhost never do). */
export function trackingAllowed(hostname: string, siteUrl: string | undefined, debug = false) {
  if (debug) return true;
  if (!siteUrl || /^(localhost|127\.|\[::1\])/.test(hostname) || hostname.endsWith('.local')) return false;
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, '') === hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
}

export function doNotTrack(nav: Partial<Navigator> & { globalPrivacyControl?: boolean }, win?: { doNotTrack?: string }) {
  return nav.doNotTrack === '1' || win?.doNotTrack === '1' || nav.globalPrivacyControl === true;
}

/** Keeps the session id while the visitor is active; a new one after 30 minutes away. */
export function nextSession(stored: { id: string; last: number } | null, now: number, newId: () => string) {
  return stored && now - stored.last < SESSION_MS ? { id: stored.id, last: now } : { id: newId(), last: now };
}

/** How far through the article body the reader has scrolled (0–100). */
export function scrollPercent(rect: { top: number; height: number }, viewportHeight: number) {
  if (rect.height <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((viewportHeight - rect.top) / rect.height) * 100)));
}

// ---------------------------------------------------------------- state

const uuid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`);

let enabled = false;
let dnt = false;
let started = false;
let queue: Event[] = [];
let current: { id: string; path: string; active: number; scroll: number; sentActive: number; sentScroll: number } | null = null;
let firstPageview = true;
let lastActivity = Date.now();
let memoryVisitor: string | null = null;
let memorySession: { id: string; last: number } | null = null;
let resolveStatus: (s: TrackerStatus) => void = () => undefined;
let status: TrackerStatus | null = null;
const statusPromise = new Promise<TrackerStatus>((r) => (resolveStatus = r));

function setStatus(s: TrackerStatus) {
  if (status) return;
  status = s;
  resolveStatus(s);
}

/** Resolves once the tracker knows whether /api/e records article views. */
export const trackerStatus = () => statusPromise;

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function visitorId() {
  if (dnt) return null;
  const ls = storage();
  try {
    let id = ls?.getItem(VISITOR_KEY) ?? memoryVisitor;
    if (!id) {
      id = uuid();
      ls?.setItem(VISITOR_KEY, id);
    }
    memoryVisitor = id;
    return id;
  } catch {
    memoryVisitor ??= uuid();
    return memoryVisitor;
  }
}

function sessionId() {
  if (dnt) return null;
  const ls = storage();
  let stored = memorySession;
  try {
    const raw = ls?.getItem(SESSION_KEY);
    if (raw) stored = JSON.parse(raw) as { id: string; last: number };
  } catch {
    // corrupt or blocked: start a new one
  }
  const next = nextSession(stored, Date.now(), uuid);
  memorySession = next;
  try {
    ls?.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next.id;
}

function flush(useBeacon = false) {
  if (!enabled || !queue.length) return;
  const batch = queue.splice(0, 25);
  const body = JSON.stringify({ v: visitorId(), s: sessionId(), e: batch });
  if (useBeacon && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }));
  } else {
    void fetch(ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'text/plain' } })
      .then((res) => setStatus(res.status === 501 ? 'legacy' : 'ok'))
      .catch(() => undefined);
  }
  if (queue.length) flush(useBeacon);
}

function queueEngagement() {
  if (!current || dnt) return;
  if (current.active === current.sentActive && current.scroll === current.sentScroll) return;
  current.sentActive = current.active;
  current.sentScroll = current.scroll;
  queue.push({ t: 'eng', id: current.id, secs: current.active, scroll: current.scroll });
}

function measureScroll() {
  if (!current) return;
  const body = document.querySelector('[data-track-body]');
  if (!body) return;
  const pct = scrollPercent(body.getBoundingClientRect(), window.innerHeight);
  if (pct > current.scroll) current.scroll = pct;
}

function start() {
  if (started) return;
  started = true;
  const activity = () => {
    lastActivity = Date.now();
  };
  for (const ev of ['pointerdown', 'keydown', 'touchstart', 'mousemove', 'wheel'] as const) window.addEventListener(ev, activity, { passive: true });
  window.addEventListener(
    'scroll',
    () => {
      activity();
      measureScroll();
    },
    { passive: true },
  );
  // active time: counts only while the tab is visible and the reader did something in the last 30 s
  window.setInterval(() => {
    if (enabled && current && document.visibilityState === 'visible' && Date.now() - lastActivity < IDLE_MS) current.active += 1;
  }, 1000);
  window.setInterval(() => {
    queueEngagement();
    flush();
  }, Math.min(FLUSH_MS, ENGAGEMENT_MS));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      queueEngagement();
      flush(true);
    } else activity();
  });
  window.addEventListener('pagehide', () => {
    queueEngagement();
    flush(true);
  });
}

// ---------------------------------------------------------------- public API

/** Turns tracking on or off for this page (production host, not signed in). */
export function configureTracker({ signedIn }: { signedIn: boolean }) {
  const allowed = typeof window !== 'undefined' && trackingAllowed(window.location.hostname, env.siteUrl, import.meta.env.VITE_STATS_DEBUG === 'true');
  dnt = typeof navigator !== 'undefined' && doNotTrack(navigator as Navigator & { globalPrivacyControl?: boolean }, window as unknown as { doNotTrack?: string });
  enabled = allowed && !signedIn;
  if (!enabled) {
    queue = [];
    current = null;
    // staff and dev hosts don't count at all; give the article page its answer
    if (!allowed || signedIn) setStatus('off');
    return;
  }
  start();
}

export function trackPageview(path: string) {
  if (!enabled) return;
  queueEngagement();
  current = { id: uuid(), path, active: 0, scroll: 0, sentActive: 0, sentScroll: 0 };
  lastActivity = Date.now();
  const event: Event = { t: 'pv', id: current.id, path };
  if (firstPageview) {
    // the first page carries the external referrer and campaign tags; later ones are internal
    if (document.referrer) event.ref = document.referrer;
    const q = new URLSearchParams(window.location.search);
    const us = q.get('utm_source');
    const um = q.get('utm_medium');
    const uc = q.get('utm_campaign');
    if (us) event.us = us.slice(0, 80);
    if (um) event.um = um.slice(0, 80);
    if (uc) event.uc = uc.slice(0, 80);
  } else {
    event.ref = window.location.origin;
  }
  queue.push(event);
  // send the first page right away so the article page learns whether views are recorded here
  if (firstPageview) flush();
  firstPageview = false;
  window.setTimeout(measureScroll, 1500);
}

export function trackShare(channel: ShareChannel) {
  if (!enabled || dnt) return;
  queue.push({ t: 'share', path: window.location.pathname, ch: channel });
  flush();
}
