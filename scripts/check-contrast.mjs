#!/usr/bin/env node
// WCAG contrast check for the colour tokens in src/styles/tokens.css.
// Fails (exit 1) when a pair used for text drops below its required ratio.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function parseTokens(css) {
  const tokens = {};
  for (const m of css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) tokens[m[1]] = m[2].toLowerCase();
  return tokens;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// [foreground, background, minimum ratio, where it's used]
export const pairs = [
  ['ink', 'paper', 4.5, 'body text'],
  ['ink', 'surface', 4.5, 'body text on cards'],
  ['ink-muted', 'paper', 4.5, 'meta / excerpts'],
  ['ink-muted', 'surface', 4.5, 'meta on cards'],
  ['ink-muted', 'green-soft', 4.5, 'meta in CTA'],
  ['green-700', 'paper', 4.5, 'links'],
  ['green-700', 'green-soft', 4.5, 'tags / published pill'],
  ['green-500-text', 'paper', 4.5, 'kickers'],
  ['green-500-text', 'surface', 4.5, 'kickers on cards'],
  ['lime-dark-text', 'lime-soft', 4.5, 'draft pill'],
  ['alert', 'paper', 4.5, 'errors'],
  ['alert', 'alert-soft', 4.5, 'rejected pill'],
  ['on-dark', 'green-700', 4.5, 'primary button / nav'],
  ['on-dark', 'green-900', 4.5, 'footer text'],
  ['on-dark-muted', 'green-900', 4.5, 'footer meta'],
  ['lime', 'green-900', 4.5, 'kickers on dark'],
  ['green-900', 'lime', 4.5, 'accent button'],
  ['status-review', 'status-review-soft', 4.5, 'review pill'],
  ['status-scheduled', 'status-scheduled-soft', 4.5, 'scheduled pill'],
  ['ink-muted', 'status-archived-soft', 4.5, 'archived pill'],
  ['lime-dark', 'paper', 3, 'large italic numerals (30px)'],
];

export function check(tokens) {
  return pairs.map(([fg, bg, min, use]) => {
    if (!tokens[fg] || !tokens[bg]) return { fg, bg, min, use, ratio: 0, ok: false, missing: true };
    const ratio = contrast(tokens[fg], tokens[bg]);
    return { fg, bg, min, use, ratio, ok: ratio >= min };
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('check-contrast.mjs')) {
  const css = readFileSync(resolve(import.meta.dirname, '../src/styles/tokens.css'), 'utf8');
  const results = check(parseTokens(css));
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗';
    console.log(`${mark} ${r.fg} on ${r.bg}: ${r.missing ? 'missing token' : r.ratio.toFixed(2)} (min ${r.min}) — ${r.use}`);
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`${failed.length} pair(s) fail WCAG contrast.`);
    process.exit(1);
  }
  console.log('All token pairs pass.');
}
