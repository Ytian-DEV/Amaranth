import { autoExcerpt, slugify } from './slug';

describe('slugify', () => {
  it('matches the database rules', () => {
    expect(slugify('Inside the campus fight — Mt. Pangasugan!')).toBe('inside-the-campus-fight-mt-pangasugan');
    expect(slugify('  Ñino’s Café  ')).toBe('nino-s-cafe');
    expect(slugify('a'.repeat(100)).length).toBe(80);
  });
});

describe('autoExcerpt', () => {
  it('cuts at a word boundary', () => {
    const text = 'word '.repeat(80);
    const out = autoExcerpt(text, 50);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(51);
  });
  it('keeps short text', () => {
    expect(autoExcerpt('  Short  text ')).toBe('Short text');
  });
});
