import { SectionHeader } from '@/components/story/Story';
import { LogoLoader } from '@/components/ui/LogoLoader';
import type { SkEditionRow, SkMedalTableRow, SkPointsByDayRow, SkPointsTimelineRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { useTweenedNumber, useTweenedNumbers } from '@/lib/useTween';
import { liveAndNext, podiumOrder, raceRanges, raceSeries, readableOn, standingsDay, standingsHeadline, stepLabel, timelineSeries, type HubPhase, type RaceRange } from './hub';
import { FactionBadge, MatchCard, MedalChip } from './SkBits';
import type { HubData } from './skData';

const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;
const blockHeight = (rank: number) => ['', 'h-[150px] md:h-[240px]', 'h-[110px] md:h-[180px]', 'h-[85px] md:h-[140px]'][rank] ?? 'h-[65px] md:h-[100px]';

/** One podium block: the points and medals count up from 0 and the block grows from the floor. */
function PodiumStep({ r, hub }: { r: SkMedalTableRow; hub: HubData }) {
  const [points, gold, silver, bronze, grow] = useTweenedNumbers([r.points, r.gold, r.silver, r.bronze, 1], 1100);
  const f = hub.factions.find((x) => x.id === r.faction_id);
  const textTone = readableOn(r.color, 3) === 'light' ? 'text-on-dark' : 'text-ink';
  return (
    <li className="flex min-w-0 max-w-[250px] flex-1 flex-col items-center gap-2 md:gap-3.5" aria-label={`${ordinal(r.rank)}: ${r.name}, ${r.points} points`}>
      <FactionBadge faction={f} logos={hub.logos} theme="dark" nameClassName="hidden md:inline" />
      <p className={cn('font-serif font-semibold leading-none tabular-nums', r.rank === 1 ? 'text-[24px] md:text-[40px]' : 'text-[20px] md:text-[30px]')}>
        {Math.round(points)}
        <span className="hidden md:inline"> pts</span>
      </p>
      <div className="hidden gap-2 md:flex">
        <MedalChip medal="gold" count={Math.round(gold)} />
        <MedalChip medal="silver" count={Math.round(silver)} />
        <MedalChip medal="bronze" count={Math.round(bronze)} />
      </div>
      <div className={cn('grid w-full origin-bottom place-items-center rounded-t-[10px]', blockHeight(r.rank))} style={{ backgroundColor: r.color, transform: `scaleY(${grow})` }}>
        <span className={cn('font-serif font-bold uppercase leading-none', textTone, r.rank === 1 ? 'text-[36px] md:text-[56px]' : 'text-[32px] md:text-[44px]')}>
          <span className="md:hidden">{r.rank}</span>
          <span className="hidden md:inline">{ordinal(r.rank)}</span>
        </span>
      </div>
    </li>
  );
}

function Podium({ rows, hub, phase }: { rows: SkMedalTableRow[]; hub: HubData; phase: HubPhase }) {
  const day = standingsDay(phase);
  return (
    <section aria-labelledby="sk-podium" className="bg-night-2 text-on-dark">
      <div className="container-page flex flex-col items-center gap-6 pt-8 md:gap-9 md:pt-12">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.99px] text-lime">
            {phase.kind === 'after' ? 'Final standings' : day ? `Overall standings after Day ${day}` : 'Overall standings'}
          </p>
          <h2 id="sk-podium" className="font-serif text-[22px] font-semibold leading-tight tracking-[-0.36px] md:text-[36px]">
            {standingsHeadline(rows)}
          </h2>
        </div>
        <ol className="flex w-full max-w-[1060px] items-end justify-center gap-1.5 md:gap-5">
          {podiumOrder(rows).map((r) => (
            <PodiumStep key={r.faction_id} r={r} hub={hub} />
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Whole number that counts up to `value`. */
function CountUp({ value }: { value: number }) {
  return <>{Math.round(useTweenedNumber(value))}</>;
}

function MedalTable({ rows, hub, edition }: { rows: SkMedalTableRow[]; hub: HubData; edition: Pick<SkEditionRow, 'points_gold' | 'points_silver' | 'points_bronze'> }) {
  const faction = (id: string) => hub.factions.find((f) => f.id === id);
  const points = `Gold ${edition.points_gold} pts  ·  Silver ${edition.points_silver} pts  ·  Bronze ${edition.points_bronze} pt${edition.points_bronze === 1 ? '' : 's'}`;
  return (
    <section aria-labelledby="sk-table" className="container-page flex flex-col gap-3 pt-10 md:gap-5 md:pt-16">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4">
        <SectionHeader id="sk-table" title="Medal Table" className="md:flex-1" />
        <p className="whitespace-pre text-meta text-ink-muted md:text-button md:text-green-700">{points}</p>
      </div>

      {/* desktop/tablet: table */}
      <div className="hidden overflow-hidden rounded-[14px] border border-line md:block">
        <table aria-labelledby="sk-table" className="w-full bg-surface text-left">
          <thead className="bg-green-soft text-[11px] font-bold uppercase tracking-[0.99px] text-green-700">
            <tr>
              <th scope="col" className="w-16 py-3 pl-6">Rank</th>
              <th scope="col" className="py-3">Faction</th>
              {['Gold', 'Silver', 'Bronze', 'Total'].map((h) => (
                <th key={h} scope="col" className="w-[90px] py-3 text-center">{h}</th>
              ))}
              <th scope="col" className="w-[110px] py-3 pr-6 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.faction_id} className="border-t border-line">
                <td className="py-4 pl-6 font-serif text-[30px] italic leading-none text-lime-dark">{r.rank}</td>
                <th scope="row" className="py-4 font-normal">
                  <FactionBadge faction={faction(r.faction_id)} logos={hub.logos} />
                </th>
                <td className="py-4"><MedalChip medal="gold" count={r.gold} className="mx-auto" /></td>
                <td className="py-4"><MedalChip medal="silver" count={r.silver} className="mx-auto" /></td>
                <td className="py-4"><MedalChip medal="bronze" count={r.bronze} className="mx-auto" /></td>
                <td className="py-4 text-center text-[17px] font-semibold tabular-nums">{r.total}</td>
                <td className="py-4 pr-6 text-right font-serif text-[26px] font-semibold tabular-nums text-green-900">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phone: cards */}
      <ol className="flex flex-col gap-2.5 md:hidden">
        {rows.map((r) => (
          <li key={r.faction_id} className="flex flex-col gap-2.5 rounded-[12px] border border-line bg-surface p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-6 shrink-0 font-serif text-[26px] italic leading-none text-lime-dark">
                <span className="sr-only">Rank </span>
                {r.rank}
              </span>
              <FactionBadge faction={faction(r.faction_id)} logos={hub.logos} className="flex-1" />
              <span className="shrink-0 font-serif text-[22px] font-semibold tabular-nums text-green-900"><CountUp value={r.points} /> pts</span>
            </div>
            <div className="flex items-center gap-2 pl-[34px]">
              <MedalChip medal="gold" count={r.gold} />
              <MedalChip medal="silver" count={r.silver} />
              <MedalChip medal="bronze" count={r.bronze} />
              <span className="text-meta text-ink-muted">{r.total} total</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Cumulative points as an SVG line chart (day by day, or in 1/3/6/12-hour steps), with the numbers as a hidden table. */
function PointsRace({ race, hub, upto, total, range = 'day', onRange, timeline, timelineLoading }: {
  race: SkPointsByDayRow[];
  hub: HubData;
  upto: number;
  total: number;
  range?: RaceRange;
  onRange?: (r: RaceRange) => void;
  timeline?: SkPointsTimelineRow[];
  timelineLoading?: boolean;
}) {
  const hourly = range !== 'day';
  const factions = hub.factions;
  let labels: string[];
  let target: Map<string, number[]>;
  if (hourly) {
    const t = timelineSeries(timeline ?? []);
    labels = t.steps.map((st) => stepLabel(st, range === 12));
    target = t.series;
  } else {
    const shown = Math.max(1, Math.min(upto || 1, total));
    const rs = raceSeries(race, shown);
    labels = Array.from({ length: shown }, (_, i) => `Day ${i + 1}`);
    target = new Map([...rs].map(([key, v]) => [key, v.map((p) => p.points)]));
  }
  const n = labels.length;
  // lines rise from 0 on load and move to new totals when results come in
  const flat = factions.flatMap((f) => target.get(f.id) ?? []);
  const tweened = useTweenedNumbers(flat, 1200);
  const series = new Map<string, number[]>();
  let k = 0;
  for (const f of factions) series.set(f.id, (target.get(f.id) ?? []).map((v) => tweened[k++] ?? v));

  const W = 640;
  const H = 312;
  const pad = { l: 30, r: 20, t: 16, b: 38 };
  const max = Math.max(5, ...flat);
  const x = (i: number) => (n <= 1 ? (pad.l + W - pad.r) / 2 : pad.l + (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (pts: number) => H - pad.b - (pts / max) * (H - pad.t - pad.b);
  const every = Math.max(1, Math.ceil(n / 6)); // at most ~6 time labels
  const showLabel = (i: number) => i === n - 1 || (i % every === 0 && n - 1 - i >= every / 2);
  const dots = n <= 14;
  const firstStep = timeline?.[0]?.bucket_end;
  const subtitle = !hourly
    ? 'Cumulative points at the end of each competition day'
    : range === 12
      ? 'Cumulative points every 12 hours across the games'
      : `Cumulative points every ${range === 1 ? 'hour' : `${range} hours`}${firstStep ? `, ${stepLabel(firstStep, true).split(',')[0]}` : ''}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-[14px] border border-line bg-surface p-4 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-[20px] font-semibold md:text-[24px]">Points race</h3>
          <p className="mt-1 text-meta text-ink-muted">{subtitle}</p>
        </div>
        {onRange && (
          <div role="group" aria-label="Time steps" className="inline-flex rounded-full border border-line bg-paper p-1">
            {raceRanges.map((r) => (
              <button
                key={r.label}
                type="button"
                aria-pressed={range === r.value}
                onClick={() => onRange(r.value)}
                className={cn('h-8 rounded-full px-3 text-[13px] font-bold transition-colors', range === r.value ? 'bg-green-900 text-lime' : 'text-ink-muted hover:text-ink')}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {hourly && timelineLoading && !timeline ? (
        <LogoLoader label="Loading the points race" className="min-h-[260px]" />
      ) : hourly && n === 0 ? (
        <p className="grid min-h-[200px] place-items-center text-body-m text-ink-muted">No results yet for this view.</p>
      ) : (
        <figure className="flex flex-col gap-1.5">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Points race for ${factions.map((f) => f.name).join(', ')}. The table below has the numbers.`}>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <line key={t} x1={pad.l} x2={W - pad.r} y1={y(max * t)} y2={y(max * t)} stroke="var(--color-line)" strokeWidth={1} />
            ))}
            {factions.map((f) => {
              const pts = series.get(f.id) ?? [];
              if (!pts.length) return null;
              return (
                <g key={f.id}>
                  <polyline points={pts.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={f.color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
                  {pts.map((v, i) =>
                    dots || i === pts.length - 1 ? (
                      <circle key={i} cx={x(i)} cy={y(v)} r={i === pts.length - 1 ? 6 : 3.5} fill={i === pts.length - 1 ? f.color : 'var(--color-surface)'} stroke={f.color} strokeWidth={2} />
                    ) : null,
                  )}
                </g>
              );
            })}
            {labels.map((l, i) =>
              showLabel(i) ? (
                <text key={i} x={x(i)} y={H - 12} textAnchor={n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="12" fill="var(--color-ink-muted)">
                  {l}
                </text>
              ) : null,
            )}
          </svg>
          <figcaption className="sr-only">
            <table aria-label="Points race">
              <thead>
                <tr>
                  <th scope="col">Faction</th>
                  {labels.map((l, i) => (
                    <th key={i} scope="col">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factions.map((f) => (
                  <tr key={f.id}>
                    <th scope="row">{f.name}</th>
                    {labels.map((_, i) => (
                      <td key={i}>{target.get(f.id)?.[i] ?? 0}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </figcaption>
        </figure>
      )}
      <ul className="hidden flex-wrap gap-x-5 gap-y-2 md:flex" aria-hidden>
        {factions.map((f) => (
          <li key={f.id}>
            <FactionBadge faction={f} logos={hub.logos} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MedalBreakdown({ rows, hub }: { rows: SkMedalTableRow[]; hub: HubData }) {
  const most = Math.max(1, ...rows.map((r) => r.total));
  const faction = (id: string) => hub.factions.find((f) => f.id === id);
  return (
    <div className="hidden flex-col gap-[22px] rounded-[14px] border border-line bg-surface p-7 md:flex lg:w-[460px] lg:shrink-0">
      <h3 className="font-serif text-[24px] font-semibold">Medal breakdown</h3>
      <ul className="flex flex-col gap-[22px]">
        {rows.map((r) => (
          <li key={r.faction_id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <FactionBadge faction={faction(r.faction_id)} logos={hub.logos} />
              <span className="shrink-0 text-button">{r.total} medals</span>
            </div>
            <div className="flex h-3.5 gap-[3px]" role="img" aria-label={`${r.gold} gold, ${r.silver} silver, ${r.bronze} bronze`}>
              {(['gold', 'silver', 'bronze'] as const).map((m) =>
                r[m] ? <span key={m} className={cn('rounded-[3px]', m === 'gold' ? 'bg-gold' : m === 'silver' ? 'bg-silver' : 'bg-bronze')} style={{ width: `${(r[m] / most) * 100}%` }} /> : null,
              )}
            </div>
          </li>
        ))}
      </ul>
      <ul className="flex gap-4 text-meta text-ink-muted" aria-hidden>
        {(['Gold', 'Silver', 'Bronze'] as const).map((m) => (
          <li key={m} className="flex items-center gap-1.5">
            <span className={cn('size-2.5 rounded-full', m === 'Gold' ? 'bg-gold' : m === 'Silver' ? 'bg-silver' : 'bg-bronze')} />
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MedalTallyView({ edition, hub, table, race, phase, now = new Date(), range, onRange, timeline, timelineLoading }: {
  edition: SkEditionRow;
  hub: HubData;
  table: SkMedalTableRow[];
  race: SkPointsByDayRow[];
  phase: HubPhase;
  now?: Date;
  range?: RaceRange;
  onRange?: (r: RaceRange) => void;
  timeline?: SkPointsTimelineRow[];
  timelineLoading?: boolean;
}) {
  const games = liveAndNext(hub.matches, now);
  const totalDays = phase.kind === 'before' ? 1 : phase.of;
  return (
    <>
      <Podium rows={table} hub={hub} phase={phase} />
      <MedalTable rows={table} hub={hub} edition={edition} />
      <section aria-label="Charts" className="container-page pt-8 md:pt-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <PointsRace race={race} hub={hub} upto={standingsDay(phase)} total={totalDays} range={range} onRange={onRange} timeline={timeline} timelineLoading={timelineLoading} />
          <MedalBreakdown rows={table} hub={hub} />
        </div>
      </section>
      <section aria-labelledby="sk-next" className="container-page flex flex-col gap-4 pb-16 pt-10 md:gap-5 md:pb-20">
        <SectionHeader id="sk-next" title="Live & up next" href="/salingkusog/schedule" linkLabel="Full schedule" />
        {games.length ? (
          <div className="grid gap-3 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
            {games.map((m) => (
              <MatchCard key={m.id} match={m} hub={hub} />
            ))}
          </div>
        ) : (
          <p className="text-body-m text-ink-muted">{phase.kind === 'after' ? 'All games are finished. Thanks for following Salingkusog!' : 'No games on the schedule right now.'}</p>
        )}
      </section>
    </>
  );
}
