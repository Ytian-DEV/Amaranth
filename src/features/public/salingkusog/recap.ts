// Match recap helpers.
import type { SkMatchRow, SkPlacementRow, SkStatPair } from '@/lib/database.types';

/** "3–0 in tournament": this side's record in the game's event (finished games only). */
export function eventRecord(factionId: string | null, eventId: string, matches: Pick<SkMatchRow, 'event_id' | 'status' | 'side_a_id' | 'side_b_id' | 'winner_side'>[]) {
  if (!factionId) return null;
  const games = matches.filter((m) => m.event_id === eventId && m.status === 'final' && (m.side_a_id === factionId || m.side_b_id === factionId));
  if (!games.length) return null;
  const wins = games.filter((m) => (m.side_a_id === factionId ? m.winner_side === 'a' : m.winner_side === 'b')).length;
  const losses = games.filter((m) => (m.side_a_id === factionId ? m.winner_side === 'b' : m.winner_side === 'a')).length;
  return `${wins}–${losses} in tournament`;
}

const placeWord: Record<number, string> = { 1: 'Champion', 2: 'Runner-up', 3: 'Bronze' };

/** "Champion" when this game decided the event and the result is in. */
export function sideTitle(factionId: string | null, eventId: string, placements: Pick<SkPlacementRow, 'event_id' | 'faction_id' | 'athlete_id' | 'place'>[]) {
  const p = placements.find((x) => x.event_id === eventId && x.faction_id === factionId && !x.athlete_id);
  return p ? (placeWord[p.place] ?? null) : null;
}

/** Bars for a team stat: share of the total for each side ("46%" vs "41%", "42" vs "35"). */
export function statShares(s: Pick<SkStatPair, 'a' | 'b'>) {
  const num = (v: string) => Number.parseFloat(String(v).replace(/[^\d.-]/g, ''));
  const [a, b] = [num(s.a), num(s.b)];
  if (!Number.isFinite(a) || !Number.isFinite(b) || a + b <= 0) return { a: 0.5, b: 0.5 };
  return { a: a / (a + b), b: b / (a + b) };
}

/** Columns of the period table, with the total last. */
export const periodColumns = (m: Pick<SkMatchRow, 'periods'>) => m.periods.map((p) => p.label);
