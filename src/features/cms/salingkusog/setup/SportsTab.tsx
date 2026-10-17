import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import type { SkCategory, SkDivision, SkEventRow, SkFormat, SkSportRow, SkVenueRow } from '@/lib/database.types';
import { Card, CardHeader } from '../../ui';
import { categories, categoryLabels, divisionLabels, divisions, formatLabels, formats } from '@/lib/skLabels';
import { skErrorText, useDeleteSkRow, useSaveSkRow, useSkRows } from '../skApi';
import { useNameSlug, validSlug } from './form';
import { RowActions, SlugInput } from './shared';

function SportModal({ editionId, sport, nextOrder, onClose }: { editionId: string; sport: SkSportRow | null; nextOrder: number; onClose: () => void }) {
  const save = useSaveSkRow('sk_sports');
  const ns = useNameSlug(sport?.name, sport?.slug);
  const [category, setCategory] = useState<SkCategory>(sport?.category ?? 'ball_games');
  const [order, setOrder] = useState(sport?.sort_order ?? nextOrder);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!ns.name.trim()) return setError('Name is required.');
    if (!validSlug(ns.slug)) return setError('The web name may only use lowercase letters, numbers and single dashes.');
    try {
      await save.mutateAsync({ id: sport?.id, edition_id: editionId, name: ns.name.trim(), slug: ns.slug, category, sort_order: order });
      onClose();
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={sport ? `Edit ${sport.name}` : 'Add sport'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => void submit()}>Save</Button></>}>
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Name" required>{({ id }) => <Input id={id} value={ns.name} onChange={(e) => ns.setName(e.target.value)} placeholder="e.g. Basketball" />}</Field>
        <SlugInput value={ns.slug} onChange={ns.setSlug} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            {({ id }) => (
              <Select id={id} value={category} onChange={(e) => setCategory(e.target.value as SkCategory)}>
                {categories.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Order">{({ id }) => <Input id={id} type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />}</Field>
        </div>
      </div>
    </Modal>
  );
}

function EventModal({ sport, event, venues, nextOrder, onClose }: { sport: SkSportRow; event: SkEventRow | null; venues: SkVenueRow[]; nextOrder: number; onClose: () => void }) {
  const save = useSaveSkRow('sk_events');
  const ns = useNameSlug(event?.name, event?.slug, sport.slug);
  const [division, setDivision] = useState<SkDivision>(event?.division ?? 'men');
  // sensible starting points per category; staff can change both
  const defaultFormat: SkFormat = ['athletics', 'aquatics'].includes(sport.category) ? 'timed' : sport.category === 'pageant' || sport.category === 'dance_cheer' ? 'judged' : 'bracket';
  const [format, setFormat] = useState<SkFormat>(event?.format ?? defaultFormat);
  const [isTeam, setIsTeam] = useState(event?.is_team ?? !['athletics', 'aquatics', 'combat_sports', 'pageant'].includes(sport.category));
  const [unit, setUnit] = useState(event?.result_unit ?? '');
  const [venueId, setVenueId] = useState(event?.venue_id ?? '');
  const [order, setOrder] = useState(event?.sort_order ?? nextOrder);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!ns.name.trim()) return setError('Name is required.');
    if (!validSlug(ns.slug)) return setError('The web name may only use lowercase letters, numbers and single dashes.');
    try {
      await save.mutateAsync({
        id: event?.id,
        sport_id: sport.id,
        name: ns.name.trim(),
        slug: ns.slug,
        division,
        format,
        is_team: isTeam,
        result_unit: unit.trim() || null,
        venue_id: venueId || null,
        sort_order: order,
      });
      onClose();
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={event ? `Edit ${sport.name} · ${event.name}` : `Add ${sport.name} event`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => void submit()}>Save</Button></>}>
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Event name" required hint="Shown after the sport, e.g. “Men” or “100m Dash · Women”">
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={ns.name} onChange={(e) => ns.setName(e.target.value)} />}
        </Field>
        <SlugInput value={ns.slug} onChange={ns.setSlug} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Division">
            {({ id }) => (
              <Select id={id} value={division} onChange={(e) => setDivision(e.target.value as SkDivision)}>
                {divisions.map((d) => <option key={d} value={d}>{divisionLabels[d]}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Format">
            {({ id }) => (
              <Select id={id} value={format} onChange={(e) => setFormat(e.target.value as SkFormat)}>
                {formats.map((f) => <option key={f} value={f}>{formatLabels[f]}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Main venue">
            {({ id }) => (
              <Select id={id} value={venueId} onChange={(e) => setVenueId(e.target.value)}>
                <option value="">— none —</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Result unit" hint="For timed or measured events: s, m, pts">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} maxLength={8} value={unit} onChange={(e) => setUnit(e.target.value)} />}
          </Field>
          <Field label="Order">{({ id }) => <Input id={id} type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />}</Field>
        </div>
        <Checkbox label="Team event (medals go to the faction, not to one athlete)" checked={isTeam} onChange={(e) => setIsTeam(e.target.checked)} />
      </div>
    </Modal>
  );
}

type Modal_ = { kind: 'sport'; sport: SkSportRow | null } | { kind: 'event'; sport: SkSportRow; event: SkEventRow | null } | null;

export function SportsView({
  sports,
  events,
  venues,
  onAddSport,
  onEditSport,
  onDeleteSport,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: {
  sports: SkSportRow[];
  events: SkEventRow[];
  venues: SkVenueRow[];
  onAddSport: () => void;
  onEditSport: (s: SkSportRow) => void;
  onDeleteSport: (s: SkSportRow) => void;
  onAddEvent: (s: SkSportRow) => void;
  onEditEvent: (s: SkSportRow, e: SkEventRow) => void;
  onDeleteEvent: (s: SkSportRow, e: SkEventRow) => void;
}) {
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name;
  return (
    <div className="flex flex-col gap-4">
      {sports.length === 0 && <EmptyState title="No sports yet">Add each sport, then its events (for example Basketball → Men, Women).</EmptyState>}
      {sports.map((s) => {
        const list = events.filter((e) => e.sport_id === s.id);
        return (
          <Card key={s.id} aria-labelledby={`sport-${s.id}`}>
            <CardHeader
              id={`sport-${s.id}`}
              title={
                <>
                  {s.name} <span className="ml-1 align-middle font-sans text-meta font-normal text-ink-muted">{categoryLabels[s.category]}</span>
                </>
              }
              action={<RowActions label={s.name} onEdit={() => onEditSport(s)} onDelete={() => onDeleteSport(s)} />}
            />
            {list.length === 0 ? (
              <p className="px-5 text-meta font-normal text-ink-muted">No events yet.</p>
            ) : (
              <ul className="px-5">
                {list.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{e.name}</p>
                      <p className="truncate text-meta font-normal text-ink-muted">
                        {divisionLabels[e.division]} · {formatLabels[e.format]} · {e.is_team ? 'Team' : 'Individual'}
                        {venueName(e.venue_id) && ` · ${venueName(e.venue_id)}`}
                      </p>
                    </div>
                    <RowActions label={`${s.name} ${e.name}`} onEdit={() => onEditEvent(s, e)} onDelete={() => onDeleteEvent(s, e)} />
                  </li>
                ))}
              </ul>
            )}
            <div className="px-5 pb-4 pt-2">
              <Button size="sm" variant="ghost" icon={<Plus className="size-4" aria-hidden />} onClick={() => onAddEvent(s)}>
                Add event <span className="sr-only">to {s.name}</span>
              </Button>
            </div>
          </Card>
        );
      })}
      <Button icon={<Plus className="size-4" aria-hidden />} className="self-start" onClick={onAddSport}>
        Add sport
      </Button>
    </div>
  );
}

export function SportsTab({ editionId }: { editionId: string }) {
  const sports = useSkRows('sk_sports', editionId);
  const events = useSkRows('sk_events', editionId);
  const venues = useSkRows('sk_venues', editionId);
  const delSport = useDeleteSkRow('sk_sports');
  const delEvent = useDeleteSkRow('sk_events');
  const [modal, setModal] = useState<Modal_>(null);

  const error = sports.error ?? events.error ?? venues.error;
  if (error) return <ErrorState error={error} onRetry={() => void Promise.all([sports.refetch(), events.refetch(), venues.refetch()])} />;
  if (!sports.data || !events.data || !venues.data) return <Skeleton className="h-64" />;
  const evs = events.data;

  return (
    <>
      {(delSport.error ?? delEvent.error) && <Alert tone="error">{skErrorText(delSport.error ?? delEvent.error)}</Alert>}
      <SportsView
        sports={sports.data}
        events={evs}
        venues={venues.data}
        onAddSport={() => setModal({ kind: 'sport', sport: null })}
        onEditSport={(s) => setModal({ kind: 'sport', sport: s })}
        onDeleteSport={(s) => window.confirm(`Delete ${s.name}? All its events, games, results and medals are deleted too.`) && delSport.mutate(s.id)}
        onAddEvent={(s) => setModal({ kind: 'event', sport: s, event: null })}
        onEditEvent={(s, e) => setModal({ kind: 'event', sport: s, event: e })}
        onDeleteEvent={(s, e) => window.confirm(`Delete ${s.name} · ${e.name}? Its games, results and medals are deleted too.`) && delEvent.mutate(e.id)}
      />
      {modal?.kind === 'sport' && <SportModal editionId={editionId} sport={modal.sport} nextOrder={sports.data.length} onClose={() => setModal(null)} />}
      {modal?.kind === 'event' && (
        <EventModal sport={modal.sport} event={modal.event} venues={venues.data} nextOrder={evs.filter((e) => e.sport_id === modal.sport.id).length} onClose={() => setModal(null)} />
      )}
    </>
  );
}
