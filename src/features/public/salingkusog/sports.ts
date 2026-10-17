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

/** Knockout games by bracket column (round_order), top to bottom; the bronze game is kept apart. */
export function bracketColumns<T extends Pick<SkMatchRow, 'round' | 'round_order' | 'bracket_slot' | 'scheduled_at'>>(games: T[]) {
  const bronze = games.find((g) => isBronzeRound(g.round)) ?? null;
  const main = games.filter((g) => g !== bronze);
  const orders = [...new Set(main.map((g) => g.round_order))].sort((a, b) => a - b);
  const columns: BracketColumn<T>[] = orders.map((order) => {
    const matches = main
      .filter((g) => g.round_order === order)
      .sort((a, b) => (a.bracket_slot ?? 99) - (b.bracket_slot ?? 99) || a.scheduled_at.localeCompare(b.scheduled_at));
    return { order, title: roundTitle(matches.map((m) => m.round), order), matches };
  });
  return { columns, bronze };
}

export const formatLine = (format: SkFormat, hasBronze: boolean) =>
  format === 'bracket' ? (hasBronze ? 'Single elimination + bronze game' : 'Single elimination') : format === 'round_robin' ? 'Round robin' : format === 'timed' ? 'Timed final' : 'Judged';

export type TableRow = { factionId: string; played: number; wins: number; losses: number; draws: number; pf: number; pa: number };

/** Round-robin standings from finished games: wins, then point difference. */
export function roundRobinTable(games: Pick<SkMatchRow, 'status' | 'side_a_id' | 'side_b_id' | 'score_a' | 'score_b'>[]) {
  const rows = new Map<string, TableRow>();
  const row = (id: string) => rows.get(id) ?? rows.set(id, { factionId: id, played: 0, wins: 0, losses: 0, draws: 0, pf: 0, pa: 0 }).get(id)!;
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
  return [...rows.values()].sort((x, y) => y.wins - x.wins || y.pf - y.pa - (x.pf - x.pa) || y.pf - x.pf);
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
