// Captures /dev fixture screens (fake data) with the system Chrome.
// usage: node capture.mjs <baseUrl> <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

// [file name, path, viewport, fullPage]
const D = { width: 1440, height: 900 };
const M = { width: 390, height: 844, isMobile: true, hasTouch: true };
const shots = [
  ['pub-home', '/dev/home', D, false],
  ['pub-home-mobile', '/dev/home', M, false],
  ['pub-section', '/dev/section', D, false],
  ['pub-article', '/dev/article', D, false],
  ['pub-article-mobile', '/dev/article', M, false],
  ['pub-search', '/dev/search', D, false],
  ['pub-archives', '/dev/archives', D, false],
  ['pub-submit', '/dev/submit', D, false],
  ['pub-submit-event', '/dev/submit/event', D, false],
  ['pub-contact', '/dev/contact', D, false],
  ['pub-sports-landing', '/dev/sports', D, false],
  ['sk-tally', '/dev/salingkusog', D, false],
  ['sk-tally-mobile', '/dev/salingkusog', M, false],
  ['sk-tally-final', '/dev/salingkusog/final', D, false],
  ['sk-schedule', '/dev/salingkusog/schedule', D, false],
  ['sk-winners', '/dev/salingkusog/winners', D, false],
  ['sk-faction', '/dev/salingkusog/factions', D, false],
  ['sk-bracket', '/dev/salingkusog/sports/auto-bracket', D, true],
  ['sk-round-robin', '/dev/salingkusog/sports/auto-round-robin', D, false],
  ['sk-contest-results', '/dev/salingkusog/sports/contest-race', D, true],
  ['sk-contest-lineup', '/dev/salingkusog/sports/contest-dance', D, false],
  ['sk-match-recap', '/dev/salingkusog/match', D, false],
  ['sk-venues', '/dev/salingkusog/venues', D, false],
  ['sk-countdown', '/dev/countdown', D, false],
  ['adm-login', '/admin/login', D, false],
  ['adm-dashboard', '/dev/admin', D, false],
  ['adm-dashboard-writer', '/dev/admin/writer', D, false],
  ['adm-articles', '/dev/admin/articles', D, false],
  ['adm-editor', '/dev/admin/editor', D, false],
  ['adm-media', '/dev/admin/media', D, false],
  ['adm-intake', '/dev/admin/intake', D, false],
  ['adm-sk-team', '/dev/admin/salingkusog-team', D, false],
  ['adm-sk-setup', '/dev/admin/salingkusog-setup', D, true],
  ['adm-sk-scores', '/dev/admin/salingkusog-scores', D, false],
  ['adm-sk-scorekeeper', '/dev/admin/salingkusog-scorekeeper', D, false],
  ['adm-sk-scorekeeper-mobile', '/dev/admin/salingkusog-scorekeeper', M, false],
  ['adm-sk-results', '/dev/admin/salingkusog-results', D, false],
  ['adm-sk-awards', '/dev/admin/salingkusog-awards', D, false],
  ['adm-sk-cards', '/dev/admin/salingkusog-cards', D, false],
  ['adm-access-pending', '/dev/auth/pending', D, false],
];

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
for (const [name, path, vp, full] of shots) {
  await page.setViewport({ ...vp, deviceScaleFactor: 1 });
  try {
    await page.goto(base + path, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500)); // count-up animations and fonts
    await page.screenshot({ path: join(outDir, name + '.png'), fullPage: full });
    console.log('ok  ', name);
  } catch (e) {
    console.log('FAIL', name, String(e).slice(0, 120));
  }
}
await browser.close();
