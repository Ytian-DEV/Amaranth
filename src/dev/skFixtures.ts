// Salingkusog sample data for /dev fixtures and tests. Faction names follow the Figma design (placeholders).
import type { SkEditionRow, SkEventRow, SkFactionRow, SkSportRow, SkVenueRow } from '@/lib/database.types';

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

export const skFixture = { edition, factions, venues, sports, events };
