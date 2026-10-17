import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input } from '@/components/ui/Field';
import { Alert, EmptyState } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/StatusPill';
import type { MediaAssetRow, SkEditionRow } from '@/lib/database.types';
import { formatDate } from '@/lib/format';
import { Card, CardHeader } from '../../ui';
import { skErrorText, useMediaByIds, useSaveSkRow } from '../skApi';
import { ImagePick, SetupNote } from './shared';

function EditionModal({ edition, map, onClose, onSaved }: { edition: SkEditionRow | null; map: MediaAssetRow | null; onClose: () => void; onSaved: (id: string) => void }) {
  const save = useSaveSkRow('sk_editions');
  const year = new Date().getFullYear();
  const [f, setF] = useState({
    year: edition?.year ?? year,
    title: edition?.title ?? `Salingkusog ${year}`,
    subtitle: edition?.subtitle ?? 'VSU Intramural Games',
    starts_on: edition?.starts_on ?? '',
    ends_on: edition?.ends_on ?? '',
    points_gold: edition?.points_gold ?? 5,
    points_silver: edition?.points_silver ?? 3,
    points_bronze: edition?.points_bronze ?? 1,
    is_current: edition?.is_current ?? true,
    is_published: edition?.is_published ?? false,
  });
  const [mapAsset, setMapAsset] = useState<MediaAssetRow | null>(map);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  async function submit() {
    if (!f.title.trim() || !f.starts_on || !f.ends_on) return setError('Title, first day and last day are required.');
    if (f.ends_on < f.starts_on) return setError('The last day can’t be before the first day.');
    try {
      const row = await save.mutateAsync({ id: edition?.id, ...f, title: f.title.trim(), subtitle: f.subtitle.trim() || null, map_asset_id: mapAsset?.id ?? null });
      onSaved(row.id);
      onClose();
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={edition ? `Edit ${edition.title}` : 'New edition'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} onClick={() => void submit()}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
          <Field label="Year" required>{({ id }) => <Input id={id} type="number" min={2000} max={2100} value={f.year} onChange={(e) => set('year', Number(e.target.value))} />}</Field>
          <Field label="Title" required>{({ id }) => <Input id={id} value={f.title} onChange={(e) => set('title', e.target.value)} />}</Field>
        </div>
        <Field label="Subtitle">{({ id }) => <Input id={id} value={f.subtitle} onChange={(e) => set('subtitle', e.target.value)} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First day" required>{({ id }) => <Input id={id} type="date" value={f.starts_on} onChange={(e) => set('starts_on', e.target.value)} />}</Field>
          <Field label="Last day" required>{({ id }) => <Input id={id} type="date" value={f.ends_on} onChange={(e) => set('ends_on', e.target.value)} />}</Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[14px] font-semibold">Medal points</legend>
          <div className="grid grid-cols-3 gap-3">
            {(['gold', 'silver', 'bronze'] as const).map((m) => (
              <Field key={m} label={m[0].toUpperCase() + m.slice(1)}>
                {({ id }) => <Input id={id} type="number" min={0} value={f[`points_${m}`]} onChange={(e) => set(`points_${m}`, Number(e.target.value))} />}
              </Field>
            ))}
          </div>
          <SetupNote>The medal table and points race are worked out from results with these values.</SetupNote>
        </fieldset>
        <ImagePick label="Venue map" asset={mapAsset} onChange={setMapAsset} />
        <Checkbox label="Current edition (the one the site shows)" checked={f.is_current} onChange={(e) => set('is_current', e.target.checked)} />
        <Checkbox label="Published — readers can see it" checked={f.is_published} onChange={(e) => set('is_published', e.target.checked)} />
      </div>
    </Modal>
  );
}

export function EditionTab({ edition, onSelect }: { edition: SkEditionRow | null; onSelect: (id: string) => void }) {
  const [modal, setModal] = useState<'edit' | 'new' | null>(null);
  const media = useMediaByIds([edition?.map_asset_id]);
  const map = media.data?.find((m) => m.id === edition?.map_asset_id) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {edition ? (
        <Card aria-labelledby="sk-edition">
          <CardHeader
            id="sk-edition"
            title={edition.title}
            action={
              <Button size="sm" variant="outline" onClick={() => setModal('edit')}>
                Edit<span className="sr-only"> {edition.title}</span>
              </Button>
            }
          />
          <dl className="grid gap-x-6 gap-y-4 px-5 pb-5 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-kicker uppercase text-ink-muted">Dates</dt>
              <dd className="mt-1 text-body-m">{formatDate(edition.starts_on)} – {formatDate(edition.ends_on)}</dd>
            </div>
            <div>
              <dt className="text-kicker uppercase text-ink-muted">Medal points</dt>
              <dd className="mt-1 text-body-m">Gold {edition.points_gold} · Silver {edition.points_silver} · Bronze {edition.points_bronze}</dd>
            </div>
            <div>
              <dt className="text-kicker uppercase text-ink-muted">Status</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                <Pill tone={edition.is_published ? 'green' : 'review'}>{edition.is_published ? 'Published' : 'Hidden from readers'}</Pill>
                {edition.is_current && <Pill tone="neutral">Current</Pill>}
              </dd>
            </div>
            <div>
              <dt className="text-kicker uppercase text-ink-muted">Venue map</dt>
              <dd className="mt-1">
                {map ? <Img bucket={map.bucket} path={map.path} variants={map.variants} width={map.width} alt="Venue map" ratio="4/3" sizes="160px" className="w-40" /> : <span className="text-body-m text-ink-muted">Not set</span>}
              </dd>
            </div>
          </dl>
          {edition.subtitle && <p className="border-t border-line px-5 py-3 text-meta text-ink-muted">{edition.subtitle}</p>}
        </Card>
      ) : (
        <EmptyState title="No Salingkusog edition yet">Create one for this year’s intramurals to start adding factions, sports and the schedule.</EmptyState>
      )}
      <Button variant={edition ? 'outline' : 'primary'} icon={<Plus className="size-4" aria-hidden />} className="self-start" onClick={() => setModal('new')}>
        New edition
      </Button>
      {modal && <EditionModal edition={modal === 'edit' ? edition : null} map={modal === 'edit' ? map : null} onClose={() => setModal(null)} onSaved={onSelect} />}
    </div>
  );
}
