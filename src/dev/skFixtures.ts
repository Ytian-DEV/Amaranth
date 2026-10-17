// Salingkusog sample data for /dev fixtures and tests. Faction names follow the Figma design (placeholders).
import type { SkAthleteRow, SkAwardRow, SkEditionRow, SkEventRow, SkFactionRow, SkMatchRow, SkPlacementRow, SkSportRow, SkVenueRow } from '@/lib/database.types';

const t = '2026-10-10T08:00:00+08:00';
const base = { edition_id: 'ed26', created_at: t, updated_at: t };

const edition: SkEditionRow = {
  id: 'ed26',
  year: 2026,
  title: 'Salingkusog 2026',
  subtitle: 'VSU Intramural Games',
  starts_on: '2026-11-02',
  ends_on: '2026-11-07',
  points_gold: 5,
  points_silver: 3,
  points_bronze: 1,
  is_current: true,
  is_published: false,
  schedule_pdf_asset_id: null,
  map_asset_id: null,
  created_at: t,
  updated_at: t,
};

// colours are data (stored per faction), written as rgb() to keep hex out of the source
const factions: SkFactionRow[] = [
  { ...base, id: 'pt', name: 'Primordial Tiamat', slug: 'primordial-tiamat', short_name: 'PT', motto: 'From the deep, we rise.', color: 'rgb(139 30 45)', logo_asset_id: null, sort_order: 0 },
  { ...base, id: 'cv', name: 'Centicore Vanguard', slug: 'centicore-vanguard', short_name: 'CV', motto: null, color: 'rgb(30 79 160)', logo_asset_id: null, sort_order: 1 },
  { ...base, id: 'sd', name: 'Sylvan Dragons', slug: 'sylvan-dragons', short_name: 'SD', motto: null, color: 'rgb(31 138 76)', logo_asset_id: null, sort_order: 2 },
  { ...base, id: 'mm', name: 'Mystic Moirai', slug: 'mystic-moirai', short_name: 'MM', motto: null, color: 'rgb(106 61 154)', logo_asset_id: null, sort_order: 3 },
];

const venues: SkVenueRow[] = [
  { ...base, id: 'gym', name: 'VSU Main Gymnasium', slug: 'main-gym', description: 'Basketball and volleyball finals.', map_number: 1, map_x: 42, map_y: 35, sort_order: 0 },
  { ...base, id: 'oval', name: 'University Oval', slug: 'oval', description: 'Track and field.', map_number: 2, map_x: 60, map_y: 62, sort_order: 1 },
  { ...base, id: 'annex', name: 'Annex Court', slug: 'annex-court', description: null, map_number: null, map_x: null, map_y: null, sort_order: 2 },
];

const sports: SkSportRow[] = [
  { ...base, id: 'bb', name: 'Basketball', slug: 'basketball', category: 'ball_games', sort_order: 0 },
  { ...base, id: 'vb', name: 'Volleyball', slug: 'volleyball', category: 'ball_games', sort_order: 1 },
  { ...base, id: 'at', name: 'Athletics', slug: 'athletics', category: 'athletics', sort_order: 2 },
];

const ev = (id: string, sport_id: string, name: string, slug: string, extra: Partial<SkEventRow> = {}): SkEventRow => ({
  ...base,
  id,
  sport_id,
  name,
  slug,
  division: 'men',
  format: 'bracket',
  is_team: true,
  result_unit: null,
  venue_id: null,
  sort_order: 0,
  ...extra,
});

const events: SkEventRow[] = [
  ev('bb-m', 'bb', 'Men', 'basketball-men', { venue_id: 'gym' }),
  ev('bb-w', 'bb', 'Women', 'basketball-women', { division: 'women', venue_id: 'gym', sort_order: 1 }),
  ev('vb-w', 'vb', 'Women', 'volleyball-women', { division: 'women', venue_id: 'annex' }),
  ev('at-100w', 'at', '100m Dash · Women', 'athletics-100m-dash-women', { division: 'women', format: 'timed', is_team: false, result_unit: 's', venue_id: 'oval' }),
];

