import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { roleLabels } from '@/features/auth/permissions';
import type { StatsArticleRow, StatsAuthorRow, StatsBreakdownRow, StatsOverview, StatsSectionRow, StatsStaffRow } from '@/lib/database.types';
import { formatRelative } from '@/lib/format';
import { manilaDate } from '@/lib/manila';
import { Card, CardHeader, CmsPageHeader, StatCard } from '../ui';
import { BarList, TrendChart } from './StatsCharts';
import {
  changeNote,
  channelLabels,
  deviceLabels,
  formatCount,
  formatHMS,
  formatMS,
  presetLabels,
  sourceLabels,
  type DateRange,
  type RangePreset,
} from './statsFormat';

export type StatsData = {
  overview?: StatsOverview;
  articles?: StatsArticleRow[];
  authors?: StatsAuthorRow[];
  sections?: StatsSectionRow[];
  sources?: StatsBreakdownRow[];
  referrers?: StatsBreakdownRow[];
  devices?: StatsBreakdownRow[];
  browsers?: StatsBreakdownRow[];
  shares?: { channel: string; shares: number }[];
  staff?: StatsStaffRow[];
};

function RangePicker({ range, onRange }: { range: DateRange; onRange: (r: { preset: RangePreset; from?: string; to?: string }) => void }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-[13px] font-semibold">
        Date range
        <Select value={range.preset} onChange={(e) => onRange({ preset: e.target.value as RangePreset, from: range.from, to: range.to })} className="w-44">
          {(Object.keys(presetLabels) as (keyof typeof presetLabels)[]).map((p) => (
            <option key={p} value={p}>
              {presetLabels[p]}
            </option>
          ))}
          <option value="custom">Custom…</option>
        </Select>
      </label>
      {range.preset === 'custom' && (
        <>
          <label className="flex flex-col gap-1 text-[13px] font-semibold">
            From
            <Input type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && onRange({ preset: 'custom', from: e.target.value, to: range.to })} className="w-40" />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold">
            To
            <Input type="date" value={range.to} min={range.from} max={manilaDate()} onChange={(e) => e.target.value && onRange({ preset: 'custom', from: range.from, to: e.target.value })} className="w-40" />
          </label>
        </>
      )}
    </div>
  );
}

function Section({ id, title, action, children, className }: { id: string; title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card aria-labelledby={id} className={className}>
      <CardHeader id={id} title={title} action={action} />
      <div className="px-5 pb-5 pt-2">{children}</div>
    </Card>
  );
}

const Loading = () => <Skeleton className="h-40" />;

function Summary({ o }: { o?: StatsOverview }) {
  if (!o) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[118px]" />
        ))}
      </div>
    );
  }
  const c = o.current;
  const p = o.previous;
  const avgRead = c.read_samples ? c.active_seconds / c.read_samples : null;
  const prevRead = p.read_samples ? p.active_seconds / p.read_samples : 0;
  const cards = [
    { label: 'Pageviews', value: formatCount(c.pageviews), ...changeNote(c.pageviews, p.pageviews) },
    { label: 'Article views', value: formatCount(c.views), ...changeNote(c.views, p.views) },
    { label: 'Visitors', value: formatCount(c.visitors), ...changeNote(c.visitors, p.visitors) },
    { label: 'Avg. read time', value: formatMS(avgRead), ...changeNote(avgRead ?? 0, prevRead) },
    { label: 'Shares', value: formatCount(c.shares), ...changeNote(c.shares, p.shares) },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Summary">
      {cards.map((k) => (
        <li key={k.label} className="last:col-span-2 md:last:col-span-1">
          <StatCard label={k.label} value={k.value} note={k.text} tone={k.tone} />
        </li>
      ))}
    </ul>
  );
}

