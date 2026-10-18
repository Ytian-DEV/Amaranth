import { ArrowLeft, Medal, Plus, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pill } from '@/components/ui/StatusPill';
import type { SkEditionRow, SkEntryRow, SkEventRow, SkMatchRow, SkPlacementInput, SkPlacementRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { Card, CardHeader } from '../../ui';
import { namer, useSkLookups, type SkLookups } from '../scores/lookups';
import { defaultDay, medalForPlace, suggestedPodium } from '../scoring';
import { toPlacementInput, toRow, type Row } from './placementForm';
import { skErrorText, useSetPlacements, useSkEntries, useSkMatches, useSkPlacements } from '../skApi';

const medalStyle = { gold: 'bg-lime text-green-900', silver: 'bg-line text-ink', bronze: 'bg-status-review-soft text-ink' } as const;

export function MedalBadge({ place }: { place: number }) {
  const medal = medalForPlace(place);
  return (
    <span className={cn('inline-flex h-7 min-w-14 items-center justify-center gap-1 rounded-full px-2 text-meta font-semibold', medal ? medalStyle[medal] : 'border border-line text-ink-muted')}>
      {medal && <Medal className="size-3.5" aria-hidden />}
      {medal ? medal[0].toUpperCase() + medal.slice(1) : `${place}th`}
    </span>
  );
}

export function ResultsEditorView({ event, lookups, games, entries = [], placements, day, busy, message, onSave }: {
  event: SkEventRow;
  lookups: SkLookups;
  games: SkMatchRow[];
  entries?: SkEntryRow[];
  placements: SkPlacementRow[];
  day: string;
  busy?: boolean;
  message?: { tone: 'success' | 'error'; text: string } | null;
  onSave: (rows: SkPlacementInput[]) => void;
}) {
  const n = namer(lookups);
  const suggestion = suggestedPodium(event, games, entries);
  // nothing saved yet but the games are done: start from what they point to, for staff to confirm
  const suggested = !placements.length && suggestion.length > 0;
  const initial = () =>
    placements.length ? placements.map((p) => toRow(p, day)) : suggested ? suggestion.map((p) => toRow(p, day)) : [1, 2, 3].map((place) => toRow({ place }, day));
  const [rows, setRows] = useState<Row[]>(initial);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setRows(initial()), [placements]);
  const set = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function save() {
    const out = toPlacementInput(rows, event.is_team);
    if (typeof out === 'string') return setError(out);
    setError(null);
    onSave(out);
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/admin/salingkusog/results" className="inline-flex items-center gap-1.5 self-start text-button text-green-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All events
      </Link>
      <Card aria-labelledby="sk-results">
        <CardHeader
          id="sk-results"
          title={n.eventName(event.id)}
          action={
            suggestion.length > 0 ? (
              <Button size="sm" variant="outline" icon={<Wand2 className="size-4" aria-hidden />} onClick={() => setRows(suggestion.map((p) => toRow(p, day)))}>
                Fill from games
              </Button>
            ) : undefined
          }
        />
        <p className="px-5 text-meta font-normal text-ink-muted">
          Places 1–3 get gold, silver and bronze; the medal table updates by itself. Two teams can share a place (e.g. two bronzes). {event.is_team ? '' : 'Individual event: choose the athlete.'}
        </p>
        <div className="flex flex-col gap-3 p-5">
          {error && <Alert tone="error">{error}</Alert>}
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          {suggested && !message && (
            <Alert tone="info">All games are finished. These medals come from the results: check them, then press Save results to confirm. Nothing counts in the medal tally until you do.</Alert>
          )}
          {rows.map((r) => {
            const athletes = lookups.athletes.filter((a) => !r.faction_id || a.faction_id === r.faction_id);
            return (
              <div key={r.key} className="grid grid-cols-[64px_minmax(0,1fr)_36px] items-center gap-2 rounded-[10px] border border-line p-3 md:grid-cols-[64px_72px_minmax(0,1fr)_minmax(0,1fr)_120px_150px_36px]">
                <Input aria-label="Place" type="number" min={1} max={64} value={r.place} onChange={(e) => set(r.key, { place: e.target.value })} className="text-center" />
                <span className="hidden md:block">
                  <MedalBadge place={Number(r.place) || 0} />
                </span>
                <Select aria-label={`Faction, place ${r.place}`} value={r.faction_id} onChange={(e) => set(r.key, { faction_id: e.target.value, athlete_id: '' })}>
                  <option value="">Faction…</option>
                  {lookups.factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Select>
                <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert md:order-last" aria-label={`Remove place ${r.place}`}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
                <div className="col-span-3 grid grid-cols-2 gap-2 md:col-span-1 md:contents">
                  <Select aria-label={`Athlete, place ${r.place}`} value={r.athlete_id} onChange={(e) => set(r.key, { athlete_id: e.target.value })} className={cn(event.is_team && 'md:invisible', 'col-span-2 md:col-span-1')} disabled={event.is_team && !athletes.length}>
                    <option value="">{event.is_team ? 'Athlete (optional)' : 'Athlete…'}</option>
                    {athletes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </Select>
                  <Input aria-label={`Result, place ${r.place}`} placeholder={event.result_unit ? `e.g. 12.84${event.result_unit}` : 'e.g. 78–71'} value={r.result} onChange={(e) => set(r.key, { result: e.target.value })} />
                  <Input aria-label={`Day awarded, place ${r.place}`} type="date" value={r.awarded_on} onChange={(e) => set(r.key, { awarded_on: e.target.value })} />
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" icon={<Plus className="size-4" aria-hidden />} onClick={() => setRows((rs) => [...rs, toRow({ place: rs.length + 1 }, day)])}>
              Add place
            </Button>
            <Button loading={busy} className="ml-auto" onClick={save}>
              Save results
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ResultsListView({ lookups, placements, matches = [], entries = [] }: { lookups: SkLookups; placements: SkPlacementRow[]; matches?: SkMatchRow[]; entries?: SkEntryRow[] }) {
  const n = namer(lookups);
  if (!lookups.events.length) return <EmptyState title="No events yet">Add sports and events in the Sports & events tab.</EmptyState>;
  const done = lookups.events.filter((e) => placements.some((p) => p.event_id === e.id && p.medal === 'gold')).length;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-m text-ink-muted">
        {done} of {lookups.events.length} events have a gold medal.
      </p>
      {lookups.sports.map((s) => {
        const events = lookups.events.filter((e) => e.sport_id === s.id);
        if (!events.length) return null;
        return (
          <Card key={s.id} aria-labelledby={`res-${s.id}`}>
            <CardHeader id={`res-${s.id}`} title={s.name} />
            <ul className="px-5 pb-2">
              {events.map((e) => {
                const podium = placements.filter((p) => p.event_id === e.id && p.medal).sort((a, b) => a.place - b.place);
                return (
                  <li key={e.id} className="border-b border-line last:border-0">
                    <Link to={`/admin/salingkusog/results/${e.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 hover:text-green-700">
                      <span className="min-w-0 flex-1 font-semibold">{e.name}</span>
                      {podium.length ? (
                        <span className="flex flex-wrap gap-1.5 text-meta text-ink-muted">
                          {podium.map((p) => (
                            <span key={p.id}>
                              {p.medal === 'gold' ? '🥇' : p.medal === 'silver' ? '🥈' : '🥉'}
                              <span className="sr-only">{p.medal}</span> {n.faction(p.faction_id)?.short_name ?? n.faction(p.faction_id)?.name}
                            </span>
                          ))}
                        </span>
                      ) : suggestedPodium(e, matches.filter((m) => m.event_id === e.id), entries).length ? (
                        <Pill tone="review">Ready to confirm</Pill>
                      ) : (
                        <Pill tone="neutral">No results yet</Pill>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function useResultsData(edition: SkEditionRow) {
  const lookups = useSkLookups(edition.id);
  const placements = useSkPlacements(edition.id);
  const matches = useSkMatches(edition.id);
  const entries = useSkEntries(edition.id);
  const error = lookups.error ?? placements.error ?? matches.error ?? entries.error;
  const ready = lookups.data && placements.data && matches.data && entries.data;
  return {
    lookups: lookups.data,
    placements: placements.data,
    matches: matches.data,
    entries: entries.data,
    error,
    ready,
    refetch: () => (lookups.refetch(), void placements.refetch(), void matches.refetch(), void entries.refetch()),
  };
}

export function ResultsTab({ edition }: { edition: SkEditionRow }) {
  const d = useResultsData(edition);
  if (d.error) return <ErrorState error={d.error} onRetry={d.refetch} />;
  if (!d.ready) return <Skeleton className="h-64" />;
  return <ResultsListView lookups={d.lookups!} placements={d.placements!} matches={d.matches!} entries={d.entries!} />;
}

function EventResults({ edition, event, d }: { edition: SkEditionRow; event: SkEventRow; d: ReturnType<typeof useResultsData> }) {
  const save = useSetPlacements(event.id);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  return (
    <ResultsEditorView
      event={event}
      lookups={d.lookups!}
      games={d.matches!.filter((m) => m.event_id === event.id)}
      entries={d.entries!}
      placements={d.placements!.filter((p) => p.event_id === event.id)}
      day={defaultDay(edition)}
      busy={save.isPending}
      message={message}
      onSave={(rows) => {
        setMessage(null);
        save.mutate(rows, {
          onSuccess: (count) => setMessage({ tone: 'success', text: count ? `Saved ${count} result${count === 1 ? '' : 's'}. The medal table is up to date.` : 'Results cleared.' }),
          onError: (err) => setMessage({ tone: 'error', text: skErrorText(err) }),
        });
      }}
    />
  );
}

/** /admin/salingkusog/results/:eventId */
export function ResultsEditor({ edition }: { edition: SkEditionRow }) {
  const { eventId } = useParams();
  const d = useResultsData(edition);
  if (d.error) return <ErrorState error={d.error} onRetry={d.refetch} />;
  if (!d.ready) return <Skeleton className="h-64" />;
  const event = d.lookups!.events.find((e) => e.id === eventId);
  if (!event) return <EmptyState title="Event not found" action={<Link to="/admin/salingkusog/results" className="text-button text-green-700 underline">Back to all events</Link>} />;
  return <EventResults key={event.id} edition={edition} event={event} d={d} />;
}
