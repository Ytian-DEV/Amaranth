import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { canViewStats } from '@/features/auth/permissions';
import { shouldBeat } from '@/features/cms/layout/useStaffHeartbeat';
import { doNotTrack, nextSession, scrollPercent, trackingAllowed } from '@/features/public/analytics/tracker';
import type { StatsTotals } from '@/lib/database.types';
import { StatisticsView, type StatsData } from './StatisticsView';
import { changeNote, formatHMS, formatMS, pctChange, rangeFromParams, type DateRange } from './statsFormat';

describe('statsFormat', () => {
  it('formats active time as H:MM:SS without capping hours', () => {
    expect(formatHMS(0)).toBe('0:00:00');
    expect(formatHMS(4523)).toBe('1:15:23');
    expect(formatHMS(151_234)).toBe('42:00:34');
    expect(formatHMS(-5)).toBe('0:00:00');
  });

  it('formats read time as M:SS', () => {
    expect(formatMS(95)).toBe('1:35');
    expect(formatMS(null)).toBe('–');
  });

  it('compares with the previous period', () => {
    expect(pctChange(115, 100)).toBe(15);
    expect(pctChange(5, 0)).toBeNull();
    expect(changeNote(90, 100)).toEqual({ text: '-10% vs previous period', tone: 'alert' });
    expect(changeNote(3, 0).tone).toBe('muted');
  });

  it('reads the range from the URL, falling back to the last 30 days', () => {
    const today = '2026-10-18';
    expect(rangeFromParams(new URLSearchParams(), today)).toEqual({ from: '2026-09-19', to: today, preset: '30d' });
    expect(rangeFromParams(new URLSearchParams('range=7d'), today)).toEqual({ from: '2026-10-12', to: today, preset: '7d' });
    expect(rangeFromParams(new URLSearchParams('from=2026-01-01&to=2026-02-01'), today).preset).toBe('custom');
    // future, reversed, malformed or too long → default
    for (const q of ['from=2026-10-01&to=2026-11-01', 'from=2026-10-10&to=2026-10-01', 'from=x&to=y', 'from=2020-01-01&to=2026-10-01', 'range=9y']) {
      expect(rangeFromParams(new URLSearchParams(q), today).preset).toBe('30d');
    }
  });
});

describe('who can see statistics', () => {
  it('is only Super admin, Executive Editor and Managing editor', () => {
    expect(['super_admin', 'editor_in_chief', 'managing_editor'].every((r) => canViewStats(r as never))).toBe(true);
    expect(['section_editor', 'staff_writer', 'contributor', null, undefined].some((r) => canViewStats(r as never))).toBe(false);
  });
});

describe('tracker helpers', () => {
  it('tracks only on the production host', () => {
    const site = 'https://amaranth.vsu.edu.ph';
    expect(trackingAllowed('amaranth.vsu.edu.ph', site)).toBe(true);
    expect(trackingAllowed('www.amaranth.vsu.edu.ph', site)).toBe(true);
    expect(trackingAllowed('amaranth-git-feature.vercel.app', site)).toBe(false);
    expect(trackingAllowed('localhost', site)).toBe(false);
    expect(trackingAllowed('amaranth.vsu.edu.ph', undefined)).toBe(false);
    expect(trackingAllowed('localhost', site, true)).toBe(true);
  });

  it('respects Do Not Track and Global Privacy Control', () => {
    expect(doNotTrack({ doNotTrack: '1' })).toBe(true);
    expect(doNotTrack({ globalPrivacyControl: true })).toBe(true);
    expect(doNotTrack({}, { doNotTrack: '1' })).toBe(true);
    expect(doNotTrack({ doNotTrack: '0' })).toBe(false);
  });

  it('starts a new session after 30 minutes away', () => {
    const id = () => 'new';
    expect(nextSession(null, 1000, id).id).toBe('new');
    expect(nextSession({ id: 'old', last: 0 }, 29 * 60_000, id)).toEqual({ id: 'old', last: 29 * 60_000 });
    expect(nextSession({ id: 'old', last: 0 }, 31 * 60_000, id).id).toBe('new');
  });

  it('measures scroll depth through the article body', () => {
    expect(scrollPercent({ top: 800, height: 2000 }, 800)).toBe(0);
    expect(scrollPercent({ top: -200, height: 2000 }, 800)).toBe(50);
    expect(scrollPercent({ top: -5000, height: 2000 }, 800)).toBe(100);
    expect(scrollPercent({ top: 0, height: 0 }, 800)).toBe(0);
  });
});

