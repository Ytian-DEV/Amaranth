import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import type { SkEditionRow, SkEventRow, SkFactionRow, SkMatchRow, SkSportRow, SkVenueRow } from '@/lib/database.types';
import { pendingSide } from '@/lib/skSources';
import { formatShortDate } from '@/lib/format';
import { fromLocalInput, manilaDate, manilaTime, toLocalInput } from '../scoring';
import { skErrorText, useBuildSchedule } from '../skApi';
import { buildFormats, scheduleSize, type BuildFormat } from './buildSchedule';

const isBuildFormat = (f: string): f is BuildFormat => buildFormats.some((b) => b.value === f);

export function BuildScheduleModal({ edition, sport, event, factions, venues, games, onClose }: {
  edition: Pick<SkEditionRow, 'starts_on' | 'ends_on'>;
  sport: SkSportRow;
  event: SkEventRow;
  factions: SkFactionRow[];
  venues: SkVenueRow[];
  /** this event's games (refreshed after building) */
  games: SkMatchRow[];
  onClose: () => void;
}) {
  const build = useBuildSchedule();
  const [format, setFormat] = useState<BuildFormat>(isBuildFormat(event.format) ? event.format : 'bracket');
  const initialSeeds = event.seeds.length ? event.seeds.filter((id) => factions.some((f) => f.id === id)) : factions.map((f) => f.id);
  const [seeds, setSeeds] = useState<string[]>(initialSeeds);
  const [firstAt, setFirstAt] = useState(() => (games[0] ? toLocalInput(games[0].scheduled_at) : `${edition.starts_on}T08:00`));
  const [roundGap, setRoundGap] = useState('24');
  const [gameGap, setGameGap] = useState('90');
  const [venueId, setVenueId] = useState(event.venue_id ?? '');
  const [bronze, setBronze] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [built, setBuilt] = useState<number | null>(null);

  const played = games.some((g) => g.status === 'live' || g.status === 'final');
  const size = scheduleSize(format, seeds.length, bronze);
  // the last round's day, to warn when it falls after the games end (the Scores tab only shows edition days)
  const lastDay = firstAt && size.rounds ? manilaDate(new Date(new Date(fromLocalInput(firstAt)).getTime() + (size.rounds - 1) * (Number(roundGap) || 0) * 3_600_000).toISOString()) : null;
  const tooLate = !!lastDay && lastDay > edition.ends_on;
  const name = (id: string | null) => factions.find((f) => f.id === id)?.name;
  const move = (i: number, d: -1 | 1) =>
    setSeeds((s) => {
      const next = [...s];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const toggle = (id: string, on: boolean) => setSeeds((s) => (on ? [...s, id] : s.filter((x) => x !== id)));

  async function submit() {
    setError(null);
    if (seeds.length < 2) return setError('Pick at least 2 factions.');
    if (games.length && !window.confirm(`This replaces the ${games.length} game${games.length === 1 ? '' : 's'} already scheduled for ${sport.name} · ${event.name}.`)) return;
    try {
      const count = await build.mutateAsync({
        p_event_id: event.id,
        p_format: format,
        p_seeds: seeds,
        p_first_at: fromLocalInput(firstAt),
        p_round_gap_hours: Number(roundGap) || 0,
        p_game_gap_minutes: Number(gameGap) || 0,
        p_venue_id: venueId || null,
        p_bronze: bronze,
      });
      setBuilt(count);
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  const title = `Build schedule · ${sport.name} ${event.name}`;
  if (built !== null) {
    const list = [...games].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    return (
      <Modal open onClose={onClose} title={title} footer={<Button onClick={onClose}>Done</Button>}>
        <div className="flex flex-col gap-3">
          <Alert tone="success">
            Created {built} game{built === 1 ? '' : 's'}. Enter scores in the Scores tab; the next games fill in by themselves.
          </Alert>
          <ul className="flex flex-col divide-y divide-line rounded-[10px] border border-line" aria-label="Games created">
            {list.map((g) => (
              <li key={g.id} className="flex flex-wrap items-baseline gap-x-3 px-3 py-2 text-meta">
                <span className="w-28 shrink-0 font-semibold text-ink">{g.round}</span>
                <span className="min-w-0 flex-1 text-ink">
                  {name(g.side_a_id) ?? pendingSide(g, 'a', games)} <span className="text-ink-muted">vs</span> {name(g.side_b_id) ?? pendingSide(g, 'b', games)}
                </span>
                <span className="text-ink-muted">
                  {formatShortDate(manilaDate(g.scheduled_at))} · {manilaTime(g.scheduled_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={build.isPending} disabled={played || tooLate} onClick={() => void submit()}>
            {games.length ? 'Rebuild schedule' : 'Create games'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {played && <Alert tone="error">This event already has games played, so its schedule can’t be rebuilt.</Alert>}
        {error && <Alert tone="error">{error}</Alert>}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[14px] font-semibold">Format</legend>
          {buildFormats.map((f) => (
            <label key={f.value} className="flex cursor-pointer gap-2.5 rounded-[10px] border border-line p-3 has-[:checked]:border-green-700 has-[:checked]:bg-green-soft">
              <input type="radio" name="build-format" value={f.value} checked={format === f.value} onChange={() => setFormat(f.value)} className="mt-1 accent-green-700" />
              <span>
                <span className="block font-semibold text-ink">{f.label}</span>
                <span className="block text-meta font-normal text-ink-muted">{f.help}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[14px] font-semibold">Factions in seed order</legend>
          <p className="text-meta font-normal text-ink-muted">Seed 1 is the strongest. {format === 'bracket' ? 'Seeds 1 and 2 can only meet in the final.' : 'Seed order breaks a tie the other rules can’t.'}</p>
          <ol className="flex flex-col gap-1.5">
            {seeds.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-[8px] border border-line px-3 py-1.5">
                <span className="w-6 text-meta font-semibold text-ink-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{name(id)}</span>
                <button type="button" className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${name(id)} up`}>
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button type="button" className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper disabled:opacity-30" disabled={i === seeds.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${name(id)} down`}>
                  <ArrowDown className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {factions.map((f) => (
              <Checkbox key={f.id} label={f.name} checked={seeds.includes(f.id)} onChange={(e) => toggle(f.id, e.target.checked)} />
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First game" required>
            {({ id }) => <Input id={id} type="datetime-local" value={firstAt} onChange={(e) => setFirstAt(e.target.value)} />}
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
          <Field label="Hours between rounds" hint="24 = one round a day">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="number" min={0} value={roundGap} onChange={(e) => setRoundGap(e.target.value)} />}
          </Field>
          <Field label="Minutes between games" hint="Within a round">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="number" min={0} value={gameGap} onChange={(e) => setGameGap(e.target.value)} />}
          </Field>
        </div>
        {format !== 'round_robin' && <Checkbox label="Play a bronze game for 3rd place" checked={bronze} onChange={(e) => setBronze(e.target.checked)} />}

        {tooLate && (
          <Alert tone="error">
            The last round would be on {formatShortDate(lastDay)}, after the games end ({formatShortDate(edition.ends_on)}). Start earlier or use fewer hours between rounds.
          </Alert>
        )}
        <p className="rounded-[10px] bg-paper px-4 py-3 text-body-m text-ink">
          {seeds.length < 2
            ? 'Pick at least 2 factions.'
            : `Creates ${size.games} game${size.games === 1 ? '' : 's'} over ${size.rounds} round${size.rounds === 1 ? '' : 's'}. You only enter scores; teams move on by themselves. Times can still be changed game by game.`}
        </p>
      </div>
    </Modal>
  );
}
