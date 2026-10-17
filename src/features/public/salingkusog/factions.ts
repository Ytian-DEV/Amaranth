// Faction profile: everything computed from games and results already loaded for the hub.
import type { SkAthleteRow, SkMedal, SkPlacementRow } from '@/lib/database.types';
import { manilaDate } from '@/lib/manila';
import type { HubData } from './skData';

export type RecentResult = {
  matchId: string;
  outcome: 'W' | 'L' | 'D';
  label: string;
  opponentId: string;
  score: string;
  date: string;
};

export type HeadToHead = { opponentId: string; wins: number; losses: number };
export type SportMedal = { label: string; medal: SkMedal };
export type TopAthlete = { athlete: SkAthleteRow; line: string; gold: number; silver: number; bronze: number };

const medalRank: Record<SkMedal, number> = { gold: 0, silver: 1, bronze: 2 };
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function factionProfile(factionId: string, hub: HubData, placements: SkPlacementRow[], athletes: SkAthleteRow[], recentLimit = 5) {
  const event = (id: string) => hub.events.find((e) => e.id === id);
  const sport = (eventId: string) => hub.sports.find((s) => s.id === event(eventId)?.sport_id);
  const eventLabel = (eventId: string) => {
    const e = event(eventId);
    return e?.name.includes('·') ? e.name : `${sport(eventId)?.name ?? ''} · ${e?.name ?? ''}`;
  };

  const played = hub.matches.filter(
    (m) => m.status === 'final' && m.side_a_id && m.side_b_id && (m.side_a_id === factionId || m.side_b_id === factionId) && m.score_a !== null && m.score_b !== null,
  );

  const recent: RecentResult[] = [...played]
    .sort((a, b) => (b.ended_at ?? b.scheduled_at).localeCompare(a.ended_at ?? a.scheduled_at))
    .slice(0, recentLimit)
    .map((m) => {
      const mine = m.side_a_id === factionId;
      const [us, them] = mine ? [m.score_a!, m.score_b!] : [m.score_b!, m.score_a!];
      return {
        matchId: m.id,
        outcome: us > them ? 'W' : us < them ? 'L' : 'D',
        label: [eventLabel(m.event_id), m.round].filter(Boolean).join(' · '),
        opponentId: (mine ? m.side_b_id : m.side_a_id)!,
        score: `${us}–${them}`,
        date: manilaDate(m.scheduled_at),
      };
    });

  const headToHead: HeadToHead[] = hub.factions
    .filter((f) => f.id !== factionId)
    .map((f) => {
      const games = played.filter((m) => m.side_a_id === f.id || m.side_b_id === f.id);
      const wins = games.filter((m) => (m.side_a_id === factionId ? m.winner_side === 'a' : m.winner_side === 'b')).length;
      const losses = games.filter((m) => (m.side_a_id === factionId ? m.winner_side === 'b' : m.winner_side === 'a')).length;
      return { opponentId: f.id, wins, losses };
    });

  const mine = placements.filter((p) => p.faction_id === factionId && p.medal);
  const medalsBySport: SportMedal[] = mine
    .map((p) => ({ label: eventLabel(p.event_id), medal: p.medal! }))
    .sort((a, b) => medalRank[a.medal] - medalRank[b.medal] || a.label.localeCompare(b.label));

  const byAthlete = new Map<string, { gold: number; silver: number; bronze: number; sports: Set<string> }>();
  for (const p of mine) {
    if (!p.athlete_id) continue;
    const a = byAthlete.get(p.athlete_id) ?? { gold: 0, silver: 0, bronze: 0, sports: new Set<string>() };
    a[p.medal!]++;
    a.sports.add(sport(p.event_id)?.name ?? '');
    byAthlete.set(p.athlete_id, a);
  }
  const topAthletes: TopAthlete[] = [...byAthlete.entries()]
    .flatMap(([id, t]) => {
      const athlete = athletes.find((a) => a.id === id);
      if (!athlete) return [];
      const medals = [t.gold && plural(t.gold, 'gold'), t.silver && plural(t.silver, 'silver'), t.bronze && plural(t.bronze, 'bronze')].filter(Boolean).join(', ');
      return [{ athlete, gold: t.gold, silver: t.silver, bronze: t.bronze, line: `${[...t.sports].join(', ')} · ${medals}` }];
    })
    .sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.athlete.name.localeCompare(b.athlete.name))
    .slice(0, 3);

  return { recent, headToHead, medalsBySport, topAthletes };
}

export const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;