const athletes: SkAthleteRow[] = [
  { ...base, id: 'a1', faction_id: 'pt', name: 'Marco Villanueva', slug: 'marco-villanueva', program: 'BS Civil Engineering 4', photo_asset_id: null },
  { ...base, id: 'a2', faction_id: 'sd', name: 'Jessa Abad', slug: 'jessa-abad', program: 'BS Agriculture 2', photo_asset_id: null },
  { ...base, id: 'a3', faction_id: 'cv', name: 'Rene Lagunzad', slug: 'rene-lagunzad', program: 'BS Forestry 3', photo_asset_id: null },
];

const match = (id: string, extra: Partial<SkMatchRow>): SkMatchRow => ({
  ...base,
  id,
  event_id: 'bb-m',
  round: null,
  round_order: 0,
  bracket_slot: null,
  venue_id: 'gym',
  scheduled_at: '2026-11-03T00:00:00Z',
  status: 'upcoming',
  side_a_id: 'pt',
  side_b_id: 'sd',
  score_a: null,
  score_b: null,
  periods: [],
  team_stats: [],
  live_note: null,
  started_at: null,
  ended_at: null,
  recap_article_id: null,
  winner_side: null,
  updated_by: null,
  ...extra,
});

const matches: SkMatchRow[] = [
  match('m1', { round: 'Semifinal 1', round_order: 1, bracket_slot: 1, status: 'final', score_a: 78, score_b: 71, winner_side: 'a', periods: [{ label: 'Q1', a: 20, b: 16 }, { label: 'Q2', a: 18, b: 21 }, { label: 'Q3', a: 22, b: 15 }, { label: 'Q4', a: 18, b: 19 }], ended_at: '2026-11-03T01:40:00Z' }),
  match('m2', { round: 'Semifinal 2', round_order: 1, bracket_slot: 2, side_a_id: 'cv', side_b_id: 'mm', status: 'live', score_a: 54, score_b: 58, live_note: 'Q3 · 4:12', scheduled_at: '2026-11-03T02:00:00Z', periods: [{ label: 'Q1', a: 19, b: 22 }, { label: 'Q2', a: 21, b: 20 }, { label: 'Q3', a: 14, b: 16 }] }),
  match('m3', { event_id: 'vb-w', venue_id: 'annex', side_a_id: 'sd', side_b_id: 'cv', scheduled_at: '2026-11-03T06:30:00Z', round: 'Group A' }),
  match('m4', { event_id: 'bb-w', side_a_id: null, side_b_id: null, scheduled_at: '2026-11-04T00:00:00Z', round: 'Final', round_order: 2 }),
];

const placements: SkPlacementRow[] = [
  { ...base, id: 'p1', event_id: 'at-100w', place: 1, medal: 'gold', faction_id: 'sd', athlete_id: 'a2', result: '12.84s', awarded_on: '2026-11-03' },
  { ...base, id: 'p2', event_id: 'at-100w', place: 2, medal: 'silver', faction_id: 'pt', athlete_id: null, result: '12.97s', awarded_on: '2026-11-03' },
];

const awards: SkAwardRow[] = [
  { ...base, id: 'aw1', kind: 'mvp_of_day', day: '2026-11-03', athlete_id: 'a1', match_id: 'm1', event_id: 'bb-m', headline: 'Semifinal 1', stat_line: [{ label: 'PTS', value: '24' }, { label: 'REB', value: '9' }], quote: null },
  { ...base, id: 'aw2', kind: 'athlete_of_day', day: '2026-11-03', athlete_id: 'a2', match_id: null, event_id: 'at-100w', headline: '12.84s', stat_line: [], quote: 'I ran for my block.' },
];

export const skFixture = { edition, factions, venues, sports, events, athletes, matches, placements, awards };
