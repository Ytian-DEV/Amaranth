import { useState } from 'react';
import { StatisticsView, type StatsData } from '@/features/cms/statistics/StatisticsView';
import { rangeFromParams, type DateRange, type RangePreset } from '@/features/cms/statistics/statsFormat';
import type { StatsTotals } from '@/lib/database.types';

const zero: StatsTotals = { pageviews: 0, views: 0, visitors: 0, sessions: 0, active_seconds: 0, read_samples: 0, shares: 0 };

function series(r: DateRange, scale: number) {
  const out = [];
  for (let t = Date.parse(r.from); t <= Date.parse(r.to); t += 86_400_000) {
    const i = out.length;
    const pageviews = Math.round(scale * (120 + 60 * Math.sin(i / 3) + (i % 7 === 5 ? 140 : 0) + i * 2));
    out.push({ day: new Date(t).toISOString().slice(0, 10), pageviews, views: Math.round(pageviews * 0.55), visitors: Math.round(pageviews * 0.4), shares: Math.round(pageviews * 0.03) });
  }
  return out;
}

function fixtureStats(r: DateRange): StatsData {
  const s = series(r, 1);
  const sum = (k: 'pageviews' | 'views' | 'visitors' | 'shares') => s.reduce((a, p) => a + p[k], 0);
  const current = { pageviews: sum('pageviews'), views: sum('views'), visitors: sum('visitors'), sessions: Math.round(sum('visitors') * 1.2), active_seconds: sum('views') * 70, read_samples: sum('views'), shares: sum('shares') };
  return {
    overview: { current, previous: { ...current, pageviews: Math.round(current.pageviews * 0.86), views: Math.round(current.views * 1.08), visitors: Math.round(current.visitors * 0.9), active_seconds: current.active_seconds * 0.9, shares: 0 }, series: s },
    articles: Array.from({ length: 8 }, (_, i) => ({
      article_id: `a${i}`,
      slug: `story-${i}`,
      title: ['Faculty union asks for clearer tenure rules', 'Inside the Agri canteen that fed four generations', 'Salingkusog 2026: Faction Red takes the overall title', 'Opinion: The library should open on Sundays', 'Typhoon relief drive collects 3 tons of goods', 'New dorm curfew sparks debate', 'VSU researchers map Leyte’s coral reefs', 'Poetry: Rain on the Baybay road'][i],
      section_name: ['News', 'Feature', 'Sports', 'Opinion', 'News', 'News', 'SciTech', 'Literary'][i],
      category_name: ['Campus News', 'Campus Feature', 'Salingkusog', 'Column', 'Community', 'Campus News', 'Research', 'Poetry'][i],
      authors: i === 7 ? null : ['Ana Reyes', 'Juan Dela Cruz', 'Sam Sports', 'Mara Managing, Wes Writer'][i % 4],
      published_at: '2026-10-01T08:00:00+08:00',
      views: 1400 - i * 150,
      pageviews: 1600 - i * 160,
      visitors: 1100 - i * 120,
      avg_read_seconds: 210 - i * 15,
      avg_scroll: 82 - i * 4,
      finish_rate: 64 - i * 5,
      shares: 40 - i * 4,
    })),
    authors: [
      { contributor_id: 'c1', name: 'Ana Reyes', articles: 6, views: 3200, avg_read_seconds: 185, shares: 51 },
      { contributor_id: 'c2', name: 'Juan Dela Cruz', articles: 4, views: 2100, avg_read_seconds: 240, shares: 30 },
      { contributor_id: 'c3', name: 'Sam Sports', articles: 9, views: 1900, avg_read_seconds: 95, shares: 64 },
    ],
    sections: [
      { section_name: 'News', category_name: 'Campus News', articles: 12, views: 5100, avg_read_seconds: 150, shares: 70 },
      { section_name: 'Sports', category_name: 'Salingkusog', articles: 9, views: 1900, avg_read_seconds: 95, shares: 64 },
      { section_name: 'Opinion', category_name: 'Column', articles: 3, views: 1200, avg_read_seconds: 260, shares: 12 },
    ],
    sources: [
      { value: 'social', pageviews: 5200, visitors: 3000 },
      { value: 'direct', pageviews: 2100, visitors: 1500 },
      { value: 'internal', pageviews: 1800, visitors: 900 },
      { value: 'search', pageviews: 900, visitors: 700 },
      { value: 'referral', pageviews: 120, visitors: 90 },
    ],
    referrers: [
      { value: 'facebook.com', pageviews: 4300, visitors: 2500 },
      { value: 'm.facebook.com', pageviews: 700, visitors: 400 },
      { value: 'google.com', pageviews: 850, visitors: 650 },
      { value: 'vsu.edu.ph', pageviews: 110, visitors: 80 },
    ],
    devices: [
      { value: 'mobile', pageviews: 8100, visitors: 5000 },
      { value: 'desktop', pageviews: 1900, visitors: 1100 },
      { value: 'tablet', pageviews: 120, visitors: 90 },
    ],
    browsers: [
      { value: 'Chrome', pageviews: 6200, visitors: 3900 },
      { value: 'Facebook app', pageviews: 2300, visitors: 1500 },
      { value: 'Safari', pageviews: 1100, visitors: 700 },
      { value: 'Firefox', pageviews: 140, visitors: 90 },
    ],
    shares: [
      { channel: 'facebook', shares: 120 },
      { channel: 'messenger', shares: 64 },
      { channel: 'copy', shares: 31 },
      { channel: 'native', shares: 22 },
      { channel: 'x', shares: 4 },
    ],
    staff: [
      { profile_id: 'p1', display_name: 'Administrator', role: 'editor_in_chief', is_active: true, active_seconds: 151_234, days_active: 24, last_active_at: new Date(Date.now() - 5 * 60_000).toISOString() },
      { profile_id: 'p2', display_name: 'Mara Managing', role: 'managing_editor', is_active: true, active_seconds: 98_765, days_active: 21, last_active_at: new Date(Date.now() - 3 * 3600_000).toISOString() },
      { profile_id: 'p4', display_name: 'Wes Writer', role: 'staff_writer', is_active: true, active_seconds: 4523, days_active: 3, last_active_at: new Date(Date.now() - 4 * 86_400_000).toISOString() },
      { profile_id: 'p6', display_name: 'Old Scorer', role: 'staff_writer', is_active: false, active_seconds: 0, days_active: 0, last_active_at: null },
    ],
  };
}

const fixtureStatsEmpty = (): StatsData => ({
  overview: { current: zero, previous: zero, series: [] },
  articles: [],
  authors: [],
  sections: [],
  sources: [],
  referrers: [],
  devices: [],
  browsers: [],
  shares: [],
  staff: [],
});

/** Interactive fixture: the range picker works, the numbers follow it. */
export function FixtureStatistics({ mode }: { mode: 'full' | 'empty' | 'loading' }) {
  const [range, setRange] = useState<DateRange>(() => rangeFromParams(new URLSearchParams()));
  const onRange = ({ preset, from, to }: { preset: RangePreset; from?: string; to?: string }) => {
    const p = new URLSearchParams(preset === 'custom' && from && to ? { from, to } : { range: preset });
    setRange(preset === 'custom' && from && to ? { preset, from, to } : rangeFromParams(p));
  };
  const data = mode === 'full' ? fixtureStats(range) : mode === 'empty' ? fixtureStatsEmpty() : {};
  return <StatisticsView range={range} onRange={onRange} data={data} />;
}
