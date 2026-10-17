import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/StatusPill';
import type { SkAwardKind, SkAwardRow, SkEditionRow, SkMatchRow, SkStatValue } from '@/lib/database.types';
import { formatDate } from '@/lib/format';
import { Card, CardHeader } from '../../ui';
import { awardKindLabels, awardKinds } from '../labels';
import { namer, useSkLookups, type SkLookups } from '../scores/lookups';
import { defaultDay, editionDays, manilaDate, manilaTime } from '../scoring';
import { skErrorText, useDeleteSkRow, useSaveSkRow, useSkAwards, useSkMatches } from '../skApi';
import { RowActions } from '../setup/shared';

const statText = (s: SkStatValue[]) => s.map((x) => `${x.label} ${x.value}`).join(', ');
const parseStats = (t: string): SkStatValue[] =>
  t
    .split(/[,;\n]/)
    .map((p) => p.trim().match(/^(.+?)\s+(\S+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ label: m[1].trim(), value: m[2] }));

function AwardModal({ edition, award, lookups, matches, onClose }: { edition: SkEditionRow; award: SkAwardRow | null; lookups: SkLookups; matches: SkMatchRow[]; onClose: () => void }) {
  const save = useSaveSkRow('sk_awards');
  const n = namer(lookups);
  const [f, setF] = useState({
    kind: award?.kind ?? ('mvp_of_day' as SkAwardKind),
    day: award?.day ?? defaultDay(edition),
    athlete_id: award?.athlete_id ?? '',
    event_id: award?.event_id ?? '',
    match_id: award?.match_id ?? '',
    headline: award?.headline ?? '',
    stats: statText(award?.stat_line ?? []),
    quote: award?.quote ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const dayGames = matches.filter((m) => manilaDate(m.scheduled_at) === f.day && (!f.event_id || m.event_id === f.event_id));

  async function submit() {
    if (!f.athlete_id) return setError('Choose the athlete.');
    try {
      const game = matches.find((m) => m.id === f.match_id);
      await save.mutateAsync({
        id: award?.id,
        edition_id: edition.id,
        kind: f.kind,
        day: f.day,
        athlete_id: f.athlete_id,
        event_id: f.event_id || game?.event_id || null,
        match_id: f.match_id || null,
        headline: f.headline.trim() || null,
        stat_line: parseStats(f.stats),
        quote: f.quote.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={award ? 'Edit award' : 'New award'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => void submit()}>Save</Button></>}>
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Award">
            {({ id }) => (
              <Select id={id} value={f.kind} onChange={set('kind')}>
                {awardKinds.map((k) => <option key={k} value={k}>{awardKindLabels[k]}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Day">
            {({ id }) => (
              <Select id={id} value={f.day} onChange={set('day')}>
                {editionDays(edition).map((d) => <option key={d.date} value={d.date}>Day {d.number} · {formatDate(d.date)}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Athlete" required>
            {({ id }) => (
              <Select id={id} value={f.athlete_id} onChange={set('athlete_id')}>
                <option value="">Choose…</option>
                {lookups.factions.map((fa) => (
                  <optgroup key={fa.id} label={fa.name}>
                    {lookups.athletes.filter((a) => a.faction_id === fa.id).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </optgroup>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Event">
            {({ id }) => (
              <Select id={id} value={f.event_id} onChange={(e) => setF((x) => ({ ...x, event_id: e.target.value, match_id: '' }))}>
                <option value="">—</option>
                {lookups.events.map((e) => <option key={e.id} value={e.id}>{n.eventName(e.id)}</option>)}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Game" hint="Links the card to the match recap">
          {({ id, describedBy }) => (
            <Select id={id} aria-describedby={describedBy} value={f.match_id} onChange={set('match_id')}>
              <option value="">—</option>
              {dayGames.map((m) => (
                <option key={m.id} value={m.id}>
                  {manilaTime(m.scheduled_at)} · {n.eventName(m.event_id)} · {n.faction(m.side_a_id)?.short_name ?? 'TBD'} vs {n.faction(m.side_b_id)?.short_name ?? 'TBD'}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Headline" hint="e.g. 12.84s, or Gold · 100m Dash, Women">
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={f.headline} onChange={set('headline')} />}
        </Field>
        <Field label="Stat line" hint="PTS 24, REB 9, AST 5 — shown big on the social card">
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={f.stats} onChange={set('stats')} />}
        </Field>
        <Field label="Quote">{({ id }) => <Textarea id={id} rows={2} value={f.quote} onChange={set('quote')} />}</Field>
      </div>
    </Modal>
  );
}

export function AwardsView({ edition, awards, lookups, onAdd, onEdit, onDelete }: {
  edition: SkEditionRow;
  awards: SkAwardRow[];
  lookups: SkLookups;
  onAdd: () => void;
  onEdit: (a: SkAwardRow) => void;
  onDelete: (a: SkAwardRow) => void;
}) {
  const n = namer(lookups);
  const days = editionDays(edition).reverse();
  return (
    <div className="flex flex-col gap-4">
      <Button icon={<Plus className="size-4" aria-hidden />} className="self-start" onClick={onAdd} disabled={!lookups.athletes.length}>
        New award
      </Button>
      {!lookups.athletes.length ? (
        <EmptyState title="Add athletes first">Awards go to an athlete. Add them in the Athletes tab.</EmptyState>
      ) : !awards.length ? (
        <EmptyState title="No awards yet">Pick the MVP of the Day and Athlete of the Day after each day’s games.</EmptyState>
      ) : (
        days.map((d) => {
          const list = awards.filter((a) => a.day === d.date);
          if (!list.length) return null;
          return (
            <Card key={d.date} aria-labelledby={`aw-${d.date}`}>
              <CardHeader id={`aw-${d.date}`} title={`Day ${d.number} · ${formatDate(d.date)}`} />
              <ul className="px-5 pb-2">
                {list.map((a) => {
                  const ath = n.athlete(a.athlete_id);
                  return (
                    <li key={a.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2">
                          <Pill tone={a.kind === 'athlete_of_day' ? 'blue' : 'lime'}>{awardKindLabels[a.kind]}</Pill>
                          <span className="font-semibold text-ink">{ath?.name ?? 'Unknown athlete'}</span>
                          <span className="text-meta text-ink-muted">{n.faction(ath?.faction_id)?.short_name}</span>
                        </p>
                        <p className="mt-1 truncate text-meta font-normal text-ink-muted">
                          {[a.event_id && n.eventName(a.event_id), a.headline, statText(a.stat_line)].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <RowActions label={`${awardKindLabels[a.kind]} ${ath?.name ?? ''}`} onEdit={() => onEdit(a)} onDelete={() => onDelete(a)} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })
      )}
    </div>
  );
}

export function AwardsTab({ edition }: { edition: SkEditionRow }) {
  const awards = useSkAwards(edition.id);
  const lookups = useSkLookups(edition.id);
  const matches = useSkMatches(edition.id);
  const del = useDeleteSkRow('sk_awards');
  const [modal, setModal] = useState<SkAwardRow | 'new' | null>(null);

  const error = awards.error ?? lookups.error ?? matches.error;
  if (error) return <ErrorState error={error} onRetry={() => (void awards.refetch(), lookups.refetch(), void matches.refetch())} />;
  if (!awards.data || !lookups.data || !matches.data) return <Skeleton className="h-64" />;

  return (
    <>
      {del.error && <Alert tone="error">{skErrorText(del.error)}</Alert>}
      <AwardsView edition={edition} awards={awards.data} lookups={lookups.data} onAdd={() => setModal('new')} onEdit={setModal} onDelete={(a) => window.confirm('Delete this award?') && del.mutate(a.id)} />
      {modal && <AwardModal edition={edition} award={modal === 'new' ? null : modal} lookups={lookups.data} matches={matches.data} onClose={() => setModal(null)} />}
    </>
  );
}
