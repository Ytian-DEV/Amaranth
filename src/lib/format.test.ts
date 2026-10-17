import { formatCompact, formatDate, formatReadingTime, formatRelative, joinMeta } from './format';

describe('format', () => {
  it('formats dates in Manila time', () => {
    // 23:30 UTC on Oct 14 is Oct 15 in Manila
    expect(formatDate('2026-10-14T23:30:00Z')).toBe('Oct 15, 2026');
    expect(formatDate(null)).toBe('');
  });

  it('formats reading time with a minimum of one minute', () => {
    expect(formatReadingTime(8)).toBe('8 min read');
    expect(formatReadingTime(0)).toBe('1 min read');
  });

  it('formats relative time', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    expect(formatRelative('2026-10-14T12:00:00Z', now)).toBe('2 days ago');
    expect(formatRelative('2026-10-16T07:00:00Z', now)).toBe('5 hours ago');
  });

  it('formats compact numbers', () => {
    expect(formatCompact(8400)).toBe('8.4k');
  });

  it('joins meta parts', () => {
    expect(joinMeta('By Staff', '', null, 'Oct 15, 2026')).toBe('By Staff · Oct 15, 2026');
  });
});
