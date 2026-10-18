import { ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pill } from '@/components/ui/StatusPill';
import type { SkEditionRow, SkMatchRow, SkMatchStatus } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { pendingSide } from '@/lib/skSources';
import { formatDate, formatShortDate } from '@/lib/format';
import { Card } from '../../ui';
import { defaultDay, editionDays, manilaTime, matchesForDay, statusLabels } from '../scoring';
import { useSkMatches } from '../skApi';
import { GameModal } from './GameModal';
import { namer, useSkLookups, type SkLookups } from './lookups';

const statusTone: Record<SkMatchStatus, 'alert' | 'neutral' | 'green' | 'review'> = { live: 'alert', upcoming: 'neutral', final: 'green', postponed: 'review', cancelled: 'neutral' };

export function GameRow({ match, lookups, games = [] }: { match: SkMatchRow; lookups: SkLookups; games?: SkMatchRow[] }) {
  const n = namer(lookups);
  const a = n.faction(match.side_a_id);
  const b = n.faction(match.side_b_id);
  const scored = match.score_a !== null && match.score_b !== null;
  return (
    <li className="border-b border-line last:border-0">
      <Link to={`/admin/salingkusog/scores/${match.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper md:px-5">
        <span className="w-12 shrink-0 text-meta font-semibold text-ink-muted">{manilaTime(match.scheduled_at)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-meta font-normal text-ink-muted">
            {n.eventName(match.event_id)}
            {match.round && ` · ${match.round}`}
          </p>
          <p className="truncate font-semibold text-ink">
            {a?.short_name ?? a?.name ?? <span className="font-normal text-ink-muted">{pendingSide(match, 'a', games) ?? 'TBD'}</span>} <span className="font-normal text-ink-muted">vs</span>{' '}
            {b?.short_name ?? b?.name ?? <span className="font-normal text-ink-muted">{pendingSide(match, 'b', games) ?? 'TBD'}</span>}
          </p>
        </div>
        {scored && (
          <span className="shrink-0 font-serif text-[20px] font-semibold tabular-nums text-ink">
            {match.score_a} – {match.score_b}
          </span>
        )}
        <Pill tone={statusTone[match.status]} className="shrink-0">
          {statusLabels[match.status]}
        </Pill>
        <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden />
      </Link>
    </li>
  );
}

export function ScoresView({ edition, matches, lookups, day, onDay, sportId, onSport, onAdd }: {
  edition: SkEditionRow;
  matches: SkMatchRow[];
  lookups: SkLookups;
  day: string;
  onDay: (d: string) => void;
  sportId: string;
  onSport: (id: string) => void;
  onAdd: () => void;
}) {
  const days = editionDays(edition);
  const n = namer(lookups);
  const list = matchesForDay(matches, day).filter((m) => !sportId || n.event(m.event_id)?.sport_id === sportId);
  const liveCount = matches.filter((m) => m.status === 'live').length;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Competition day" data-scroll-x className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {days.map((d) => (
          <button
            key={d.date}
            type="button"
            role="tab"
            aria-selected={d.date === day}
            onClick={() => onDay(d.date)}
            className={cn(
              'flex shrink-0 flex-col items-center rounded-[10px] border px-3.5 py-2 text-meta',
              d.date === day ? 'border-green-700 bg-green-700 text-on-dark' : 'border-line bg-surface text-ink hover:border-green-700',
            )}
          >
            <span className="font-semibold">Day {d.number}</span>
            <span className={d.date === day ? 'text-on-dark-muted' : 'text-ink-muted'}>{formatShortDate(d.date)}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[14px] font-semibold">
          Sport
          <Select value={sportId} onChange={(e) => onSport(e.target.value)} className="w-48">
            <option value="">All sports</option>
            {lookups.sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </label>
        {liveCount > 0 && <Pill tone="alert">{liveCount} live now</Pill>}
        <Button size="sm" icon={<Plus className="size-4" aria-hidden />} className="ml-auto" onClick={onAdd} disabled={!lookups.events.length}>
          Add game
        </Button>
      </div>
      {!lookups.events.length ? (
        <EmptyState title="No events yet">Add sports and events first, then import or add the schedule.</EmptyState>
      ) : list.length === 0 ? (
        <EmptyState title="No games this day">Import the schedule or add a game.</EmptyState>
      ) : (
        <Card as="div">
          <ul aria-label={`Games on ${formatDate(day)}`}>
            {list.map((m) => (
              <GameRow key={m.id} match={m} lookups={lookups} games={matches} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function ScoresTab({ edition }: { edition: SkEditionRow }) {
  const matches = useSkMatches(edition.id);
  const lookups = useSkLookups(edition.id);
  const [day, setDay] = useState(() => defaultDay(edition));
  const [sportId, setSportId] = useState('');
  const [adding, setAdding] = useState(false);

  const error = matches.error ?? lookups.error;
  if (error) return <ErrorState error={error} onRetry={() => (void matches.refetch(), lookups.refetch())} />;
  if (!matches.data || !lookups.data) return <Skeleton className="h-64" />;

  return (
    <>
      <ScoresView edition={edition} matches={matches.data} lookups={lookups.data} day={day} onDay={setDay} sportId={sportId} onSport={setSportId} onAdd={() => setAdding(true)} />
      {adding && <GameModal lookups={lookups.data} match={null} day={day} onClose={() => setAdding(false)} />}
    </>
  );
}
