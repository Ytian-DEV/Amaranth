// Pure helpers for the scorekeeper, results and awards screens. Salingkusog runs on Philippine time (UTC+8, no DST).
import type { SkEditionRow, SkMatchRow, SkMatchStatus, SkPlacementInput, SkSportRow } from '@/lib/database.types';
import { dayRange, manilaDate, manilaTime } from '@/lib/manila';

export { manilaDate, manilaTime };

/** <input type="datetime-local"> value (Manila) ↔ ISO instant. */
export const toLocalInput = (iso: string) => `${manilaDate(iso)}T${manilaTime(iso)}`;
export const fromLocalInput = (local: string) => `${local}:00+08:00`;

/** Every competition day of an edition: [{ date, number }]. */
export const editionDays = (edition: Pick<SkEditionRow, 'starts_on' | 'ends_on'>) => dayRange(edition.starts_on, edition.ends_on);

/** Today if it falls inside the edition, else its first (or last, once over) day. */
export function defaultDay(edition: Pick<SkEditionRow, 'starts_on' | 'ends_on'>, today = manilaDate()) {
  if (today < edition.starts_on) return edition.starts_on;
  if (today > edition.ends_on) return edition.ends_on;
  return today;
}

const statusRank: Record<SkMatchStatus, number> = { live: 0, upcoming: 1, postponed: 2, final: 3, cancelled: 4 };

/** One day's games: live first, then by start time. */
export function matchesForDay<T extends Pick<SkMatchRow, 'scheduled_at' | 'status'>>(matches: T[], day: string) {
  return matches
    .filter((m) => manilaDate(m.scheduled_at) === day)
    .sort((a, b) => statusRank[a.status] - statusRank[b.status] || a.scheduled_at.localeCompare(b.scheduled_at));
}

/** Score buttons per sport: basketball counts 1/2/3, everything else 1 at a time. */
export function scoreSteps(sport: Pick<SkSportRow, 'slug' | 'name'> | undefined) {
  const s = `${sport?.slug ?? ''} ${sport?.name ?? ''}`.toLowerCase();
  return /basket/.test(s) ? [1, 2, 3] : [1];
}

/** Next period label from the existing ones: Q1→Q2, Set 2→Set 3, else Period n. */
export function nextPeriodLabel(labels: string[], sport?: Pick<SkSportRow, 'slug' | 'name'>) {
  const last = labels.at(-1);
  const m = last?.match(/^(.*?)(\d+)$/);
  if (m) return `${m[1]}${Number(m[2]) + 1}`;
  const s = `${sport?.slug ?? ''} ${sport?.name ?? ''}`.toLowerCase();
  if (/basket/.test(s)) return 'Q1';
  if (/volley|tennis|badminton|table|sepak/.test(s)) return 'Set 1';
  return labels.length ? `Period ${labels.length + 1}` : 'Period 1';
}

export const clampScore = (n: number) => Math.max(0, Math.round(n * 100) / 100);

export type StatusAction = { to: SkMatchStatus; label: string; tone: 'primary' | 'outline' | 'ghost' | 'danger' };

/** What the scorekeeper can do next from a status. */
export function statusActions(status: SkMatchStatus): StatusAction[] {
  switch (status) {
    case 'upcoming':
      return [
        { to: 'live', label: 'Start game', tone: 'primary' },
        { to: 'postponed', label: 'Postpone', tone: 'ghost' },
        { to: 'cancelled', label: 'Cancel game', tone: 'ghost' },
      ];
    case 'live':
      return [
        { to: 'final', label: 'Finish game', tone: 'primary' },
        { to: 'upcoming', label: 'Back to not started', tone: 'ghost' },
      ];
    case 'final':
      return [{ to: 'live', label: 'Reopen (fix the score)', tone: 'outline' }];
    case 'postponed':
    case 'cancelled':
      return [{ to: 'upcoming', label: 'Back on the schedule', tone: 'outline' }];
  }
}

export const statusLabels: Record<SkMatchStatus, string> = { upcoming: 'Not started', live: 'Live', final: 'Final', postponed: 'Postponed', cancelled: 'Cancelled' };

export const medalForPlace = (place: number) => (place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : null);

/**
 * Suggested podium for a bracket event from its finished games:
 * the final's winner → 1st, loser → 2nd, bronze game winner → 3rd
 * (or both semifinal losers → 3rd when there was no bronze game).
 */
export function podiumFromGames(games: Pick<SkMatchRow, 'round' | 'round_order' | 'status' | 'side_a_id' | 'side_b_id' | 'winner_side' | 'ended_at' | 'scheduled_at'>[]): SkPlacementInput[] {
  const done = games.filter((g) => g.status === 'final' && g.winner_side && g.side_a_id && g.side_b_id);
  const sides = (g: (typeof done)[number]) => (g.winner_side === 'a' ? [g.side_a_id!, g.side_b_id!] : [g.side_b_id!, g.side_a_id!]);
  const isBronze = (r: string | null) => /bronze|third|3rd/i.test(r ?? '');
  const isFinal = (r: string | null) => /final/i.test(r ?? '') && !/semi|quarter/i.test(r ?? '') && !isBronze(r);
  const final = done.find((g) => isFinal(g.round)) ?? [...done].filter((g) => !isBronze(g.round)).sort((a, b) => b.round_order - a.round_order)[0];
  if (!final) return [];
  const day = manilaDate(final.ended_at ?? final.scheduled_at);
  const [gold, silver] = sides(final);
  const rows: SkPlacementInput[] = [
    { place: 1, faction_id: gold, awarded_on: day },
    { place: 2, faction_id: silver, awarded_on: day },
  ];
  const bronze = done.find((g) => isBronze(g.round));
  if (bronze) rows.push({ place: 3, faction_id: sides(bronze)[0], awarded_on: day });
  else {
    for (const semi of done.filter((g) => /semi/i.test(g.round ?? ''))) rows.push({ place: 3, faction_id: sides(semi)[1], awarded_on: day });
  }
  return rows;
}

/** "PTS 24, REB 9, Note ok" ↔ { PTS: 24, REB: 9, Note: "ok" } */
export function parseStatLine(text: string): Record<string, number | string> {
  const out: Record<string, number | string> = {};
  for (const part of text.split(/[,;\n]/)) {
    const m = part.trim().match(/^(.+?)[\s:=]+(-?\d+(?:\.\d+)?%?|\S+)$/);
    if (!m) continue;
    const key = m[1].trim();
    const raw = m[2];
    out[key] = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
  }
  return out;
}

export const formatStatLine = (stats: Record<string, number | string>) =>
  Object.entries(stats)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ');