function TopArticles({ rows }: { rows?: StatsArticleRow[] }) {
  if (!rows) return <Loading />;
  if (!rows.length) return <p className="text-body-m text-ink-muted">No article views in this range yet.</p>;
  return (
    <>
      <ol className="flex flex-col md:hidden" aria-label="Top articles">
        {rows.map((a, i) => (
          <li key={a.article_id} className="flex gap-3 border-b border-line py-3 last:border-0">
            <span className="w-5 shrink-0 tabular-nums text-ink-muted">{i + 1}</span>
            <div className="flex min-w-0 flex-col gap-1">
              <Link to={`/admin/articles/${a.article_id}`} className="font-semibold leading-snug text-ink hover:text-green-700">
                {a.title}
              </Link>
              <span className="text-meta text-ink-muted">
                {a.section_name} · {a.category_name}
              </span>
              <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                {[
                  ['Views', formatCount(a.views)],
                  ['Avg. read', formatMS(a.avg_read_seconds)],
                  ['Finished', a.finish_rate == null ? '–' : `${a.finish_rate}%`],
                  ['Shares', String(a.shares)],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-1">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ol>
      <div data-scroll-x className="-mx-5 hidden overflow-x-auto px-5 md:block">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="border-b border-line text-[11px] font-bold uppercase tracking-[0.99px] text-ink-muted">
            <tr>
              <th scope="col" className="w-8 py-2">#</th>
              <th scope="col" className="py-2">Article</th>
              <th scope="col" className="py-2 text-right">Views</th>
              <th scope="col" className="py-2 text-right">Avg. read</th>
              <th scope="col" className="py-2 text-right">Scroll</th>
              <th scope="col" className="py-2 text-right">Finished</th>
              <th scope="col" className="py-2 text-right">Shares</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={a.article_id} className="border-b border-line last:border-0">
                <td className="py-3 align-top tabular-nums text-ink-muted">{i + 1}</td>
                <th scope="row" className="py-3 pr-3 font-normal">
                  <Link to={`/admin/articles/${a.article_id}`} className="font-semibold text-ink hover:text-green-700 hover:underline">
                    {a.title}
                  </Link>
                  <span className="block text-meta text-ink-muted">
                    {a.section_name} · {a.category_name}
                    {a.authors && ` · ${a.authors}`}
                  </span>
                </th>
                <td className="py-3 text-right align-top font-semibold tabular-nums">{formatCount(a.views)}</td>
                <td className="py-3 text-right align-top tabular-nums">{formatMS(a.avg_read_seconds)}</td>
                <td className="py-3 text-right align-top tabular-nums">{a.avg_scroll == null ? '–' : `${a.avg_scroll}%`}</td>
                <td className="py-3 text-right align-top tabular-nums">{a.finish_rate == null ? '–' : `${a.finish_rate}%`}</td>
                <td className="py-3 text-right align-top tabular-nums">{a.shares}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SimpleTable<T>({ rows, cols, empty }: { rows?: T[]; cols: { label: string; cell: (r: T) => ReactNode; right?: boolean }[]; empty: string }) {
  if (!rows) return <Loading />;
  if (!rows.length) return <p className="text-body-m text-ink-muted">{empty}</p>;
  return (
    <div data-scroll-x className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[420px] text-left text-[14px]">
        <thead className="border-b border-line text-[11px] font-bold uppercase tracking-[0.99px] text-ink-muted">
          <tr>
            {cols.map((c) => (
              <th key={c.label} scope="col" className={`py-2 ${c.right ? 'text-right' : ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {cols.map((c, j) =>
                j === 0 ? (
                  <th key={c.label} scope="row" className="py-2.5 pr-3 font-semibold text-ink">
                    {c.cell(r)}
                  </th>
                ) : (
                  <td key={c.label} className={`py-2.5 tabular-nums ${c.right ? 'text-right' : ''}`}>
                    {c.cell(r)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const bars = (rows: StatsBreakdownRow[] | undefined, labels?: Record<string, string>) => rows?.map((r) => ({ label: labels?.[r.value] ?? r.value, value: r.pageviews }));

export function StatisticsView({ range, onRange, data }: { range: DateRange; onRange: (r: { preset: RangePreset; from?: string; to?: string }) => void; data: StatsData }) {
  const nothingYet = data.overview && data.overview.current.pageviews === 0 && data.overview.previous.pageviews === 0;

  return (
    <div className="flex flex-col gap-6">
      <CmsPageHeader title="Statistics" subtitle="Readers, articles, sharing and newsroom activity. Days follow Philippine time." actions={<RangePicker range={range} onRange={onRange} />} />

      <Summary o={data.overview} />
      {nothingYet && (
        <EmptyState title="No visits recorded in this range">
          Statistics are collected on the live site only (not on previews or while you are signed in). If the site has been live for a while, check that SUPABASE_SERVICE_ROLE_KEY is set on Vercel.
        </EmptyState>
      )}

      <Section id="stats-trend" title="Trend">
        {data.overview ? <TrendChart series={data.overview.series} /> : <Loading />}
        <p className="mt-3 text-meta text-ink-muted">
          Visitors are counted per day (anonymous ids change daily for privacy), so a range shows daily visitors added up. An article view is one per reader per article per 30 minutes.
        </p>
      </Section>

      <Section id="stats-articles" title="Top articles">
        <TopArticles rows={data.articles} />
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section id="stats-authors" title="By author">
          <SimpleTable
            rows={data.authors}
            empty="No bylined views in this range."
            cols={[
              { label: 'Author', cell: (r) => r.name },
              { label: 'Articles', cell: (r) => r.articles, right: true },
              { label: 'Views', cell: (r) => formatCount(r.views), right: true },
              { label: 'Avg. read', cell: (r) => formatMS(r.avg_read_seconds), right: true },
            ]}
          />
        </Section>
        <Section id="stats-sections" title="By section and category">
          <SimpleTable
            rows={data.sections}
            empty="No views in this range."
            cols={[
              { label: 'Category', cell: (r) => (
                <>
                  {r.category_name}
                  <span className="block text-meta font-normal text-ink-muted">{r.section_name}</span>
                </>
              ) },
              { label: 'Articles', cell: (r) => r.articles, right: true },
              { label: 'Views', cell: (r) => formatCount(r.views), right: true },
              { label: 'Avg. read', cell: (r) => formatMS(r.avg_read_seconds), right: true },
            ]}
          />
        </Section>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Section id="stats-sources" title="Traffic sources">
          {data.sources ? <BarList label="Traffic sources" rows={bars(data.sources, sourceLabels)!} /> : <Loading />}
        </Section>
        <Section id="stats-referrers" title="Top referring sites">
          {data.referrers ? <BarList label="Referring sites" rows={bars(data.referrers.slice(0, 8))!} /> : <Loading />}
        </Section>
        <Section id="stats-devices" title="Devices">
          {data.devices ? <BarList label="Devices" rows={bars(data.devices, deviceLabels)!} /> : <Loading />}
        </Section>
        <Section id="stats-browsers" title="Browsers">
          {data.browsers ? <BarList label="Browsers" rows={bars(data.browsers.slice(0, 8))!} /> : <Loading />}
        </Section>
      </div>

      <Section id="stats-shares" title="Shares by channel">
        {data.shares ? <BarList label="Shares by channel" rows={data.shares.map((s) => ({ label: channelLabels[s.channel] ?? s.channel, value: s.shares }))} /> : <Loading />}
        <p className="mt-3 text-meta text-ink-muted">Clicks on the share buttons (the post itself happens on the other site).</p>
      </Section>

      <Section id="stats-staff" title="Newsroom activity">
        <p className="-mt-1 mb-3 text-meta text-ink-muted">Active time only: the tab is open, visible and in use. Idle tabs don’t count.</p>
        <SimpleTable
          rows={data.staff}
          empty="No staff accounts."
          cols={[
            { label: 'Staff member', cell: (r) => (
              <>
                {r.display_name}
                <span className="block text-meta font-normal text-ink-muted">
                  {roleLabels[r.role]}
                  {!r.is_active && ' · inactive'}
                </span>
              </>
            ) },
            { label: 'Active time', cell: (r) => <span className="font-semibold">{formatHMS(r.active_seconds)}</span>, right: true },
            { label: 'Days active', cell: (r) => r.days_active, right: true },
            { label: 'Avg. per day', cell: (r) => (r.days_active ? formatHMS(r.active_seconds / r.days_active) : '–'), right: true },
            { label: 'Last active', cell: (r) => (r.last_active_at ? formatRelative(r.last_active_at) : 'Never'), right: true },
          ]}
        />
      </Section>
    </div>
  );
}
