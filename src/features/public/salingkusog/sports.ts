// Sport pages: bracket columns, round-robin table and leaders.
import type { SkEventLeaderRow, SkFormat, SkMatchRow } from '@/lib/database.types';
import { manilaDate } from '@/lib/manila';

export const isBronzeRound = (r: string | null) => /bronze|third|3rd/i.test(r ?? '');

/** "Semifinal 1" → "Semifinals", "Quarterfinal 2" → "Quarterfinals", "Final" → "Final". */
export function roundTitle(rounds: (string | null)[], order: number) {
  const names = [...new Set(rounds.filter(Boolean).map((r) => r!.replace(/\s*\d+$/, '').trim()))];
  if (names.length === 1) {
    const n = names[0];
    const many = rounds.length > 1;
    return many && !/s$/i.test(n) ? `${n}s` : n;
  }
  return names.length ? names.join(' / ') : `Round ${order + 1}`;
}

export type BracketColumn<T> = { order: number; title: string; matches: T[] };

/** Column from the round's name, for games typed in or imported without a round order. */
const nameOrder = (round: string | null) =>
  /quarter/i.test(round ?? '') ? 1 : /semi/i.test(round ?? '') ? 2 : /final/i.test(round ?? '') ? 3 : 0;

/** Knockout games by bracket column (round_order), top to bottom; the bronze game is kept apart. */
export function bracketColumns<T extends Pick<SkMatchRow, 'round' | 'round_order' | 'bracket_slot' | 'scheduled_at'>>(games: T[]) {
  const bronze = games.find((g) => isBronzeRound(g.round)) ?? null;
  const main = games.filter((g) => g !== bronze);
  // a final saved with the semifinals' round order would share their column: go by the names instead
  const byName = new Set(main.map((g) => g.round_order)).size < new Set(main.map((g) => nameOrder(g.round))).size;
  const orderOf = (g: T) => (byName ? nameOrder(g.round) : g.round_order);
  const orders = [...new Set(main.map(orderOf))].sort((a, b) => a - b);
  const columns: BracketColumn<T>[] = orders.map((order) => {
    const matches = main
      .filter((g) => orderOf(g) === order)
      .sort((a, b) => (a.bracket_slot ?? 99) - (b.bracket_slot ?? 99) || a.scheduled_at.localeCompare(b.scheduled_at));
    return { order, title: roundTitle(matches.map((m) => m.round), order), matches };
  });
  return { columns, bronze };
}

export const formatLine = (format: SkFormat, hasBronze: boolean) =>
  format === 'bracket'
    ? hasBronze
      ? 'Single elimination + bronze game'
      : 'Single elimination'
    : format === 'round_robin'
      ? 'Round robin'
      : format === 'round_robin_final'
        ? 'Round robin + final'
        : format === 'timed'
          ? 'Timed final'
          : 'Judged';

export type TableRow = { factionId: string; played: number; wins: number; losses: number; draws: number; pf: number; pa: number };

/**
 * Round-robin standings from finished games, ranked like app.sk_rr_table: wins, point difference,
 * wins against the teams level on both, points scored, then seed.
 */
export function roundRobinTable(games: Pick<SkMatchRow, 'status' | 'side_a_id' | 'side_b_id' | 'score_a' | 'score_b'>[], seeds: string[] = []) {
  const rows = new Map<string, TableRow>();
  const row = (id: string) => rows.get(id) ?? rows.set(id, { factionId: id, played: 0, wins: 0, losses: 0, draws: 0, pf: 0, pa: 0 }).get(id)!;
  for (const id of seeds) row(id);
  for (const g of games) {
    if (g.side_a_id) row(g.side_a_id);
    if (g.side_b_id) row(g.side_b_id);
    if (g.status !== 'final' || !g.side_a_id || !g.side_b_id || g.score_a === null || g.score_b === null) continue;
    const [a, b] = [row(g.side_a_id), row(g.side_b_id)];
    a.played++;
    b.played++;
    a.pf += g.score_a;
    a.pa += g.score_b;
    b.pf += g.score_b;
    b.pa += g.score_a;
    if (g.score_a > g.score_b) {
      a.wins++;
      b.losses++;
    } else if (g.score_b > g.score_a) {
      b.wins++;
      a.losses++;
    } else {
      a.draws++;
      b.draws++;
    }
  }
  const level = (x: TableRow, y: TableRow) => x.wins === y.wins && x.pf - x.pa === y.pf - y.pa;
  const h2h = (x: TableRow) =>
    games.filter((g) => {
      if (g.status !== 'final' || g.score_a === null || g.score_b === null) return false;
      const [me, opp, mine, theirs] = g.side_a_id === x.factionId ? [g.side_a_id, g.side_b_id, g.score_a, g.score_b] : [g.side_b_id, g.side_a_id, g.score_b, g.score_a];
      const o = opp ? rows.get(opp) : undefined;
      return me === x.factionId && !!o && level(o, x) && mine > theirs;
    }).length;
  const seed = (id: string) => (seeds.includes(id) ? seeds.indexOf(id) : 999);
  return [...rows.values()].sort((x, y) => y.wins - x.wins || y.pf - y.pa - (x.pf - x.pa) || h2h(y) - h2h(x) || y.pf - x.pf || seed(x.factionId) - seed(y.factionId));
}

/** The stat to rank by: PTS when present, else the most recorded one. */
export function leaderStat(rows: Pick<SkEventLeaderRow, 'stat'>[]) {
  if (rows.some((r) => r.stat.toUpperCase() === 'PTS')) return rows.find((r) => r.stat.toUpperCase() === 'PTS')!.stat;
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.stat, (counts.get(r.stat) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/** "Completed Oct 15", "In progress", "Starts Oct 14". */
export function eventStatusLine(games: Pick<SkMatchRow, 'status' | 'scheduled_at' | 'ended_at'>[], hasGold: boolean, fmt: (date: string) => string) {
  if (hasGold) {
    const last = games.filter((g) => g.status === 'final').map((g) => manilaDate(g.ended_at ?? g.scheduled_at)).sort().at(-1);
    return last ? `Completed ${fmt(last)}` : 'Completed';
  }
  if (games.some((g) => g.status === 'live' || g.status === 'final')) return 'In progress';
  const first = games.map((g) => manilaDate(g.scheduled_at)).sort()[0];
  return first ? `Starts ${fmt(first)}` : 'Schedule to follow';
}
