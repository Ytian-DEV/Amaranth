import { contestPodium, formatResult, lowerWins, parseResult, rankEntries, sessionComplete } from './skContests';

const entry = (faction_id: string, lane: number, extra: Partial<{ result: number | null; place: number | null; status: 'ok' | 'dns' | 'dnf' | 'dq'; athlete_id: string | null }> = {}) => ({
  faction_id,
  lane,
  result: null,
  place: null,
  status: 'ok' as const,
  athlete_id: null,
  ...extra,
});
const swim = { format: 'timed' as const, result_unit: 's', is_team: false };
const jump = { format: 'timed' as const, result_unit: 'm', is_team: false };
const dance = { format: 'judged' as const, result_unit: null, is_team: true };

describe('contest results', () => {
  it('reads and writes times, distances and points', () => {
    expect(parseResult('1:02.45')).toBe(62.45);
    expect(parseResult('12.84')).toBe(12.84);
    expect(parseResult('5.42 m')).toBe(5.42);
    expect(parseResult('')).toBeNull();
    expect(parseResult('fast')).toBeUndefined();
    expect(formatResult(62.45, 's')).toBe('1:02.45');
    expect(formatResult(12.8, 's')).toBe('12.80s');
    expect(formatResult(5.42, 'm')).toBe('5.42 m');
    expect(formatResult(null, 'm')).toBe('');
  });

  it('times: fastest first, ties share a place, DNF last', () => {
    expect(lowerWins(swim)).toBe(true);
    const ranked = rankEntries(swim, [entry('a', 1, { result: 31.2 }), entry('b', 2, { result: 30.1 }), entry('c', 3, { result: 31.2 }), entry('d', 4, { status: 'dnf' }), entry('e', 5)]);
    expect(ranked.map((e) => [e.faction_id, e.rank])).toEqual([['b', 1], ['a', 2], ['c', 2], ['e', null], ['d', null]]);
  });

  it('distances: longest first', () => {
    expect(lowerWins(jump)).toBe(false);
    expect(rankEntries(jump, [entry('a', 1, { result: 5.1 }), entry('b', 2, { result: 5.6 })]).map((e) => e.faction_id)).toEqual(['b', 'a']);
  });

  it('judged: the places staff enter, shared places allowed', () => {
    const ranked = rankEntries(dance, [entry('a', 1, { place: 2 }), entry('b', 2, { place: 1 }), entry('c', 3, { place: 2 })]);
    expect(ranked.map((e) => [e.faction_id, e.rank])).toEqual([['b', 1], ['a', 2], ['c', 2]]);
  });

  it('suggests medals once every entry has a result', () => {
    const session = { ended_at: '2026-10-27T06:00:00Z', scheduled_at: '2026-10-27T05:00:00Z' };
    const entries = [entry('a', 1, { result: 31.2, athlete_id: 'x' }), entry('b', 2, { result: 30.1, athlete_id: 'y' }), entry('c', 3, { status: 'dq' })];
    expect(sessionComplete(swim, entries)).toBe(true);
    expect(sessionComplete(swim, [...entries, entry('d', 4)])).toBe(false);
    expect(contestPodium(swim, session, entries)).toEqual([
      { place: 1, faction_id: 'b', athlete_id: 'y', result: '30.10s', awarded_on: '2026-10-27' },
      { place: 2, faction_id: 'a', athlete_id: 'x', result: '31.20s', awarded_on: '2026-10-27' },
    ]);
  });
});
