import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import type { SkEditionRow, SkEventRow, SkFactionRow, SkSportRow, SkVenueRow } from '@/lib/database.types';
import { fromLocalInput } from '../scoring';
import { skErrorText, useCreateContest } from '../skApi';

/** One session where every faction competes at once (dance, swimming, athletics…). */
export function CreateContestModal({ edition, sport, event, factions, venues, onClose }: {
  edition: Pick<SkEditionRow, 'starts_on'>;
  sport: SkSportRow;
  event: SkEventRow;
  factions: SkFactionRow[];
  venues: SkVenueRow[];
  onClose: () => void;
}) {
  const create = useCreateContest();
  const navigate = useNavigate();
  const [at, setAt] = useState(`${edition.starts_on}T08:00`);
  const [round, setRound] = useState('Final');
  const [venueId, setVenueId] = useState(event.venue_id ?? '');
  const [picked, setPicked] = useState<string[]>(factions.map((f) => f.id));
  const [shuffle, setShuffle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!picked.length) return setError('Pick at least one faction.');
    try {
      const id = await create.mutateAsync({
        p_event_id: event.id,
        p_at: fromLocalInput(at),
        p_venue_id: venueId || null,
        p_round: round.trim() || 'Final',
        p_factions: factions.filter((f) => picked.includes(f.id)).map((f) => f.id),
        p_shuffle: shuffle,
      });
      navigate(`/admin/salingkusog/scores/${id}`);
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Create contest · ${sport.name} ${event.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={create.isPending} onClick={() => void submit()}>
            Create contest
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error && <Alert tone="error">{error}</Alert>}
        <p className="text-body-m text-ink-muted">
          Every faction competes in one session. {event.format === 'judged' ? 'You’ll enter each faction’s place as the judges announce it.' : `You’ll enter each ${event.is_team ? 'faction’s' : 'athlete’s'} ${event.result_unit ? `result (${event.result_unit})` : 'result'}; the places work themselves out.`}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts" required>
            {({ id }) => <Input id={id} type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />}
          </Field>
          <Field label="Name" hint="Usually “Final”">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={round} maxLength={60} onChange={(e) => setRound(e.target.value)} />}
          </Field>
          <Field label="Venue">
            {({ id }) => (
              <Select id={id} value={venueId} onChange={(e) => setVenueId(e.target.value)}>
                <option value="">No venue</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Performance order">
            {({ id }) => (
              <Select id={id} value={shuffle ? 'draw' : 'list'} onChange={(e) => setShuffle(e.target.value === 'draw')}>
                <option value="list">Faction order (as listed)</option>
                <option value="draw">Random draw</option>
              </Select>
            )}
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[14px] font-semibold">Taking part</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {factions.map((f) => (
              <Checkbox key={f.id} label={f.name} checked={picked.includes(f.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, f.id] : p.filter((x) => x !== f.id)))} />
            ))}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}
