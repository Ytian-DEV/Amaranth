import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import type { SkVenueRow } from '@/lib/database.types';
import { Card } from '../../ui';
import { skErrorText, useDeleteSkRow, useSaveSkRow, useSkRows } from '../skApi';
import { numOrNull, useNameSlug, validSlug } from './form';
import { RowActions, SetupNote, SlugInput } from './shared';

function VenueModal({ editionId, venue, nextOrder, onClose }: { editionId: string; venue: SkVenueRow | null; nextOrder: number; onClose: () => void }) {
  const save = useSaveSkRow('sk_venues');
  const ns = useNameSlug(venue?.name, venue?.slug);
  const [description, setDescription] = useState(venue?.description ?? '');
  const [pin, setPin] = useState(venue?.map_number?.toString() ?? '');
  const [x, setX] = useState(venue?.map_x?.toString() ?? '');
  const [y, setY] = useState(venue?.map_y?.toString() ?? '');
  const [order, setOrder] = useState(venue?.sort_order ?? nextOrder);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!ns.name.trim()) return setError('Name is required.');
    if (!validSlug(ns.slug)) return setError('The web name may only use lowercase letters, numbers and single dashes.');
    const mx = numOrNull(x);
    const my = numOrNull(y);
    if ([mx, my].some((v) => v !== null && (Number.isNaN(v) || v < 0 || v > 100))) return setError('Map position is a percentage from 0 to 100.');
    try {
      await save.mutateAsync({ id: venue?.id, edition_id: editionId, name: ns.name.trim(), slug: ns.slug, description: description.trim() || null, map_number: numOrNull(pin), map_x: mx, map_y: my, sort_order: order });
      onClose();
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={venue ? `Edit ${venue.name}` : 'Add venue'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} onClick={() => void submit()}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Name" required>{({ id }) => <Input id={id} value={ns.name} onChange={(e) => ns.setName(e.target.value)} placeholder="e.g. VSU Main Gymnasium" />}</Field>
        <SlugInput value={ns.slug} onChange={ns.setSlug} />
        <Field label="Description" hint="What happens here, how to get there">
          {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[14px] font-semibold">On the venue map</legend>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Pin number">{({ id }) => <Input id={id} type="number" min={1} value={pin} onChange={(e) => setPin(e.target.value)} />}</Field>
            <Field label="From left %">{({ id }) => <Input id={id} type="number" min={0} max={100} step="0.1" value={x} onChange={(e) => setX(e.target.value)} />}</Field>
            <Field label="From top %">{({ id }) => <Input id={id} type="number" min={0} max={100} step="0.1" value={y} onChange={(e) => setY(e.target.value)} />}</Field>
          </div>
          <SetupNote>Where the numbered pin sits on the edition’s venue map image. Leave empty to list the venue without a pin.</SetupNote>
        </fieldset>
        <Field label="Order">{({ id }) => <Input id={id} type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />}</Field>
      </div>
    </Modal>
  );
}

export function VenuesTab({ editionId }: { editionId: string }) {
  const rows = useSkRows('sk_venues', editionId);
  const del = useDeleteSkRow('sk_venues');
  const [modal, setModal] = useState<SkVenueRow | 'new' | null>(null);

  if (rows.error) return <ErrorState error={rows.error} onRetry={() => void rows.refetch()} />;
  if (!rows.data) return <Skeleton className="h-64" />;

  return (
    <div className="flex flex-col gap-4">
      {del.error && <Alert tone="error">{skErrorText(del.error)}</Alert>}
      {rows.data.length === 0 ? (
        <EmptyState title="No venues yet">Add the courts, fields and halls used this year.</EmptyState>
      ) : (
        <Card as="div">
          <ul>
            {rows.data.map((v) => (
              <li key={v.id} className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-green-soft text-[14px] font-semibold text-green-700" aria-label={v.map_number ? `Pin ${v.map_number}` : 'No map pin'}>
                  {v.map_number ?? '–'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{v.name}</p>
                  {v.description && <p className="truncate text-meta font-normal text-ink-muted">{v.description}</p>}
                </div>
                <RowActions label={v.name} onEdit={() => setModal(v)} onDelete={() => window.confirm(`Delete ${v.name}? Games and events there will have no venue.`) && del.mutate(v.id)} />
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Button icon={<Plus className="size-4" aria-hidden />} className="self-start" onClick={() => setModal('new')}>
        Add venue
      </Button>
      {modal && <VenueModal editionId={editionId} venue={modal === 'new' ? null : modal} nextOrder={rows.data.length} onClose={() => setModal(null)} />}
    </div>
  );
}
