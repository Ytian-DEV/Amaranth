import { ArrowLeft, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pill } from '@/components/ui/StatusPill';
import type { SkEditionRow, SkFactionRow, SkMatchRow, SkMatchStatus, SkPeriod } from '@/lib/database.types';
import { formatDateTime } from '@/lib/format';
import { Card, CardHeader } from '../../ui';
import { clampScore, manilaDate, nextPeriodLabel, scoreSteps, statusActions, statusLabels } from '../scoring';
import { skErrorText, useDeleteMatch, useMatchRealtime, useSkMatch, useUpdateMatch } from '../skApi';
import { BoxScore } from './BoxScore';
import { GameModal } from './GameModal';
import { namer, useSkLookups, type SkLookups } from './lookups';

type Draft = Pick<SkMatchRow, 'score_a' | 'score_b' | 'periods' | 'live_note'>;
const SAVE_DELAY = 600;

function SidePanel({
  side,
  faction,
  score,
  steps,
  disabled,
  onChange,
}: {
  side: 'A' | 'B';
  faction: SkFactionRow | undefined;
  score: number | null;
  steps: number[];
  disabled: boolean;
  onChange: (v: number | null) => void;
}) {
  const name = faction?.name ?? 'TBD';
  return (
    <section aria-label={`Side ${side}: ${name}`} className="flex min-w-0 flex-1 flex-col items-stretch gap-2.5 rounded-[12px] border border-line bg-surface p-2.5 md:gap-3 md:p-4">
      <div className="flex items-center gap-2">
        <span className="h-8 w-1.5 shrink-0 rounded-full bg-line" style={faction ? { backgroundColor: faction.color } : undefined} aria-hidden />
        <p className="min-w-0 flex-1 truncate font-semibold leading-tight text-ink" title={name}>
          <span className="md:hidden">{faction?.short_name ?? name}</span>
          <span className="hidden md:inline">{name}</span>
        </p>
      </div>
      <label className="sr-only" htmlFor={`score-${side}`}>
        {name} score
      </label>
      <input
        id={`score-${side}`}
        inputMode="decimal"
        value={score ?? ''}
        placeholder="–"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.trim() === '' ? null : clampScore(Number(e.target.value) || 0))}
        className="w-full bg-transparent text-center font-serif text-[64px] font-semibold leading-none tabular-nums text-ink outline-none placeholder:text-ink-muted focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-green-700 disabled:opacity-60 md:text-[80px]"
      />
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(clampScore((score ?? 0) + s))}
            className="grid h-14 place-items-center rounded-[10px] bg-green-700 text-[18px] font-semibold text-on-dark hover:bg-green-900 disabled:opacity-40"
            aria-label={`${name} plus ${s}`}
          >
            +{s}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled || !score}
        onClick={() => onChange(clampScore((score ?? 0) - 1))}
        className="flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-line text-button text-ink hover:bg-paper disabled:opacity-40"
        aria-label={`${name} minus 1`}
      >
        <Minus className="size-4" aria-hidden /> 1
      </button>
    </section>
  );
}

