import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Img } from '@/components/ui/Img';
import type { MediaAssetRow, SkFactionRow, SkMedal, SkMedalTableRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { factionProfile, ordinal } from './factions';
import { dayLabel, readableOn } from './hub';
import { FactionBadge, MedalChip } from './SkBits';
import type { HubData } from './skData';

const medalDot: Record<SkMedal, string> = { gold: 'bg-gold', silver: 'bg-silver', bronze: 'bg-bronze' };

/** Strip of every faction (the list). */
export function FactionSwitcher({ hub }: { hub: HubData }) {
  return (
    <nav aria-label="Factions" className="border-b border-line bg-surface">
      <ul data-scroll-x className="no-scrollbar container-page flex gap-2 overflow-x-auto py-3 md:gap-4 md:py-4">
        {hub.factions.map((f) => (
          <li key={f.id} className="shrink-0">
            <NavLink
              to={`/salingkusog/factions/${f.slug}`}
              className={({ isActive }) => cn('flex items-center rounded-[10px] border px-3 py-2', isActive ? 'border-lime-dark bg-lime-soft' : 'border-transparent hover:bg-paper')}
            >
              <FactionBadge faction={f} logos={hub.logos} nameClassName="text-[14px]" />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Panel({ title, id, action, children, className }: { title: string; id: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn('flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5 md:p-[26px]', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="font-serif text-[22px] font-semibold md:text-[24px]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Hero({ faction, row, logos }: { faction: SkFactionRow; row: SkMedalTableRow | undefined; logos: MediaAssetRow[] }) {
  const light = readableOn(faction.color, 3) === 'light';
  const logo = logos.find((l) => l.id === faction.logo_asset_id);
  const stats = [
    ['Rank', row ? ordinal(row.rank) : '–'],
    ['Points', row?.points ?? 0],
    ['Medals', row?.total ?? 0],
  ] as const;
  return (
    <section aria-labelledby="faction-name" style={{ backgroundColor: faction.color }} className={light ? 'text-on-dark' : 'text-ink'}>
      <div className="container-page flex flex-col gap-6 py-8 md:flex-row md:items-center md:gap-9 md:py-12">
        <div className="flex items-center gap-4 md:gap-9">
          <span className={cn('grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 md:size-[120px]', light ? 'border-on-dark/50 bg-on-dark/15' : 'border-ink/30 bg-ink/10')} aria-hidden>
            {logo ? (
              <Img bucket={logo.bucket} path={logo.path} variants={logo.variants} width={logo.width} alt="" ratio="1/1" sizes="120px" rounded={false} className="size-full" />
            ) : (
              <span className="font-serif text-[28px] font-bold md:text-[44px]">{faction.short_name ?? faction.name.slice(0, 2).toUpperCase()}</span>
            )}
          </span>
          <div className="min-w-0">
            <p className={cn('text-[11px] font-bold uppercase tracking-[0.99px]', light ? 'text-on-dark/80' : 'text-ink/70')}>Faction profile</p>
            <h2 id="faction-name" className="mt-1 font-serif text-[32px] font-bold leading-[1.05] md:text-[56px]">
              {faction.name}
            </h2>
            {faction.motto && <p className="mt-2 font-serif text-[17px] italic md:text-[20px]">“{faction.motto}”</p>}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2.5 md:ml-auto md:flex md:gap-3.5">
          {stats.map(([label, value]) => (
            <div key={label} className={cn('flex flex-col rounded-[10px] px-4 py-3 md:min-w-[85px] md:px-5', light ? 'bg-on-dark/15' : 'bg-ink/10')}>
              <dt className={cn('text-[11px] font-bold uppercase tracking-[0.99px]', light ? 'text-on-dark/80' : 'text-ink/70')}>{label}</dt>
              <dd className="font-serif text-[30px] font-semibold leading-tight md:text-[40px]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function FactionView({ faction, hub, table, placements, athletes, photos = [] }: {
  faction: SkFactionRow;
  hub: HubData;
  table: SkMedalTableRow[];
  placements: Parameters<typeof factionProfile>[2];
  athletes: Parameters<typeof factionProfile>[3];
  photos?: MediaAssetRow[];
}) {
  const row = table.find((r) => r.faction_id === faction.id);
  const p = factionProfile(faction.id, hub, placements, athletes);
  const other = (id: string) => hub.factions.find((f) => f.id === id);

  return (
    <>
      <FactionSwitcher hub={hub} />
      <Hero faction={faction} row={row} logos={hub.logos} />
      <div className="container-page grid gap-5 pb-16 pt-8 md:pb-20 md:pt-11 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
          <Panel
            id="faction-recent"
            title="Recent results"
            action={
              <Link to={`/salingkusog/schedule?faction=${faction.id}&show=results`} className="shrink-0 text-button text-green-700 hover:underline">
                Full history <span aria-hidden>→</span>
              </Link>
            }
          >
            {p.recent.length ? (
              <ul>
                {p.recent.map((r) => (
                  <li key={r.matchId} className="flex items-center gap-3 border-b border-line py-3 last:border-0 md:gap-4">
                    <span
                      className={cn('grid size-7 shrink-0 place-items-center rounded-[6px] text-[13px] font-bold', r.outcome === 'W' ? 'bg-green-soft text-green-700' : r.outcome === 'L' ? 'bg-lime-soft text-alert' : 'bg-line text-ink')}
                      aria-label={r.outcome === 'W' ? 'Won' : r.outcome === 'L' ? 'Lost' : 'Draw'}
                    >
                      {r.outcome}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold uppercase tracking-[0.99px] text-green-500-text">{r.label}</p>
                      <p className="mt-1 flex min-w-0 items-center gap-2 text-meta text-ink-muted">
                        vs <FactionBadge faction={other(r.opponentId)} logos={hub.logos} nameClassName="text-[14px] font-medium" />
                      </p>
                    </div>
                    <span className="shrink-0 font-serif text-[20px] font-semibold tabular-nums md:text-[22px]">{r.score}</span>
                    <span className="hidden w-12 shrink-0 text-right text-meta text-ink-muted sm:inline">{dayLabel(r.date, false)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-m text-ink-muted">No finished games yet.</p>
            )}
          </Panel>

          <Panel id="faction-sports" title="Medals by sport">
            {p.medalsBySport.length ? (
              <ul className="flex flex-wrap gap-2">
                {p.medalsBySport.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[14px] font-medium">
                    <span className={cn('size-2.5 rounded-full', medalDot[m.medal])} aria-hidden />
                    <span className="sr-only">{m.medal}: </span>
                    {m.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-m text-ink-muted">No medals yet.</p>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
          <Panel id="faction-medals" title="Medal count">
            <div className="flex justify-between">
              {(['gold', 'silver', 'bronze'] as const).map((m) => (
                <div key={m} className="flex flex-col items-center gap-1.5 first:items-start last:items-end">
                  <MedalChip medal={m} count={row?.[m] ?? 0} />
                  <span className="text-meta capitalize text-ink-muted" aria-hidden>{m}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel id="faction-h2h" title="Head-to-head">
            <p className="-mt-1 text-meta text-ink-muted">Wins and losses against each faction this Salingkusog</p>
            <ul className="flex flex-col gap-4">
              {p.headToHead.map((h) => {
                const games = h.wins + h.losses;
                return (
                  <li key={h.opponentId} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <FactionBadge faction={other(h.opponentId)} logos={hub.logos} nameClassName="text-[14px] font-medium" />
                      <span className="shrink-0 text-button tabular-nums">
                        {h.wins}W – {h.losses}L
                      </span>
                    </div>
                    <div className="flex h-2 gap-1" aria-hidden>
                      {games ? (
                        <>
                          <span className="rounded-full" style={{ flex: h.wins, backgroundColor: faction.color }} />
                          <span className="rounded-full bg-line" style={{ flex: h.losses }} />
                        </>
                      ) : (
                        <span className="flex-1 rounded-full bg-line" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel id="faction-athletes" title="Top athletes">
            {p.topAthletes.length ? (
              <ul>
                {p.topAthletes.map((t) => {
                  const photo = photos.find((x) => x.id === t.athlete.photo_asset_id);
                  return (
                    <li key={t.athlete.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                      {photo ? (
                        <Img bucket={photo.bucket} path={photo.path} variants={photo.variants} width={photo.width} alt="" ratio="1/1" sizes="40px" rounded={false} className="size-10 shrink-0 rounded-full" />
                      ) : (
                        <span className="size-10 shrink-0 rounded-full bg-photo" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-serif text-[17px] font-semibold">{t.athlete.name}</p>
                        <p className="truncate text-meta text-ink-muted">{t.line}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-body-m text-ink-muted">Individual medal winners will appear here.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
