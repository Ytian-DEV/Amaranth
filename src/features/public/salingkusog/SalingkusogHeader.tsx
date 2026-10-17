import { NavLink } from 'react-router-dom';
import type { SkEditionRow, SkFactionRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { dateSpan, hubTabs, phasePill, type HubPhase } from './hub';
import { LiveDot } from './SkBits';

/** The four coloured squares of the Salingkusog mark, turned 45° (Figma "Salingkusog Mark"). */
export function SalingkusogMark({ className }: { className?: string }) {
  return (
    <span className={cn('grid shrink-0 place-items-center', className)} aria-hidden>
      <img src="/images/salingkusog/mark-group.svg" width={38} height={38} alt="" className="rotate-45 scale-[var(--mark-scale,1)]" />
    </span>
  );
}

/** Hub header for every Salingkusog page (Figma "Salingkusog Header"). */
export function SalingkusogHeader({
  edition,
  factions,
  sportsCount,
  liveCount,
  phase,
}: {
  edition: Pick<SkEditionRow, 'title' | 'subtitle' | 'starts_on' | 'ends_on'>;
  factions: Pick<SkFactionRow, 'id' | 'color'>[];
  sportsCount: number;
  liveCount: number;
  phase: HubPhase;
}) {
  const meta = [edition.subtitle, dateSpan(edition.starts_on, edition.ends_on), `${factions.length} faction${factions.length === 1 ? '' : 's'}, ${sportsCount} sport${sportsCount === 1 ? '' : 's'}`]
    .filter(Boolean)
    .join('  ·  ');
  return (
    <div className="bg-night text-on-dark">
      <div className="container-page flex items-center justify-between gap-x-4 pb-4 pt-5 md:gap-x-6 md:pb-7 md:pt-9">
        <div className="flex min-w-0 items-center gap-3 md:gap-[18px]">
          <SalingkusogMark className="size-9 [--mark-scale:0.62] md:size-14 md:[--mark-scale:1]" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.99px] text-lime">
              <span className="hidden md:inline">Amaranth </span>Special Coverage
            </p>
            <h1 className="font-serif text-[20px] font-bold uppercase leading-none tracking-[0.6px] md:text-[42px] md:tracking-[1.26px]">{edition.title}</h1>
            <p className="hidden whitespace-pre-wrap text-meta text-green-soft md:block">{meta}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3.5">
          {liveCount > 0 && (
            <p className="hidden items-center gap-2 text-button md:flex">
              <LiveDot />
              {liveCount} {liveCount === 1 ? 'match' : 'matches'} live now
            </p>
          )}
          <p className="rounded-full bg-lime px-2.5 py-1.5 text-[13px] font-semibold text-green-900 md:px-3.5 md:py-2 md:text-button">
            <span className="md:hidden">{phase.kind === 'during' ? `Day ${phase.day}/${phase.of}` : phasePill(phase)}</span>
            <span className="hidden md:inline">{phasePill(phase)}</span>
          </p>
        </div>
      </div>
      <nav aria-label="Salingkusog">
        <ul data-scroll-x className="no-scrollbar container-page flex gap-5 overflow-x-auto md:gap-9">
          {hubTabs.map((t) => (
            <li key={t.to} className="shrink-0">
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    'block border-b-[3px] py-3 text-[13px] font-semibold uppercase tracking-[0.52px] md:py-3.5',
                    isActive ? 'border-lime text-lime' : 'border-transparent text-green-soft hover:border-on-dark-muted',
                  )
                }
              >
                {t.short ? (
                  <>
                    <span className="md:hidden">{t.short}</span>
                    <span className="hidden md:inline">{t.label}</span>
                  </>
                ) : (
                  t.label
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex h-1.5" aria-hidden>
        {factions.map((f) => (
          <span key={f.id} className="flex-1" style={{ backgroundColor: f.color }} />
        ))}
      </div>
    </div>
  );
}
