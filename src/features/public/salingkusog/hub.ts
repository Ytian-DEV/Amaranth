// Pure helpers for the public Salingkusog pages.
import type { SkEditionRow, SkMatchRow, SkMedalTableRow, SkPointsByDayRow } from '@/lib/database.types';
import { dayRange, manilaDate, manilaTime } from '@/lib/manila';

export type HubPhase = { kind: 'before'; startsIn: number } | { kind: 'during'; day: number; of: number } | { kind: 'after'; of: number };

/** Where the edition stands today (Philippine time). */
export function hubPhase(edition: Pick<SkEditionRow, 'starts_on' | 'ends_on'>, today = manilaDate()): HubPhase {
  const days = dayRange(edition.starts_on, edition.ends_on);
  if (today < edition.starts_on) {
    return { kind: 'before', startsIn: Math.round((Date.parse(edition.starts_on) - Date.parse(today)) / 86_400_000) };
  }
  if (today > edition.ends_on) return { kind: 'after', of: days.length };
  return { kind: 'during', day: days.find((d) => d.date === today)?.number ?? 1, of: days.length };
}

export const phasePill = (p: HubPhase) =>
  p.kind === 'during' ? `Day ${p.day} of ${p.of}` : p.kind === 'after' ? 'Final standings' : p.startsIn === 1 ? 'Starts tomorrow' : `Starts in ${p.startsIn} days`;

/** Last day with standings to show: today while the games run, the last day after. */
export const standingsDay = (p: HubPhase) => (p.kind === 'during' ? p.day : p.kind === 'after' ? p.of : 0);

/** "Oct 26–30, 2026" / "Oct 30 – Nov 3, 2026" */
export function dateSpan(startsOn: string, endsOn: string) {
  const f = (d: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { ...o, timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
  const sameMonth = startsOn.slice(0, 7) === endsOn.slice(0, 7);
  return sameMonth
    ? `${f(startsOn, { month: 'short', day: 'numeric' })}–${f(endsOn, { day: 'numeric' })}, ${endsOn.slice(0, 4)}`
    : `${f(startsOn, { month: 'short', day: 'numeric' })} – ${f(endsOn, { month: 'short', day: 'numeric' })}, ${endsOn.slice(0, 4)}`;
}

const pts = (n: number) => `${n} point${n === 1 ? '' : 's'}`;

/** Podium headline: "Primordial Tiamat leads by a single point". */
export function standingsHeadline(rows: SkMedalTableRow[]) {
  const [first, second] = [...rows].sort((a, b) => a.rank - b.rank);
  if (!first || first.points === 0) return 'The race for the overall title is on';
  if (!second) return `${first.name} leads the standings`;
  const gap = first.points - second.points;
  if (gap === 0) return `${first.name} and ${second.name} are tied at the top`;
  return `${first.name} leads by ${gap === 1 ? 'a single point' : pts(gap)}`;
}

/** Podium order for display: 2nd, 1st, 3rd, then the rest. */
export function podiumOrder<T extends { rank: number }>(rows: T[]) {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  return sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2], ...sorted.slice(3)] : sorted;
}

/** Live games first, then the next upcoming ones. */
export function liveAndNext<T extends Pick<SkMatchRow, 'status' | 'scheduled_at'>>(matches: T[], now = new Date(), limit = 3) {
  const live = matches.filter((m) => m.status === 'live');
  const next = matches
    .filter((m) => m.status === 'upcoming' && Date.parse(m.scheduled_at) >= now.getTime() - 3 * 3600_000)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  return [...live, ...next].slice(0, limit);
}

/** Points race series per faction up to `uptoDay` (0 = nothing yet). */
export function raceSeries(rows: SkPointsByDayRow[], uptoDay: number) {
  const byFaction = new Map<string, { day: number; points: number }[]>();
  for (const r of rows) {
    if (r.day_number > uptoDay) continue;
    const list = byFaction.get(r.faction_id) ?? [];
    list.push({ day: r.day_number, points: r.points });
    byFaction.set(r.faction_id, list);
  }
  for (const list of byFaction.values()) list.sort((a, b) => a.day - b.day);
  return byFaction;
}

/**
 * White or ink text on a faction colour (stored as #RRGGBB or rgb()).
 * White wins whenever it reaches `min` (3 for large text, 4.5 for small), as in the design.
 */
