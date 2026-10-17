import { formatShortDate } from '@/lib/format';
import { formatCount } from './statsFormat';

type Point = { day: string; pageviews: number; views: number };

/** Daily pageviews (area) and article views (line), with the numbers as a table for screen readers. */
export function TrendChart({ series }: { series: Point[] }) {
  const W = 720;
  const H = 220;
  const pad = { l: 40, r: 12, t: 12, b: 26 };
  const max = Math.max(4, ...series.map((p) => p.pageviews));
  const n = Math.max(1, series.length - 1);
  const x = (i: number) => pad.l + (i / n) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const line = (k: 'pageviews' | 'views') => series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
  const area = series.length ? `${line('pageviews')} L${x(series.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : '';
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  const labels = series.length > 1 ? [0, Math.floor((series.length - 1) / 2), series.length - 1] : [0];

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Daily pageviews and article views. The table below has the numbers.">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-muted)">
              {formatCount(t)}
            </text>
          </g>
        ))}
        {series.length > 0 && (
          <>
            <path d={area} fill="var(--color-green-soft)" />
            <path d={line('pageviews')} fill="none" stroke="var(--color-green-700)" strokeWidth="2.5" strokeLinejoin="round" />
            <path d={line('views')} fill="none" stroke="var(--color-lime-dark)" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />
          </>
        )}
        {labels.map((i) =>
          series[i] ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'} fontSize="11" fill="var(--color-ink-muted)">
              {formatShortDate(series[i].day)}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-meta text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 bg-green-700" aria-hidden /> Pageviews
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0 w-5 border-t-2 border-dashed border-lime-dark" aria-hidden /> Article views
        </span>
        <table className="sr-only">
          <caption>Pageviews and article views per day</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Pageviews</th>
              <th scope="col">Article views</th>
            </tr>
          </thead>
          <tbody>
            {series.map((p) => (
              <tr key={p.day}>
                <th scope="row">{p.day}</th>
                <td>{p.pageviews}</td>
                <td>{p.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}

/** Horizontal bars, largest first. */
export function BarList({ rows, label }: { rows: { label: string; value: number; note?: string }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!rows.length) return <p className="text-body-m text-ink-muted">Nothing recorded in this range.</p>;
  return (
    <ul className="flex flex-col gap-3" aria-label={label}>
      {rows.map((r) => (
        <li key={r.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate font-medium text-ink">{r.label}</span>
            <span className="shrink-0 tabular-nums text-ink-muted">
              {formatCount(r.value)}
              {total > 0 && <span className="ml-1.5 text-meta">({Math.round((r.value / total) * 100)}%)</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-green-soft" aria-hidden>
            <div className="h-full rounded-full bg-green-700" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
