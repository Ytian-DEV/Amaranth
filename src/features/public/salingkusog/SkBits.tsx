import { Check, Clock, MapPin } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import type { MediaAssetRow, SkEntryRow, SkEventRow, SkFactionRow, SkMatchRow, SkMedal } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { entryStatusShort, formatResult, rankEntries } from '@/lib/skContests';
import { pendingSide } from '@/lib/skSources';
import { clockLabel, dayLabel, readableOn, whenLabel } from './hub';
import { manilaDate } from '@/lib/manila';
import type { HubData } from './skData';

type Faction = Pick<SkFactionRow, 'name' | 'short_name' | 'color' | 'logo_asset_id'>;

/** Faction emblem + name (Figma "Faction Badge"). Logo from the media library, else the colour with the short name. */
export function FactionBadge({
  faction,
  logos = [],
  theme = 'light',
  showName = true,
  size = 32,
  className,
  nameClassName,
  placeholder = 'To be decided',
}: {
  faction: Faction | undefined;
  logos?: MediaAssetRow[];
  theme?: 'light' | 'dark';
  showName?: boolean;
  size?: 32 | 40;
  className?: string;
  nameClassName?: string;
  /** shown while the side isn't known: "Winner of Semifinal 1" */
  placeholder?: string;
}) {
  const name = faction?.name ?? placeholder;
  const logo = faction?.logo_asset_id ? logos.find((l) => l.id === faction.logo_asset_id) : undefined;
  const initials = faction?.short_name ?? name.slice(0, 2).toUpperCase();
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <span
        className={cn('grid shrink-0 place-items-center overflow-hidden rounded-[8px] text-[11px] font-bold', size === 40 ? 'size-10' : 'size-8', !faction && 'border border-dashed border-line')}
        style={faction && !logo ? { backgroundColor: faction.color, color: readableOn(faction.color) === 'light' ? 'var(--color-on-dark)' : 'var(--color-ink)' } : undefined}
        aria-hidden
      >
        {logo ? <Img bucket={logo.bucket} path={logo.path} variants={logo.variants} width={logo.width} alt="" ratio="1/1" sizes="40px" rounded={false} className="size-full" /> : faction ? initials : '?'}
      </span>
      {showName && <span className={cn('truncate text-button', theme === 'dark' ? 'text-on-dark' : 'text-ink', nameClassName)}>{name}</span>}
    </span>
  );
}

const medalClass: Record<SkMedal, string> = {
  gold: 'bg-gold text-ink',
  silver: 'bg-silver text-ink',
  bronze: 'bg-bronze-deep text-on-dark',
};

/** Round medal count (Figma "Medal"). */
export function MedalChip({ medal, count, className }: { medal: SkMedal; count: number; className?: string }) {
  return (
    <span className={cn('grid size-[30px] shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums', medalClass[medal], className)}>
      {count}
      <span className="sr-only"> {medal}</span>
    </span>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex size-2 shrink-0', className)} aria-hidden>
      <span className="absolute inset-0 animate-ping rounded-full bg-alert opacity-60 motion-reduce:hidden" />
      <span className="relative size-2 rounded-full bg-alert" />
    </span>
  );
}

function StatusTag({ match }: { match: SkMatchRow }) {
  if (match.status === 'live')
    return <span className="rounded-full bg-alert px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.99px] text-on-dark">● Live</span>;
  if (match.status === 'final') return <span className="rounded-full bg-green-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.99px] text-green-700">Final</span>;
  const label = match.status === 'upcoming' ? 'Upcoming' : match.status === 'postponed' ? 'Postponed' : 'Cancelled';
  return <span className="rounded-full bg-lime-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.99px] text-lime-dark-text">{label}</span>;
}

