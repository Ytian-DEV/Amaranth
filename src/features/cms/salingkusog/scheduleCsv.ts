// Schedule import: CSV text → validated sk_matches rows.
import type { SkEditionRow, SkEventRow, SkFactionRow, SkMatchRow, SkSportRow, SkVenueRow } from '@/lib/database.types';
import { slugify } from '@/lib/slug';

export const scheduleColumns = ['date', 'time', 'sport', 'event', 'round', 'side_a', 'side_b', 'venue'] as const;

export const scheduleTemplate = [
  scheduleColumns.join(','),
  '2026-11-03,08:00,Basketball,Men,Semifinal 1,Primordial Tiamat,Sylvan Dragons,Main Gym',
  '2026-11-03,14:30,Volleyball,Women,Group A,PT,CV,Annex Court',
  '2026-11-04,07:00,Athletics,100m Dash · Women,Final,,,Oval',
].join('\n');

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, commas/newlines inside quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // drop a byte-order mark
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const headerAliases: Record<string, (typeof scheduleColumns)[number]> = {
  date: 'date',
  day: 'date',
  time: 'time',
  start: 'time',
  sport: 'sport',
  event: 'event',
  division: 'event',
  round: 'round',
  stage: 'round',
  side_a: 'side_a',
  team_a: 'side_a',
  home: 'side_a',
  side_b: 'side_b',
  team_b: 'side_b',
  away: 'side_b',
  venue: 'venue',
  location: 'venue',
};

/** "2:30 PM" / "14:30" / "7" → "14:30" (null when unreadable). */
export function parseTime(raw: string): string | null {
  const m = raw.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ampm = m[3]?.[0];
  if (ampm) {
    if (h < 1 || h > 12) return null;
    if (ampm === 'p' && h !== 12) h += 12;
    if (ampm === 'a' && h === 12) h = 0;
  }
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export type ScheduleSetup = {
  edition: Pick<SkEditionRow, 'starts_on' | 'ends_on'>;
  sports: Pick<SkSportRow, 'id' | 'name' | 'slug'>[];
  events: Pick<SkEventRow, 'id' | 'sport_id' | 'name' | 'slug' | 'venue_id'>[];
  factions: Pick<SkFactionRow, 'id' | 'name' | 'slug' | 'short_name'>[];
  venues: Pick<SkVenueRow, 'id' | 'name' | 'slug' | 'map_number'>[];
  existing: Pick<SkMatchRow, 'event_id' | 'scheduled_at' | 'side_a_id' | 'side_b_id'>[];
};

export type ScheduleInsert = Pick<SkMatchRow, 'event_id' | 'scheduled_at' | 'round' | 'side_a_id' | 'side_b_id' | 'venue_id'>;

export type ScheduleLine = {
  /** 1-based line in the file (header = 1) */
  line: number;
  cells: Record<(typeof scheduleColumns)[number], string>;
  match: ScheduleInsert | null;
  errors: string[];
  duplicate: boolean;
};

const key = (s: string) => slugify(s);
const sameInstant = (a: string, b: string) => new Date(a).getTime() === new Date(b).getTime();

/** Validates every CSV line against the edition's setup. Times are Philippine time (UTC+8). */
export function resolveSchedule(text: string, setup: ScheduleSetup): { lines: ScheduleLine[]; headerError: string | null } {
  const rows = parseCsv(text);
  if (!rows.length) return { lines: [], headerError: 'The file is empty.' };
  const header = rows[0].map((h) => headerAliases[h.trim().toLowerCase().replace(/[\s-]+/g, '_')]);
  const missing = (['date', 'time', 'sport'] as const).filter((c) => !header.includes(c));
  if (missing.length) return { lines: [], headerError: `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. The first row must be the header.` };

  const findFaction = (raw: string) => {
    const k = key(raw);
    return setup.factions.find((f) => key(f.name) === k || f.slug === k || (f.short_name && key(f.short_name) === k));
  };

  const lines = rows.slice(1).map((row, i): ScheduleLine => {
    const cells = Object.fromEntries(scheduleColumns.map((c) => [c, ''])) as ScheduleLine['cells'];
    header.forEach((col, j) => {
      if (col) cells[col] = (row[j] ?? '').trim();
    });
    const errors: string[] = [];

    let date: string | null = null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cells.date) || Number.isNaN(Date.parse(cells.date))) errors.push('Date must be YYYY-MM-DD.');
    else if (cells.date < setup.edition.starts_on || cells.date > setup.edition.ends_on) errors.push(`Date is outside the edition (${setup.edition.starts_on} to ${setup.edition.ends_on}).`);
    else date = cells.date;
    const time = parseTime(cells.time);
    if (!time) errors.push('Time must look like 14:30 or 2:30 PM.');

    const sport = setup.sports.find((s) => key(s.name) === key(cells.sport) || s.slug === key(cells.sport));
    let event: ScheduleSetup['events'][number] | undefined;
    if (!sport) errors.push(cells.sport ? `Unknown sport “${cells.sport}”.` : 'Sport is required.');
    else {
      const sportEvents = setup.events.filter((e) => e.sport_id === sport.id);
      event = cells.event
        ? sportEvents.find((e) => key(e.name) === key(cells.event) || e.slug === key(cells.event) || e.slug === key(`${sport.name} ${cells.event}`))
        : sportEvents.length === 1
          ? sportEvents[0]
          : undefined;
      if (!event) errors.push(cells.event ? `Unknown event “${cells.event}” in ${sport.name}.` : `${sport.name} has ${sportEvents.length} events; say which one.`);
    }

    const side = (raw: string, label: string) => {
      if (!raw || /^(tbd|tba|-)$/i.test(raw)) return null;
      const f = findFaction(raw);
      if (!f) errors.push(`Unknown faction “${raw}” (${label}).`);
      return f?.id ?? null;
    };
    const sideA = side(cells.side_a, 'side A');
    const sideB = side(cells.side_b, 'side B');
    if (sideA && sideA === sideB) errors.push('Both sides are the same faction.');

    let venueId: string | null = event?.venue_id ?? null;
    if (cells.venue) {
      const v = setup.venues.find((x) => key(x.name) === key(cells.venue) || x.slug === key(cells.venue) || String(x.map_number ?? '') === cells.venue);
      if (!v) errors.push(`Unknown venue “${cells.venue}”.`);
      venueId = v?.id ?? null;
    }

    const match =
      errors.length || !event || !date || !time
        ? null
        : { event_id: event.id, scheduled_at: `${date}T${time}:00+08:00`, round: cells.round || null, side_a_id: sideA, side_b_id: sideB, venue_id: venueId };
    const duplicate =
      !!match &&
      setup.existing.some((m) => m.event_id === match.event_id && sameInstant(m.scheduled_at, match.scheduled_at) && m.side_a_id === match.side_a_id && m.side_b_id === match.side_b_id);
    return { line: i + 2, cells, match, errors, duplicate };
  });

  // the same game twice in one file
  lines.forEach((l, i) => {
    if (!l.match || l.duplicate) return;
    const m = l.match;
    if (lines.slice(0, i).some((o) => o.match && o.match.event_id === m.event_id && o.match.scheduled_at === m.scheduled_at && o.match.side_a_id === m.side_a_id && o.match.side_b_id === m.side_b_id)) {
      l.duplicate = true;
    }
  });
  return { lines, headerError: null };
}
