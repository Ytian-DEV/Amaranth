// Winners per game: one card per event with results.
import type { SkAthleteRow, SkCategory, SkMatchRow, SkPlacementRow } from '@/lib/database.types';
import { manilaDate } from '@/lib/manila';
import type { HubData } from './skData';

export type WinnerRow = {
  place: number;
  medal: SkPlacementRow['medal'];
  factionId: string;
  /** athlete for individual events, else the faction */
  name: string;
  /** "Champion · beat CV in the final", "Runner-up", the faction for athletes… */
  note: string;
  result: string | null;
};

export type WinnerCard = {
  eventId: string;
  category: SkCategory;
  title: string;
  /** "Oct 15" or "Oct 13–14" */
  dates: string;
  venue: string | null;
  final: boolean;
  rows: WinnerRow[];
  /** last finished game, for the recap link */
  recapMatchId: string | null;
  awardedOn: string;
};

const short = (d: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));

function dateSpanShort(dates: string[]) {
  const sorted = [...new Set(dates)].sort();
  if (!sorted.length) return '';
  const [a, b] = [sorted[0], sorted.at(-1)!];
  if (a === b) return short(a);
  return a.slice(0, 7) === b.slice(0, 7) ? `${short(a)}–${Number(b.slice(8))}` : `${short(a)} – ${short(b)}`;
}

const isBronzeGame = (r: string | null) => /bronze|third|3rd/i.test(r ?? '');
const isFinalGame = (r: string | null) => /final/i.test(r ?? '') && !/semi|quarter/i.test(r ?? '') && !isBronzeGame(r);
const placeWord = ['', 'Champion', 'Runner-up', 'Third place', 'Fourth place'];

export function winnerCards(hub: HubData, placements: SkPlacementRow[], athletes: SkAthleteRow[]): WinnerCard[] {
  const faction = (id: string | null | undefined) => hub.factions.find((f) => f.id === id);
  const cards: WinnerCard[] = [];

  for (const event of hub.events) {
    const rows = placements.filter((p) => p.event_id === event.id).sort((a, b) => a.place - b.place);
    if (!rows.length) continue;
    const sport = hub.sports.find((s) => s.id === event.sport_id);
    const games = hub.matches.filter((m) => m.event_id === event.id);
    const done = games.filter((m) => m.status === 'final');
    const finalGame = done.find((m) => isFinalGame(m.round));
    const bronzeGame = done.find((m) => isBronzeGame(m.round));

    const note = (p: SkPlacementRow): string => {
      if (!event.is_team && p.athlete_id) return faction(p.faction_id)?.name ?? '';
      const opponent = (m: SkMatchRow | undefined) => (m ? (m.side_a_id === p.faction_id ? m.side_b_id : m.side_a_id) : null);
      if (p.place === 1 && finalGame) {
        const opp = faction(opponent(finalGame));
        const sets = finalGame.periods.length > 1 && /set/i.test(finalGame.periods[0]?.label ?? '') ? ` in ${finalGame.periods.length} sets` : '';
        return opp ? `Champion · ${sets ? `won the final${sets}` : `beat ${opp.short_name ?? opp.name} in the final`}` : 'Champion';
      }
      if (p.place === 3 && bronzeGame) return 'Won the bronze game';
      return placeWord[p.place] ?? `${p.place}th place`;
    };

    /** Team events: the score of the deciding game from this side's view, when no result was typed. */
    const scoreFor = (p: SkPlacementRow) => {
      if (p.result) return p.result;
      const deciding = p.place <= 2 ? finalGame : p.place <= 4 ? bronzeGame : undefined;
      if (!deciding || deciding.score_a === null || deciding.score_b === null) return null;
      const mine = deciding.side_a_id === p.faction_id;
      return mine ? `${deciding.score_a}–${deciding.score_b}` : `${deciding.score_b}–${deciding.score_a}`;
    };

    const last = [...done].sort((a, b) => (b.ended_at ?? b.scheduled_at).localeCompare(a.ended_at ?? a.scheduled_at))[0];
    const dates = done.length ? done.map((m) => manilaDate(m.scheduled_at)) : rows.map((r) => r.awarded_on);
    cards.push({
      eventId: event.id,
      category: sport?.category ?? 'ball_games',
      // "100m Dash · Women" already names the race; "Men" needs the sport in front
      title: event.name.includes('·') ? event.name : `${sport?.name ?? ''} · ${event.name}`,
      dates: dateSpanShort(dates),
      venue: hub.venues.find((v) => v.id === (finalGame?.venue_id ?? event.venue_id))?.name ?? null,
      final: rows.some((r) => r.medal === 'gold'),
      rows: rows.map((p) => ({
        place: p.place,
        medal: p.medal,
        factionId: p.faction_id,
        name: (p.athlete_id && athletes.find((a) => a.id === p.athlete_id)?.name) || faction(p.faction_id)?.name || 'Unknown',
        note: note(p),
        result: scoreFor(p),
      })),
      // contests have no two-sided recap page; their results are on the sport page
      recapMatchId: [finalGame ?? last].find((g) => g && !g.is_contest)?.id ?? null,
      awardedOn: rows.reduce((max, r) => (r.awarded_on > max ? r.awarded_on : max), ''),
    });
  }
  // newest results first
  return cards.sort((a, b) => b.awardedOn.localeCompare(a.awardedOn) || a.title.localeCompare(b.title));
}

/** "31 of 48 events completed" */
export const completedCount = (hub: HubData, placements: SkPlacementRow[]) => ({
  done: hub.events.filter((e) => placements.some((p) => p.event_id === e.id && p.medal === 'gold')).length,
  total: hub.events.length,
});
