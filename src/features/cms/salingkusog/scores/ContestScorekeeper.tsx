import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { Pill } from '@/components/ui/StatusPill';
import type { SkEntryRow, SkEntryStatus, SkEventRow, SkMatchRow, SkMatchStatus } from '@/lib/database.types';
import { formatDateTime } from '@/lib/format';
import { entryStatusLabels, formatResult, isTimeUnit, lowerWins, parseResult, rankEntries, sessionComplete } from '@/lib/skContests';
import { statusActions, statusLabels } from '../scoring';
import { skErrorText, useDeleteMatch, useSaveEntry, useUpdateMatch } from '../skApi';
import { namer, type SkLookups } from './lookups';

type Patch = Partial<Pick<SkEntryRow, 'athlete_id' | 'result' | 'place' | 'lane' | 'status'>>;

const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

function EntryRow({ entry, rank, event, lookups, closed, onSave }: {
  entry: SkEntryRow;
  rank: number | null;
  event: SkEventRow;
  lookups: SkLookups;
  closed: boolean;
  onSave: (patch: Patch) => Promise<string | null>;
}) {
  const n = namer(lookups);
  const faction = n.faction(entry.faction_id);
  const athletes = lookups.athletes.filter((a) => a.faction_id === entry.faction_id);
  const judged = event.format === 'judged';
  const [text, setText] = useState(judged ? (entry.place?.toString() ?? '') : formatResult(entry.result, event.result_unit));
  const [lane, setLane] = useState(String(entry.lane));
  const [problem, setProblem] = useState<string | null>(null);
  const label = faction?.name ?? 'Faction';

  async function save(patch: Patch) {
    setProblem(await onSave(patch));
  }

  function saveValue() {
    if (judged) {
      const place = text.trim() ? Number(text) : null;
      if (place !== null && (!Number.isInteger(place) || place < 1 || place > 64)) return setProblem('Enter a place from 1 to 64.');
      if (place !== entry.place) void save({ place });
      return;
    }
    const value = parseResult(text);
    if (value === undefined) return setProblem(isTimeUnit(event.result_unit) ? 'Use a time like 12.84 or 1:02.45.' : 'Use a number like 5.42.');
    setProblem(null);
    if (value !== entry.result) void save({ result: value });
  }

  return (
    <li className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 last:border-0 md:grid-cols-[56px_minmax(0,1.3fr)_minmax(0,1fr)_140px_150px_60px] md:px-5">
      <Input
        aria-label={`Order, ${label}`}
        type="number"
        min={0}
        value={lane}
        disabled={closed}
        onChange={(e) => setLane(e.target.value)}
        onBlur={() => Number(lane) !== entry.lane && void save({ lane: Number(lane) || 0 })}
        className="text-center"
      />
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{label}</p>
        {problem && <p className="text-meta font-normal text-alert">{problem}</p>}
      </div>
      <div className="col-span-2 grid grid-cols-2 gap-2 md:col-span-1 md:contents">
        {event.is_team ? (
          <span className="hidden md:block" />
        ) : (
          <Select aria-label={`Athlete, ${label}`} value={entry.athlete_id ?? ''} disabled={closed} onChange={(e) => void save({ athlete_id: e.target.value || null })} className="col-span-2 md:col-span-1">
            <option value="">Athlete…</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        )}
        <Input
          aria-label={`${judged ? 'Place' : 'Result'}, ${label}`}
          inputMode="decimal"
          placeholder={judged ? 'Place' : isTimeUnit(event.result_unit) ? '0:00.00' : event.result_unit ? `0.00 ${event.result_unit}` : '0.00'}
          value={text}
          disabled={closed || entry.status !== 'ok'}
          onChange={(e) => setText(e.target.value)}
          onBlur={saveValue}
          className="tabular-nums"
        />
        <Select aria-label={`Status, ${label}`} value={entry.status} disabled={closed} onChange={(e) => void save({ status: e.target.value as SkEntryStatus })}>
          {(Object.keys(entryStatusLabels) as SkEntryStatus[]).map((s) => (
            <option key={s} value={s}>
              {entryStatusLabels[s]}
            </option>
          ))}
        </Select>
      </div>
      <span className="hidden text-right font-serif text-[20px] font-semibold tabular-nums text-ink md:block" aria-label={rank ? `Place: ${ordinal(rank)}` : 'No place yet'}>
        {rank ? ordinal(rank) : '—'}
      </span>
    </li>
  );
}