function Periods({ periods, sportLabelFrom, disabled, onChange }: { periods: SkPeriod[]; sportLabelFrom: (labels: string[]) => string; disabled: boolean; onChange: (p: SkPeriod[]) => void }) {
  const set = (i: number, patch: Partial<SkPeriod>) => onChange(periods.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const num = (v: string) => (v.trim() === '' ? null : clampScore(Number(v) || 0));
  return (
    <Card aria-labelledby="sk-periods">
      <CardHeader id="sk-periods" title="Quarters / sets" />
      <div className="flex flex-col gap-2 px-5 pb-4">
        {periods.length === 0 && <p className="text-meta font-normal text-ink-muted">Optional: points per quarter, set or game.</p>}
        {periods.map((p, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_72px_72px_36px] items-center gap-2">
            <Input aria-label={`Period ${i + 1} label`} value={p.label} disabled={disabled} onChange={(e) => set(i, { label: e.target.value })} />
            <Input aria-label={`${p.label} side A`} inputMode="decimal" value={p.a ?? ''} disabled={disabled} onChange={(e) => set(i, { a: num(e.target.value) })} className="text-center tabular-nums" />
            <Input aria-label={`${p.label} side B`} inputMode="decimal" value={p.b ?? ''} disabled={disabled} onChange={(e) => set(i, { b: num(e.target.value) })} className="text-center tabular-nums" />
            <button type="button" disabled={disabled} onClick={() => onChange(periods.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert" aria-label={`Remove ${p.label}`}>
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        <Button size="sm" variant="ghost" disabled={disabled} icon={<Plus className="size-4" aria-hidden />} className="self-start" onClick={() => onChange([...periods, { label: sportLabelFrom(periods.map((p) => p.label)), a: null, b: null }])}>
          Add {sportLabelFrom(periods.map((p) => p.label))}
        </Button>
      </div>
    </Card>
  );
}

export function ScorekeeperView({
  match,
  lookups,
  saving,
  error,
  onDraft,
  onStatus,
  onEdit,
  onDelete,
  boxScore,
}: {
  match: SkMatchRow;
  lookups: SkLookups;
  saving: 'idle' | 'pending' | 'saved';
  error: string | null;
  onDraft: (patch: Partial<Draft>) => void;
  onStatus: (to: SkMatchStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  boxScore?: React.ReactNode;
}) {
  const n = namer(lookups);
  const sport = n.eventSport(match.event_id);
  const venue = n.venue(match.venue_id);
  const a = n.faction(match.side_a_id);
  const b = n.faction(match.side_b_id);
  const steps = scoreSteps(sport);
  const closed = match.status === 'final' || match.status === 'cancelled';
  const live = match.status === 'live';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/admin/salingkusog/scores" className="inline-flex items-center gap-1.5 text-button text-green-700 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> All games
        </Link>
        <span className="ml-auto text-meta text-ink-muted" aria-live="polite">
          {saving === 'pending' ? 'Saving…' : saving === 'saved' ? 'Saved' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-headline-m text-ink">
          {n.eventName(match.event_id)}
          {match.round && <span className="text-ink-muted"> · {match.round}</span>}
        </h2>
        <p className="flex flex-wrap items-center gap-2 text-meta text-ink-muted">
          <Pill tone={live ? 'alert' : match.status === 'final' ? 'green' : 'neutral'}>{statusLabels[match.status]}</Pill>
          {formatDateTime(match.scheduled_at)}
          {venue && ` · ${venue.name}`}
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {closed && <Alert tone="info">This game is {statusLabels[match.status].toLowerCase()}. Reopen it to change the score.</Alert>}

      <div className="flex gap-3">
        <SidePanel side="A" faction={a} score={match.score_a} steps={steps} disabled={closed} onChange={(v) => onDraft({ score_a: v })} />
        <SidePanel side="B" faction={b} score={match.score_b} steps={steps} disabled={closed} onChange={(v) => onDraft({ score_b: v })} />
      </div>

      {live && (
        <Field label="Live note" hint="Shown next to the score, e.g. “Q3 · 4:12” or “Set 4”">
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={match.live_note ?? ''} maxLength={40} onChange={(e) => onDraft({ live_note: e.target.value || null })} />}
        </Field>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        {statusActions(match.status).map((act) => (
          <Button key={act.to} variant={act.tone} className={act.tone === 'primary' ? 'min-h-12 flex-1 md:flex-none' : ''} onClick={() => onStatus(act.to)}>
            {act.label}
          </Button>
        ))}
      </div>

      <Periods periods={match.periods} sportLabelFrom={(labels) => nextPeriodLabel(labels, sport)} disabled={closed} onChange={(p) => onDraft({ periods: p })} />

      {boxScore}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button variant="outline" size="sm" icon={<Pencil className="size-4" aria-hidden />} onClick={onEdit}>
          Edit game details
        </Button>
        <Button variant="ghost" size="sm" icon={<Trash2 className="size-4" aria-hidden />} onClick={onDelete}>
          Delete game
        </Button>
      </div>
    </div>
  );
}

/** /admin/salingkusog/scores/:matchId */
export function Scorekeeper({ edition }: { edition: SkEditionRow }) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const match = useSkMatch(matchId);
  const lookups = useSkLookups(edition.id);
  const update = useUpdateMatch(matchId ?? '');
  const del = useDeleteMatch();
  const [draft, setDraft] = useState<Partial<Draft>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const pendingRef = useRef(false);
  pendingRef.current = update.isPending;
  const { mutateAsync } = update;

  const isEditing = useCallback(() => Object.keys(draftRef.current).length > 0 || pendingRef.current, []);
  useMatchRealtime(matchId, isEditing);

  const flush = useCallback(
    async (extra: Partial<SkMatchRow> = {}) => {
      clearTimeout(timer.current);
      const patch = { ...draftRef.current, ...extra };
      if (!Object.keys(patch).length) return;
      setDraft({});
      setError(null);
      try {
        await mutateAsync(patch);
        setSaved(true);
      } catch (err) {
        setError(skErrorText(err));
      }
    },
    [mutateAsync],
  );

  // save the last taps when leaving the screen
  useEffect(() => () => void flush(), [flush]);

  if (match.error || lookups.error) return <ErrorState error={match.error ?? lookups.error} onRetry={() => (void match.refetch(), lookups.refetch())} />;
  if (match.isPending || !lookups.data) return <Skeleton className="h-96" />;
  if (!match.data) return <EmptyState title="Game not found" action={<Link to="/admin/salingkusog/scores" className="text-button text-green-700 underline">Back to all games</Link>} />;

  const shown: SkMatchRow = { ...match.data, ...draft };

  function onDraft(patch: Partial<Draft>) {
    setSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_DELAY);
  }

  function onStatus(to: SkMatchStatus) {
    if (to === 'final' && (shown.score_a === null || shown.score_b === null)) return setError('Enter both scores before finishing the game.');
    if (to === 'final' && shown.score_a === shown.score_b && !window.confirm('The score is tied, so no winner will be recorded. Finish anyway?')) return;
    if (to === 'cancelled' && !window.confirm('Cancel this game?')) return;
    const extra: Partial<SkMatchRow> = { status: to };
    if (to === 'live') {
      extra.score_a = shown.score_a ?? 0;
      extra.score_b = shown.score_b ?? 0;
    }
    void flush(extra);
  }

  return (
    <>
      <ScorekeeperView
        match={shown}
        lookups={lookups.data}
        saving={update.isPending || Object.keys(draft).length ? 'pending' : saved ? 'saved' : 'idle'}
        error={error}
        onDraft={onDraft}
        onStatus={onStatus}
        onEdit={() => setEditing(true)}
        onDelete={() => {
          if (!window.confirm('Delete this game? Its score and player stats are deleted too.')) return;
          del.mutate(shown.id, { onSuccess: () => navigate('/admin/salingkusog/scores'), onError: (err) => setError(skErrorText(err)) });
        }}
        boxScore={<BoxScore match={shown} lookups={lookups.data} disabled={shown.status === 'cancelled'} onTeamStats={(team_stats) => void flush({ team_stats })} />}
      />
      {editing && <GameModal lookups={lookups.data} match={match.data} day={manilaDate(match.data.scheduled_at)} onClose={() => setEditing(false)} />}
    </>
  );
}
