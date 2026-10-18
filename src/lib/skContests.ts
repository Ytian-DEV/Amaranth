// Contests: every faction competes in one session (dance, swimming, athletics, painting…).
// The line-up and results are sk_entries rows; these helpers rank and format them.
import type { SkEntryRow, SkEntryStatus, SkEventRow, SkMatchRow, SkPlacementInput } from './database.types';
import { manilaDate } from './manila';

type Event = Pick<SkEventRow, 'format' | 'result_unit' | 'is_team'>;

export const isContestFormat = (format: SkEventRow['format']) => format === 'timed' || format === 'judged';

export const entryStatusLabels: Record<SkEntryStatus, string> = { ok: 'Competing', dns: 'Did not start', dnf: 'Did not finish', dq: 'Disqualified' };
export const entryStatusShort: Record<SkEntryStatus, string> = { ok: '', dns: 'DNS', dnf: 'DNF', dq: 'DQ' };

/** Times: the lowest wins. Distances, heights and points: the highest wins. */
export const isTimeUnit = (unit: string | null) => /^(s|sec|secs|seconds?|time)$/i.test((unit ?? '').trim());
export const lowerWins = (event: Event) => event.format === 'timed' && isTimeUnit(event.result_unit);

/** "1:02.45" → 62.45, "12.84" → 12.84, "5.42 m" → 5.42; "" → null; anything else → undefined. */
export function parseResult(text: string): number | null | undefined {
  const t = text.trim().replace(/\s*(s|secs?|seconds?|m|metres?|meters?|pts?|points?)$/i, '');
  if (!t) return null;
  const clock = /^(\d+):([0-5]?\d(?:\.\d+)?)$/.exec(t);
  if (clock) return Math.round((Number(clock[1]) * 60 + Number(clock[2])) * 1000) / 1000;
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : undefined;
}

/** 62.45 s → "1:02.45", 12.84 s → "12.84s", 5.42 m → "5.42 m", 87.5 pts → "87.5 pts". */
export function formatResult(value: number | null, unit: string | null) {
  if (value === null) return '';
  const u = (unit ?? '').trim();
  if (isTimeUnit(u)) {
    if (value >= 60) {
      const min = Math.floor(value / 60);
      const sec = (value - min * 60).toFixed(2).padStart(5, '0');
      return `${min}:${sec}`;
    }
    return `${value.toFixed(2)}s`;
  }
  const n = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
  return u ? `${n} ${u}` : n;
}

export type RankedEntry<T> = T & { rank: number | null };

/**
 * Places for a session: judged events use the place staff entered; timed and measured ones rank
 * by result. Equal results (or equal places) share a place. Returns ranked entries first, then
 * the ones without a result yet (by performance order), then DNS / DNF / DQ.
 */
export function rankEntries<T extends Pick<SkEntryRow, 'lane' | 'result' | 'place' | 'status'>>(event: Event, entries: T[]): RankedEntry<T>[] {
  const ok = entries.filter((e) => e.status === 'ok');
  const rankOf = new Map<T, number>();
  if (event.format === 'judged') {
    for (const e of ok) if (e.place !== null) rankOf.set(e, e.place);
  } else {
    const dir = lowerWins(event) ? 1 : -1;
    const timed = ok.filter((e) => e.result !== null);
    // competition ranking: 1 + how many did better, so equal results share a place
    for (const e of timed) rankOf.set(e, 1 + timed.filter((o) => dir * (o.result! - e.result!) < 0).length);
  }
  const byLane = (a: T, b: T) => a.lane - b.lane;
  const ranked = ok.filter((e) => rankOf.has(e)).sort((a, b) => rankOf.get(a)! - rankOf.get(b)! || byLane(a, b));
  const waiting = ok.filter((e) => !rankOf.has(e)).sort(byLane);
  const out = entries.filter((e) => e.status !== 'ok').sort(byLane);
  return [...ranked.map((e) => ({ ...e, rank: rankOf.get(e)! })), ...[...waiting, ...out].map((e) => ({ ...e, rank: null }))];
}

/** Every competing entry has a result (timed / measured) or a place (judged). */
export function sessionComplete(event: Event, entries: Pick<SkEntryRow, 'result' | 'place' | 'status'>[]) {
  const ok = entries.filter((e) => e.status === 'ok');
  return ok.length > 0 && ok.every((e) => (event.format === 'judged' ? e.place !== null : e.result !== null));
}

/** Medals the session points to (places 1–3), for staff to confirm in Results. */
export function contestPodium(
  event: Event,
  session: Pick<SkMatchRow, 'ended_at' | 'scheduled_at'>,
  entries: Pick<SkEntryRow, 'faction_id' | 'athlete_id' | 'lane' | 'result' | 'place' | 'status'>[],
): SkPlacementInput[] {
  const day = manilaDate(session.ended_at ?? session.scheduled_at);
  return rankEntries(event, entries)
    .filter((e) => e.rank !== null && e.rank <= 3)
    .map((e) => ({
      place: e.rank!,
      faction_id: e.faction_id,
      athlete_id: event.is_team ? null : e.athlete_id,
      result: event.format === 'judged' ? null : formatResult(e.result, event.result_unit) || null,
      awarded_on: day,
    }));
}