/** Scorekeeping for a contest session: every faction at once, results or places per entry. */
export function ContestScorekeeper({ match, event, entries, lookups, confirmMedals }: {
  match: SkMatchRow;
  event: SkEventRow;
  entries: SkEntryRow[];
  lookups: SkLookups;
  /** the event's last session is in and no medals are saved yet */
  confirmMedals: boolean;
}) {
  const n = namer(lookups);
  const navigate = useNavigate();
  const update = useUpdateMatch(match.id);
  const saveEntry = useSaveEntry();
  const del = useDeleteMatch();
  const [error, setError] = useState<string | null>(null);
  const venue = n.venue(match.venue_id);
  const closed = match.status === 'final' || match.status === 'cancelled';
  const judged = event.format === 'judged';
  const ranked = rankEntries(event, entries);

  async function onSave(id: string, patch: Patch) {
    try {
      await saveEntry.mutateAsync({ id, ...patch });
      return null;
    } catch (err) {
      return skErrorText(err);
    }
  }

  function onStatus(to: SkMatchStatus) {
    setError(null);
    if (to === 'final' && !sessionComplete(event, entries)) {
      return setError(judged ? 'Give every competing faction its place first (or mark it Did not start).' : 'Enter every result first (or mark the entry Did not start / Did not finish / Disqualified).');
    }
    if (to === 'cancelled' && !window.confirm('Cancel this contest?')) return;
    update.mutate({ status: to }, { onError: (err) => setError(skErrorText(err)) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/admin/salingkusog/scores" className="inline-flex items-center gap-1.5 text-button text-green-700 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> All games
        </Link>
        <span className="ml-auto text-meta text-ink-muted" aria-live="polite">
          {saveEntry.isPending || update.isPending ? 'Saving…' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-headline-m text-ink">
          {n.eventName(match.event_id)}
          {match.round && <span className="text-ink-muted"> · {match.round}</span>}
        </h2>
        <p className="flex flex-wrap items-center gap-2 text-meta text-ink-muted">
          <Pill tone={match.status === 'live' ? 'alert' : match.status === 'final' ? 'green' : 'neutral'}>{statusLabels[match.status]}</Pill>
          {formatDateTime(match.scheduled_at)}
          {venue && ` · ${venue.name}`}
          {` · ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`}
        </p>
      </div>

      {confirmMedals && (
        <Alert tone="success">
          That was the last contest of {n.eventName(match.event_id)}.{' '}
          <Link to={`/admin/salingkusog/results/${match.event_id}`} className="font-semibold underline">
            Check and confirm the medals
          </Link>
          .
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      <p className="text-meta font-normal text-ink-muted">
        {judged
          ? 'Type each faction’s place as the judges announce it. Two factions can share a place.'
          : `Type each ${event.is_team ? 'faction’s' : 'athlete’s'} result; ${lowerWins(event) ? 'the fastest time wins' : 'the highest mark wins'} and the places update as you go.`}{' '}
        {closed ? 'Reopen the contest to change results.' : ''}
      </p>

      <div className="overflow-hidden rounded-[12px] border border-line bg-surface">
        <div className="hidden grid-cols-[56px_minmax(0,1.3fr)_minmax(0,1fr)_140px_150px_60px] gap-x-3 border-b border-line bg-green-soft px-5 py-2 text-[11px] font-bold uppercase tracking-[0.99px] text-green-700 md:grid" aria-hidden>
          <span>Order</span>
          <span>Faction</span>
          <span>{event.is_team ? '' : 'Athlete'}</span>
          <span>{judged ? 'Place' : 'Result'}</span>
          <span>Status</span>
          <span className="text-right">Place</span>
        </div>
        <ul aria-label="Entries">
          {[...entries]
            .sort((a, b) => a.lane - b.lane)
            .map((e) => (
              <EntryRow key={e.id} entry={e} rank={ranked.find((r) => r.id === e.id)?.rank ?? null} event={event} lookups={lookups} closed={closed} onSave={(patch) => onSave(e.id, patch)} />
            ))}
        </ul>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        {statusActions(match.status).map((act) => (
          <Button key={act.to} variant={act.tone} className={act.tone === 'primary' ? 'min-h-12 flex-1 md:flex-none' : ''} onClick={() => onStatus(act.to)}>
            {act.label.replace('game', 'contest').replace('the score', 'the results')}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 className="size-4" aria-hidden />}
          onClick={() => {
            if (!window.confirm('Delete this contest? Its line-up and results are deleted too.')) return;
            del.mutate(match.id, { onSuccess: () => navigate('/admin/salingkusog/scores'), onError: (err) => setError(skErrorText(err)) });
          }}
        >
          Delete contest
        </Button>
      </div>
    </div>
  );
}