describe('staff heartbeat', () => {
  it('beats only for a visible, recently used tab', () => {
    expect(shouldBeat(true, 0, 30_000)).toBe(true);
    expect(shouldBeat(true, 0, 61_000)).toBe(false);
    expect(shouldBeat(false, 0, 1000)).toBe(false);
  });
});

const range: DateRange = { from: '2026-10-12', to: '2026-10-18', preset: '7d' };
const totals = (n: number): StatsTotals => ({ pageviews: n, views: n / 2, visitors: n / 4, sessions: n / 3, active_seconds: n * 30, read_samples: n / 2, shares: 4 });
const full: StatsData = {
  overview: { current: totals(400), previous: totals(200), series: [{ day: '2026-10-12', pageviews: 50, views: 20, visitors: 10, shares: 1 }, { day: '2026-10-13', pageviews: 80, views: 30, visitors: 12, shares: 0 }] },
  articles: [{ article_id: 'a1', slug: 's', title: 'Faculty union asks for clearer tenure rules', section_name: 'News', category_name: 'Campus News', authors: 'Ana Reyes', published_at: null, views: 120, pageviews: 140, visitors: 90, avg_read_seconds: 95, avg_scroll: 70, finish_rate: 40, shares: 3 }],
  authors: [],
  sections: [],
  sources: [{ value: 'social', pageviews: 30, visitors: 20 }],
  referrers: [],
  devices: [],
  browsers: [],
  shares: [{ channel: 'messenger', shares: 7 }],
  staff: [{ profile_id: 'p1', display_name: 'Mara Managing', role: 'managing_editor', is_active: true, active_seconds: 4523, days_active: 2, last_active_at: null }],
};
const renderView = (data: StatsData) =>
  render(
    <MemoryRouter>
      <StatisticsView range={range} onRange={() => undefined} data={data} />
    </MemoryRouter>,
  );

describe('StatisticsView', () => {
  it('shows the summary, top articles, shares and staff time', () => {
    renderView(full);
    const summary = screen.getByRole('list', { name: 'Summary' });
    expect(within(summary).getByText('400')).toBeInTheDocument();
    expect(within(summary).getAllByText('+100% vs previous period').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Faculty union asks for clearer tenure rules')[0].closest('a')).toHaveAttribute('href', '/admin/articles/a1');
    expect(within(screen.getByRole('list', { name: 'Shares by channel' })).getByText('Messenger')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Traffic sources' })).getByText('Social media')).toBeInTheDocument();
    expect(screen.getByText('1:15:23')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /daily pageviews/i })).toBeInTheDocument();
    expect(screen.queryByText('No visits recorded in this range')).not.toBeInTheDocument();
  });

  it('explains an empty range', () => {
    renderView({ ...full, overview: { current: totals(0), previous: totals(0), series: [] }, articles: [] });
    expect(screen.getByText('No visits recorded in this range')).toBeInTheDocument();
    expect(screen.getByText(/SUPABASE_SERVICE_ROLE_KEY/)).toBeInTheDocument();
    expect(screen.getByText('No article views in this range yet.')).toBeInTheDocument();
  });

  it('renders while loading', () => {
    renderView({});
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Summary' })).not.toBeInTheDocument();
  });
});
