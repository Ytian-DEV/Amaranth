import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import type { SkMatchRow } from '@/lib/database.types';
import { numOrNull } from '../setup/form';
import { fromLocalInput, toLocalInput } from '../scoring';
import { skErrorText, useCreateMatch, useRecapArticleOptions, useUpdateMatch } from '../skApi';
import type { SkLookups } from './lookups';

type Props = { lookups: SkLookups; match: SkMatchRow | null; day: string; onClose: () => void; onCreated?: (id: string) => void };

function EditGame({ match, ...rest }: Props & { match: SkMatchRow }) {
  const update = useUpdateMatch(match.id);
  return <GameForm {...rest} match={match} busy={update.isPending} save={(row) => update.mutateAsync(row).then(() => undefined)} />;
}

function NewGame(props: Props) {
  const create = useCreateMatch();
  return <GameForm {...props} busy={create.isPending} save={(row) => create.mutateAsync(row as never).then((r) => props.onCreated?.(r.id))} />;
}

/** Add or edit a game's details (not its score). */
export function GameModal(props: Props) {
  return props.match ? <EditGame {...props} match={props.match} /> : <NewGame {...props} />;
}

type GameRow = Pick<SkMatchRow, 'event_id' | 'round' | 'scheduled_at' | 'venue_id' | 'side_a_id' | 'side_b_id' | 'round_order' | 'bracket_slot' | 'recap_article_id'>;

const statusNote: Record<string, string> = { published: '', scheduled: ' (scheduled)', draft: ' (draft)', submitted: ' (in review)', in_review: ' (in review)', rejected: ' (rejected)', archived: ' (archived)' };

function GameForm({ lookups, match, day, onClose, busy, save }: Props & { busy: boolean; save: (row: GameRow) => Promise<void> }) {
  const [f, setF] = useState({
    event_id: match?.event_id ?? '',
    round: match?.round ?? '',
    when: match ? toLocalInput(match.scheduled_at) : `${day}T08:00`,
    venue_id: match?.venue_id ?? '',
    side_a_id: match?.side_a_id ?? '',
    side_b_id: match?.side_b_id ?? '',
    round_order: match?.round_order?.toString() ?? '0',
    bracket_slot: match?.bracket_slot?.toString() ?? '',
    recap_article_id: match?.recap_article_id ?? '',
  });
  const [articleSearch, setArticleSearch] = useState('');
  const articles = useRecapArticleOptions(articleSearch, f.recap_article_id || null);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit() {
    if (!f.event_id) return setError('Choose the event.');
    if (!f.when) return setError('Choose the date and time.');
    if (f.side_a_id && f.side_a_id === f.side_b_id) return setError('A faction can’t play itself.');
    try {
      const ev = lookups.events.find((e) => e.id === f.event_id);
      await save({
        event_id: f.event_id,
        round: f.round.trim() || null,
        scheduled_at: fromLocalInput(f.when),
        venue_id: f.venue_id || ev?.venue_id || null,
        side_a_id: f.side_a_id || null,
        side_b_id: f.side_b_id || null,
        round_order: Number(f.round_order) || 0,
        bracket_slot: numOrNull(f.bracket_slot),
        recap_article_id: f.recap_article_id || null,
      });
      onClose();
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  const factionOptions = (
    <>
      <option value="">TBD</option>
      {lookups.factions.map((x) => (
        <option key={x.id} value={x.id}>
          {x.name}
        </option>
      ))}
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={match ? 'Edit game' : 'Add game'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={() => void submit()}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Event" required>
          {({ id }) => (
            <Select id={id} value={f.event_id} onChange={set('event_id')}>
              <option value="">Choose…</option>
              {lookups.sports.map((s) => (
                <optgroup key={s.id} label={s.name}>
                  {lookups.events
                    .filter((e) => e.sport_id === s.id)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {s.name} · {e.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Round" hint="Group A, Semifinal 1, Final, Bronze game">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={f.round} onChange={set('round')} />}
          </Field>
          <Field label="Starts (Philippine time)" required>{({ id }) => <Input id={id} type="datetime-local" value={f.when} onChange={set('when')} />}</Field>
          <Field label="Side A">{({ id }) => <Select id={id} value={f.side_a_id} onChange={set('side_a_id')}>{factionOptions}</Select>}</Field>
          <Field label="Side B">{({ id }) => <Select id={id} value={f.side_b_id} onChange={set('side_b_id')}>{factionOptions}</Select>}</Field>
          <Field label="Venue" hint="Empty = the event’s main venue">
            {({ id, describedBy }) => (
              <Select id={id} aria-describedby={describedBy} value={f.venue_id} onChange={set('venue_id')}>
                <option value="">—</option>
                {lookups.venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bracket column" hint="0 = first round">
              {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="number" min={0} value={f.round_order} onChange={set('round_order')} />}
            </Field>
            <Field label="Position" hint="Top to bottom">
              {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="number" min={1} value={f.bracket_slot} onChange={set('bracket_slot')} />}
            </Field>
          </div>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[14px] font-semibold">Recap article</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input aria-label="Search articles" type="search" placeholder="Search by title" value={articleSearch} onChange={(e) => setArticleSearch(e.target.value)} />
            <Select aria-label="Recap article" value={f.recap_article_id} onChange={set('recap_article_id')}>
              <option value="">— none —</option>
              {(articles.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                  {statusNote[a.status] ?? ''}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-meta font-normal text-ink-muted">Shown on the game’s public recap page once the article is published.</p>
        </fieldset>
      </div>
    </Modal>
  );
}
