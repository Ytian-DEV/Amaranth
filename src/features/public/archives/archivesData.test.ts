import { monthLabel, monthRange } from './archivesData';

describe('archive months', () => {
  it('builds Manila-time ranges', () => {
    expect(monthRange('2026-10')).toEqual(['2026-10-01T00:00:00+08:00', '2026-11-01T00:00:00+08:00']);
    expect(monthRange('2026-12')?.[1]).toBe('2027-01-01T00:00:00+08:00');
  });
  it('rejects junk', () => {
    expect(monthRange('2026-13')).toBeNull();
    expect(monthRange('oct-2026')).toBeNull();
  });
  it('labels months', () => {
    expect(monthLabel('2026-10')).toBe('October 2026');
  });
});
