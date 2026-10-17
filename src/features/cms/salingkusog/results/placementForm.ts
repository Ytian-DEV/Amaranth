import type { SkPlacementInput } from '@/lib/database.types';

export type Row = { key: number; place: string; faction_id: string; athlete_id: string; result: string; awarded_on: string };
let seq = 0;
export const toRow = (p: Partial<SkPlacementInput>, day: string): Row => ({
  key: ++seq,
  place: String(p.place ?? ''),
  faction_id: p.faction_id ?? '',
  athlete_id: p.athlete_id ?? '',
  result: p.result ?? '',
  awarded_on: p.awarded_on ?? day,
});

/** Turns the form into RPC rows, or returns an error message. */
export function toPlacementInput(rows: Row[], isTeam: boolean): SkPlacementInput[] | string {
  const filled = rows.filter((r) => r.faction_id || r.athlete_id || r.result.trim());
  for (const r of filled) {
    const place = Number(r.place);
    if (!Number.isInteger(place) || place < 1 || place > 64) return 'Every place must be a whole number from 1 to 64.';
    if (!r.faction_id) return `Choose the faction for place ${r.place}.`;
    if (!isTeam && !r.athlete_id) return `Choose the athlete for place ${r.place} (individual event).`;
  }
  return filled.map((r) => ({ place: Number(r.place), faction_id: r.faction_id, athlete_id: r.athlete_id || null, result: r.result.trim() || null, awarded_on: r.awarded_on || null }));
}
