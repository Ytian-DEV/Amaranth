import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// @ts-expect-error plain ESM script without types
import { check, parseTokens } from '../../scripts/check-contrast.mjs';

describe('design tokens', () => {
  it('meet WCAG AA for every text pair', () => {
    const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8');
    const failures = (check(parseTokens(css)) as { ok: boolean; fg: string; bg: string }[]).filter((r) => !r.ok);
    expect(failures).toEqual([]);
  });
});
