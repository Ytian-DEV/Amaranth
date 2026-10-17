// Traffic classification for /api/e: bots, device/browser/OS and the source of a visit.
// Everything here works on the user-agent and the referrer's host only; neither is stored as-is.
import { CRAWLER_UA } from './seo.js';

/** Crawlers, preview fetchers, headless browsers, monitors and scripts. */
const BOT_UA =
  /bot|crawl|spider|slurp|preview|headless|phantomjs|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|python|curl|wget|axios|node-fetch|go-http|java\/|okhttp|httpclient|scrapy|selenium|puppeteer|playwright/i;

export function isBot(ua: string | null | undefined) {
  if (!ua || ua.length < 20) return true;
  return CRAWLER_UA.test(ua) || BOT_UA.test(ua);
}

export type ClientInfo = { device: 'mobile' | 'tablet' | 'desktop'; browser: string; os: string };

/** Coarse device/browser/OS families (no versions, nothing identifying). */
export function classifyUa(ua: string): ClientInfo {
  const tablet = /ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i.test(ua);
  const mobile = !tablet && /mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua);
  const browser = /edg\//i.test(ua)
    ? 'Edge'
    : /opr\/|opera/i.test(ua)
      ? 'Opera'
      : /samsungbrowser/i.test(ua)
        ? 'Samsung Internet'
        : /fban|fbav|fb_iab|messenger/i.test(ua)
          ? 'Facebook app'
          : /firefox|fxios/i.test(ua)
            ? 'Firefox'
            : /chrome|crios/i.test(ua)
              ? 'Chrome'
              : /safari/i.test(ua)
                ? 'Safari'
                : 'Other';
  const os = /iphone|ipad|ipod/i.test(ua)
    ? 'iOS'
    : /android/i.test(ua)
      ? 'Android'
      : /windows/i.test(ua)
        ? 'Windows'
        : /mac os x|macintosh/i.test(ua)
          ? 'macOS'
          : /cros/i.test(ua)
            ? 'ChromeOS'
            : /linux/i.test(ua)
              ? 'Linux'
              : 'Other';
  return { device: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop', browser, os };
}

const SOCIAL = /(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com|instagram\.com|t\.co|twitter\.com|x\.com|threads\.net|tiktok\.com|youtube\.com|youtu\.be|reddit\.com|linkedin\.com|lnkd\.in|pinterest\.com|telegram\.org|t\.me|discord\.com|viber\.com)$/i;
const SEARCH = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.com|search\.yahoo\.com|yandex\.[a-z]+|baidu\.com|ecosia\.org|search\.brave\.com|startpage\.com)$/i;

export type Source = 'direct' | 'social' | 'search' | 'referral' | 'internal' | 'campaign';

/** Normalises a referrer to its host ("www." dropped), or null. */
export function refHost(ref: string | null | undefined) {
  if (!ref) return null;
  try {
    const host = new URL(ref.includes('://') ? ref : `https://${ref}`).hostname.toLowerCase().replace(/^www\./, '');
    return /^[a-z0-9.-]{1,120}$/.test(host) ? host : null;
  } catch {
    return null;
  }
}

/** Direct, social, search, other referral, internal (same site) or a tagged campaign link. */
export function classifySource(host: string | null, siteHost: string, utmSource?: string | null): Source {
  if (host && host === siteHost.replace(/^www\./, '')) return 'internal';
  if (host && SOCIAL.test(host)) return 'social';
  if (host && SEARCH.test(host)) return 'search';
  if (utmSource) return 'campaign';
  if (host) return 'referral';
  return 'direct';
}
