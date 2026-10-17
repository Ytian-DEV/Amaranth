import { shapeEvents } from '../e';
import { classifySource, classifyUa, isBot, refHost } from './traffic';

const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const SAFARI_IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const EDGE_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0';
const FB_APP = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0]';

describe('bots', () => {
  it.each([
    ['facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'],
    ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
    ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0 Safari/537.36'],
    ['curl/8.4.0'],
    [''],
  ])('drops %s', (ua) => expect(isBot(ua)).toBe(true));

  it('keeps real browsers', () => {
    for (const ua of [CHROME_ANDROID, SAFARI_IPAD, EDGE_WIN, FB_APP]) expect(isBot(ua)).toBe(false);
  });
});

describe('classifyUa', () => {
  it('reduces the user-agent to families', () => {
    expect(classifyUa(CHROME_ANDROID)).toEqual({ device: 'mobile', browser: 'Chrome', os: 'Android' });
    expect(classifyUa(SAFARI_IPAD)).toEqual({ device: 'tablet', browser: 'Safari', os: 'iOS' });
    expect(classifyUa(EDGE_WIN)).toEqual({ device: 'desktop', browser: 'Edge', os: 'Windows' });
    expect(classifyUa(FB_APP)).toEqual({ device: 'mobile', browser: 'Facebook app', os: 'iOS' });
  });
});

describe('traffic source', () => {
  it('classifies referrers', () => {
    expect(refHost('https://www.Facebook.com/some/post?x=1')).toBe('facebook.com');
    expect(refHost('not a url at all ://')).toBeNull();
    expect(classifySource('l.facebook.com', 'amaranth.vsu.edu.ph')).toBe('social');
    expect(classifySource('t.co', 'amaranth.vsu.edu.ph')).toBe('social');
    expect(classifySource('google.com.ph', 'amaranth.vsu.edu.ph')).toBe('search');
    expect(classifySource('vsu.edu.ph', 'amaranth.vsu.edu.ph')).toBe('referral');
    expect(classifySource('amaranth.vsu.edu.ph', 'www.amaranth.vsu.edu.ph')).toBe('internal');
    expect(classifySource(null, 'amaranth.vsu.edu.ph', 'newsletter')).toBe('campaign');
    expect(classifySource(null, 'amaranth.vsu.edu.ph')).toBe('direct');
  });
});

describe('shapeEvents', () => {
  it('keeps known events, drops the rest and never forwards a full referrer', () => {
    const out = shapeEvents(
      [
        { t: 'pv', id: '10000000-0000-0000-0000-000000000001', path: '/article/x', ref: 'https://m.facebook.com/story.php?id=123', us: 'fb' },
        { t: 'eng', id: '10000000-0000-0000-0000-000000000001', secs: 99999, scroll: 140 },
        { t: 'share', path: '/article/x', ch: 'facebook' },
        { t: 'share', path: '/about', ch: 'x' },
        { t: 'pv', id: 'x', path: 'no-slash' },
        { t: 'evil', id: 'x' },
      ],
      'amaranth.vsu.edu.ph',
    );
    expect(out).toEqual([
      { t: 'pv', id: '10000000-0000-0000-0000-000000000001', path: '/article/x', src: 'social', ref: 'm.facebook.com', us: 'fb' },
      { t: 'eng', id: '10000000-0000-0000-0000-000000000001', secs: 14400, scroll: 100 },
      { t: 'share', path: '/article/x', ch: 'facebook' },
    ]);
  });
});
