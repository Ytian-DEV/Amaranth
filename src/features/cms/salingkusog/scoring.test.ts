import { defaultDay, editionDays, fromLocalInput, manilaDate, matchesForDay, nextPeriodLabel, podiumFromGames, scoreSteps, statusActions, toLocalInput } from './scoring';

const edition = { starts_on: '2026-11-02', ends_on: '2026-11-04' };

describe('Manila time', () => {
  it('converts instants to the Philippine calendar day and back', () => {
    expect(manilaDate('2026-11-02T17:30:00Z')).toBe('2026-11-03');
    expect(toLocalInput('2026-11-02T23:15:00Z')).toBe('2026-11-03T07:15');
    expect(new Date(fromLocalInput('2026-11-03T07:15')).toISOString()).toBe('2026-11-02T23:15:00.000Z');
  });

  it('lists edition days and picks today when inside', () => {
    expect(editionDays(edition)).toEqual([
      { date: '2026-11-02', number: 1 },
      { date: '2026-11-03', number: 2 },
      { date: '2026-11-04', number: 3 },
    ]);
    expect(defaultDay(edition, '2026-11-03')).toBe('2026-11-03');
    expect(defaultDay(edition, '2026-10-01')).toBe('2026-11-02');
    expect(defaultDay(edition, '2027-01-01')).toBe('2026-11-04');
  });
});

it('orders a day: live first, then by time', () => {
  const m = (id: string, at: string, status: 'live' | 'upcoming' | 'final') => ({ id, scheduled_at: at, status });
  const list = [m('a', '2026-11-03T01:00:00Z', 'final'), m('b', '2026-11-03T05:00:00Z', 'live'), m('c', '2026-11-03T03:00:00Z', 'upcoming'), m('d', '2026-11-04T03:00:00Z', 'upcoming')];
  expect(matchesForDay(list, '2026-11-03').map((x) => x.id)).toEqual(['b', 'c', 'a']);
});

it('score steps and period labels follow the sport', () => {
  expect(scoreSteps({ slug: 'basketball', name: 'Basketball' })).toEqual([1, 2, 3]);
  expect(scoreSteps({ slug: 'volleyball', name: 'Volleyball' })).toEqual([1]);
  expect(nextPeriodLabel([], { slug: 'basketball', name: 'Basketball' })).toBe('Q1');
  expect(nextPeriodLabel(['Q1', 'Q2'])).toBe('Q3');
  expect(nextPeriodLabel([], { slug: 'volleyball', name: 'Volleyball' })).toBe('Set 1');
  expect(nextPeriodLabel(['OT'])).toBe('Period 2');
});

it('status actions', () => {
  expect(statusActions('upcoming').map((a) => a.to)).toEqual(['live', 'postponed', 'cancelled']);
  expect(statusActions('live')[0].to).toBe('final');
  expect(statusActions('final').map((a) => a.to)).toEqual(['live']);
});

describe('podiumFromGames', () => {
  const g = (round: string, order: number, a: string, b: string, winner: 'a' | 'b') => ({
    round,
    round_order: order,
    status: 'final' as const,
    side_a_id: a,
    side_b_id: b,
    winner_side: winner,
    ended_at: '2026-11-04T10:00:00Z',
    scheduled_at: '2026-11-04T08:00:00Z',
  });

  it('final + bronze game', () => {
    expect(podiumFromGames([g('Semifinal 1', 1, 'pt', 'sd', 'a'), g('Semifinal 2', 1, 'cv', 'mm', 'a'), g('Bronze game', 2, 'sd', 'mm', 'b'), g('Final', 2, 'pt', 'cv', 'b')])).toEqual([
      { place: 1, faction_id: 'cv', awarded_on: '2026-11-04' },
      { place: 2, faction_id: 'pt', awarded_on: '2026-11-04' },
      { place: 3, faction_id: 'mm', awarded_on: '2026-11-04' },
    ]);
  });

  it('no bronze game: both semifinal losers share third', () => {
    const rows = podiumFromGames([g('Semifinal 1', 1, 'pt', 'sd', 'a'), g('Semifinal 2', 1, 'cv', 'mm', 'b'), g('Final', 2, 'pt', 'mm', 'a')]);
    expect(rows.map((r) => `${r.place}${r.faction_id}`)).toEqual(['1pt', '2mm', '3sd', '3cv']);
  });

  it('nothing finished: no suggestion', () => {
    expect(podiumFromGames([])).toEqual([]);
  });
});
