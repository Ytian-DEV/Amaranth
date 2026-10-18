import { isGroupGame, pendingSide } from './skSources';
import { bracketColumns, roundRobinTable } from '@/features/public/salingkusog/sports';
import { scheduleSize } from '@/features/cms/salingkusog/setup/buildSchedule';
import { suggestedPodium } from '@/features/cms/salingkusog/scoring';

const g = (id: string, round: string, round_order: number, extra: Record<string, unknown> = {}) =>
  ({ id, round, round_order, source_a: null, source_b: null, bracket_slot: null, scheduled_at: '2026-10-26T00:00:00Z', ...extra }) as never;

describe('generated games', () => {
  const semi = g('s1', 'Semifinal 1', 1);
  it('says where a side comes from', () => {
    expect(pendingSide(g('f', 'Final', 2, { source_a: 'winner:s1' }), 'a', [semi])).toBe('Winner of Semifinal 1');
    expect(pendingSide(g('b', 'Bronze game', 2, { source_b: 'loser:s1' }), 'b', [semi])).toBe('Loser of Semifinal 1');
    expect(pendingSide(g('f', 'Final', 4, { source_a: 'rank:2' }), 'a', [])).toBe('2nd in the standings');
    expect(pendingSide(g('r', 'Round 2 · Game 1', 2, { source_a: 'seed:3' }), 'a', [])).toBe('After Round 1');
    expect(pendingSide(g('x', 'Final', 1), 'a', [])).toBeNull();
    expect(isGroupGame({ source_a: 'seed:1' })).toBe(true);
    expect(isGroupGame({ source_a: 'rank:1' })).toBe(false);
  });

  it('puts a final saved with the semifinals’ round order in its own column', () => {
    const games = [g('a', 'Semifinal 1', 0, { bracket_slot: 1 }), g('b', 'Semifinal 2', 0, { bracket_slot: 2 }), g('c', 'Final', 0), g('d', 'Bronze game', 0)];
    const { columns, bronze } = bracketColumns(games);
    expect(columns.map((c) => c.matches.map((m: { id: string }) => m.id))).toEqual([['a', 'b'], ['c']]);
    expect((bronze as { id: string } | null)?.id).toBe('d');
  });

  it('counts the games a build creates', () => {
    expect(scheduleSize('bracket', 4, true)).toEqual({ games: 4, rounds: 2 });
    expect(scheduleSize('bracket', 3, true)).toEqual({ games: 2, rounds: 2 });
    expect(scheduleSize('bracket', 8, false)).toEqual({ games: 7, rounds: 3 });
    expect(scheduleSize('round_robin', 4, true)).toEqual({ games: 6, rounds: 3 });
    expect(scheduleSize('round_robin', 5, true)).toEqual({ games: 10, rounds: 5 });
    expect(scheduleSize('round_robin_final', 4, true)).toEqual({ games: 8, rounds: 4 });
  });
});

describe('round-robin standings and medals', () => {
  const game = (a: string, b: string, sa: number, sb: number, status = 'final') =>
    ({ side_a_id: a, side_b_id: b, score_a: sa, score_b: sb, status, round: 'Round 1', round_order: 1, winner_side: sa > sb ? 'a' : sb > sa ? 'b' : null, ended_at: '2026-10-27T05:00:00Z', scheduled_at: '2026-10-27T04:00:00Z', source_a: 'seed:1' }) as never;

  it('breaks a tie on wins and difference by the head-to-head game', () => {
    // x and y: 1 win each, +1 each; y beat x, so y is ahead even though x is the higher seed
    const games = [game('y', 'x', 2, 0), game('x', 'w', 4, 1), game('z', 'y', 1, 0), game('z', 'w', 5, 0)];
    expect(roundRobinTable(games, ['x', 'y', 'z', 'w']).map((r) => r.factionId)).toEqual(['z', 'y', 'x', 'w']);
  });

  it('suggests medals only when every game is final', () => {
    const games = [game('x', 'y', 3, 1), game('z', 'w', 2, 0), game('x', 'z', 1, 0, 'live')];
    expect(suggestedPodium({ format: 'round_robin', seeds: [] }, games)).toEqual([]);
    const done = [game('x', 'y', 3, 1), game('z', 'w', 2, 0), game('x', 'z', 1, 0)];
    expect(suggestedPodium({ format: 'round_robin', seeds: [] }, done).map((p) => [p.place, p.faction_id])).toEqual([[1, 'x'], [2, 'z'], [3, 'y']]);
  });
});