/** Game card (Figma "Match Card"). */
/** `dated`: the schedule shows "Oct 16 · 3:00 PM" on wide screens and just the time on phones. */
export function MatchCard({ match, hub, dated, className }: { match: SkMatchRow; hub: HubData; dated?: boolean; className?: string }) {
  const event = hub.events.find((e) => e.id === match.event_id);
  const sport = hub.sports.find((s) => s.id === event?.sport_id);
  const venue = hub.venues.find((v) => v.id === match.venue_id);
  const side = (id: string | null) => hub.factions.find((f) => f.id === id);
  const score = (v: number | null) => (match.status === 'live' || match.status === 'final') && v !== null ? v : '—';
  const a = side(match.side_a_id);
  const b = side(match.side_b_id);
  const label = `${sport?.name ?? ''} · ${event?.name ?? ''}`;
  const waiting = (k: 'a' | 'b') => pendingSide(match, k, hub.matches) ?? 'To be decided';
  const lineUp = match.is_contest ? (hub.entries ?? []).filter((e) => e.match_id === match.id) : [];
  const sides = match.is_contest ? `all factions (${lineUp.length})` : `${a?.name ?? waiting('a')} vs ${b?.name ?? waiting('b')}`;
  return (
    <article className={cn('flex min-w-0 flex-col gap-3.5 rounded-[12px] border border-line bg-surface p-[18px]', className)} aria-label={`${label}${match.round ? `, ${match.round}` : ''}: ${sides}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.99px] text-green-500-text">{label}</p>
          {match.round && <p className="mt-0.5 truncate text-meta text-ink-muted">{match.round}</p>}
        </div>
        <StatusTag match={match} />
      </div>
      {match.is_contest && event ? (
        match.status === 'final' ? (
          <ContestTable session={match} event={event} hub={hub} limit={3} />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-button text-ink">All factions · {lineUp.length} {lineUp.length === 1 ? 'entry' : 'entries'}</p>
            <div className="flex flex-wrap gap-1.5">
              {[...lineUp]
                .sort((x, y) => x.lane - y.lane)
                .map((e) => (
                  <FactionBadge key={e.id} faction={hub.factions.find((f) => f.id === e.faction_id)} logos={hub.logos} showName={false} />
                ))}
            </div>
          </div>
        )
      ) : (
        (
          [
            [a, match.score_a, 'a'],
            [b, match.score_b, 'b'],
          ] as const
        ).map(([f, s, k]) => {
          const won = match.winner_side === k;
          const lost = !!match.winner_side && !won;
          return (
            <div key={k} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-1.5">
                <FactionBadge
                  faction={f}
                  logos={hub.logos}
                  placeholder={waiting(k)}
                  nameClassName={cn(won && 'font-bold', lost && 'text-ink-muted', !f && 'font-medium text-ink-muted')}
                />
                {won && (
                  <>
                    <Check className="size-4 shrink-0 text-lime-dark-text" aria-hidden />
                    <span className="sr-only">Winner</span>
                  </>
                )}
              </span>
              <span className={cn('font-serif text-[26px] font-semibold tabular-nums', lost ? 'text-ink-muted' : 'text-ink')}>{score(s)}</span>
            </div>
          );
        })
      )}
      <div className="h-px bg-line" aria-hidden />
      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1 text-meta text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {dated && <span className="hidden md:inline">{dayLabel(manilaDate(match.scheduled_at), false)} · </span>}
          {match.status === 'live' ? `${match.live_note ? `${match.live_note} · ` : ''}Now` : dated ? clockLabel(match.scheduled_at) : whenLabel(match.scheduled_at)}
        </span>
        {venue && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{venue.name}</span>
          </span>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- contests (every faction at once)

const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;
const placeTone = ['', 'bg-gold text-ink', 'bg-silver text-ink', 'bg-bronze-deep text-on-dark'];

/** 1st / 2nd / 3rd in medal colours, then plain numbers. */
export function PlaceChip({ rank }: { rank: number | null }) {
  return (
    <span className={cn('grid h-7 min-w-9 shrink-0 place-items-center rounded-full px-2 text-[12px] font-bold tabular-nums', rank && rank <= 3 ? placeTone[rank] : 'border border-line text-ink-muted')}>
      {rank ? ordinal(rank) : '—'}
    </span>
  );
}

/** Contest results (or the performance order before they come in), best first. */
export function ContestTable({ session, event, hub, athletes = [], limit }: {
  session: SkMatchRow;
  event: Pick<SkEventRow, 'format' | 'result_unit' | 'is_team'>;
  hub: HubData;
  athletes?: { id: string; name: string }[];
  limit?: number;
}) {
  const entries = (hub.entries ?? []).filter((e) => e.match_id === session.id);
  const hasResults = entries.some((e) => (event.format === 'judged' ? e.place !== null : e.result !== null));
  const rows: (SkEntryRow & { rank: number | null })[] = hasResults ? rankEntries(event, entries) : [...entries].sort((a, b) => a.lane - b.lane).map((e) => ({ ...e, rank: null }));
  if (!entries.length) return <p className="text-meta text-ink-muted">The line-up will be posted soon.</p>;

  return (
    <ol className="flex flex-col gap-2" aria-label={hasResults ? 'Results' : 'Performance order'}>
      {(limit ? rows.slice(0, limit) : rows).map((e) => {
        const athlete = event.is_team ? null : athletes.find((x) => x.id === e.athlete_id)?.name;
        const out = e.status !== 'ok';
        return (
          <li key={e.id} className="flex items-center gap-3">
            {hasResults ? <PlaceChip rank={e.rank} /> : <span className="w-9 shrink-0 text-center text-meta font-semibold text-ink-muted">{e.lane}</span>}
            <span className="flex min-w-0 flex-1 flex-col">
              <FactionBadge faction={hub.factions.find((f) => f.id === e.faction_id)} logos={hub.logos} nameClassName={cn(e.rank === 1 && 'font-bold', out && 'text-ink-muted')} />
              {athlete && <span className="truncate pl-[42px] text-meta text-ink-muted">{athlete}</span>}
            </span>
            <span className={cn('shrink-0 font-serif text-[18px] font-semibold tabular-nums', out ? 'text-ink-muted' : 'text-ink')}>
              {out ? entryStatusShort[e.status] : event.format === 'judged' ? '' : formatResult(e.result, event.result_unit)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