export function readableOn(color: string, min = 4.5): 'light' | 'dark' {
  let rgb: number[] | null = null;
  const hex = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) rgb = hex.slice(1).map((h) => parseInt(h, 16));
  const fn = color.match(/rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (fn) rgb = fn.slice(1).map(Number);
  if (!rgb) return 'light';
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // contrast with white vs with ink (#15201a, luminance ≈ 0.013)
  const white = 1.05 / (lum + 0.05);
  return white >= min || white >= (lum + 0.05) / 0.063 ? 'light' : 'dark';
}

export const hubTabs = [
  { to: '/salingkusog', label: 'Medal Tally', end: true },
  { to: '/salingkusog/schedule', label: 'Schedule & Results', short: 'Schedule' },
  { to: '/salingkusog/winners', label: 'Winners' },
  { to: '/salingkusog/factions', label: 'Factions' },
  { to: '/salingkusog/sports', label: 'Sports' },
  { to: '/salingkusog/venues', label: 'Venues' },
];

/** "Today · 3:00 PM" / "Nov 4 · 8:00 AM" in Philippine time. */
/** "3:00 PM" in Philippine time. */
export function clockLabel(at: string) {
  const [h, m] = manilaTime(at).split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function whenLabel(at: string, today = manilaDate()) {
  const d = manilaDate(at);
  const time = clockLabel(at);
  const day = d === today ? 'Today' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
  return `${day} · ${time}`;
}

// ---------------------------------------------------------------- schedule

export type ScheduleShow = 'all' | 'live' | 'upcoming' | 'results';
export type ScheduleFilters = { sport?: string; faction?: string; venue?: string; show: ScheduleShow };
export type ScheduleGroup<T> = { key: 'live' | 'later' | 'completed' | 'off'; title: string; matches: T[] };

/** Day to open: ?day= when it belongs to the edition, else today during the games, else the first day. */
export function scheduleDay(edition: Pick<SkEditionRow, 'starts_on' | 'ends_on'>, requested: string | null, today = manilaDate()) {
  const days = dayRange(edition.starts_on, edition.ends_on);
  if (requested && days.some((d) => d.date === requested)) return requested;
  if (today >= edition.starts_on && today <= edition.ends_on) return today;
  return today > edition.ends_on ? edition.ends_on : edition.starts_on;
}

/** One day's games, filtered and grouped into live / later / completed / postponed. */
export function scheduleGroups<T extends Pick<SkMatchRow, 'status' | 'scheduled_at' | 'event_id' | 'side_a_id' | 'side_b_id' | 'venue_id'>>(
  matches: T[],
  day: string,
  filters: ScheduleFilters,
  sportOf: (eventId: string) => string | undefined,
  today = manilaDate(),
): ScheduleGroup<T>[] {
  const isToday = day === today;
  const list = matches
    .filter((m) => manilaDate(m.scheduled_at) === day)
    .filter((m) => !filters.sport || sportOf(m.event_id) === filters.sport)
    .filter((m) => !filters.faction || m.side_a_id === filters.faction || m.side_b_id === filters.faction)
    .filter((m) => !filters.venue || m.venue_id === filters.venue)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const groups: ScheduleGroup<T>[] = [
    { key: 'live', title: 'Live now', matches: list.filter((m) => m.status === 'live') },
    { key: 'later', title: isToday ? 'Later today' : day > today ? 'Scheduled' : 'Not played', matches: list.filter((m) => m.status === 'upcoming') },
    { key: 'completed', title: isToday ? 'Completed today' : 'Completed', matches: list.filter((m) => m.status === 'final').reverse() },
    { key: 'off', title: 'Postponed or cancelled', matches: list.filter((m) => m.status === 'postponed' || m.status === 'cancelled') },
  ];
  const wanted: Record<ScheduleShow, ScheduleGroup<T>['key'][]> = { all: ['live', 'later', 'completed', 'off'], live: ['live'], upcoming: ['later', 'off'], results: ['completed'] };
  return groups.filter((g) => g.matches.length && wanted[filters.show].includes(g.key));
}

/** "Thu, Oct 16" */
export const dayLabel = (date: string, weekday = true) =>
  new Intl.DateTimeFormat('en-US', { ...(weekday ? { weekday: 'short' } : {}), month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
