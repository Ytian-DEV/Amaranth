import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { Modal } from '@/components/ui/Modal';
import type { MediaAssetRow, SkAthleteRow, SkFactionRow } from '@/lib/database.types';
import { Card, CardHeader } from '../../ui';
import { skErrorText, useDeleteSkRow, useMediaByIds, useSaveSkRow, useSkRows } from '../skApi';
import { useNameSlug, validSlug } from './form';
import { ImagePick, RowActions, SlugInput } from './shared';

function AthleteModal({ athlete, factions, photo, onClose }: { athlete: SkAthleteRow | null; factions: SkFactionRow[]; photo: MediaAssetRow | null; onClose: () => void }) {
  const save = useSaveSkRow('sk_athletes');
  const ns = useNameSlug(athlete?.name, athlete?.slug);
  const [factionId, setFactionId] = useState(athlete?.faction_id ?? factions[0]?.id ?? '');
  const [program, setProgram] = useState(athlete?.program ?? '');
  const [photoAsset, setPhotoAsset] = useState(photo);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!ns.name.trim()) return setError('Name is required.');
    if (!factionId) return setError('Choose the faction.');
    if (!validSlug(ns.slug)) return setError('The web name may only use lowercase letters, numbers and single dashes.');
    try {
      await save.mutateAsync({ id: athlete?.id, faction_id: factionId, name: ns.name.trim(), slug: ns.slug, program: program.trim() || null, photo_asset_id: photoAsset?.id ?? null });
      onClose();
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={athlete ? `Edit ${athlete.name}` : 'Add athlete'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => void submit()}>Save</Button></>}>
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Name" required>{({ id }) => <Input id={id} value={ns.name} onChange={(e) => ns.setName(e.target.value)} />}</Field>
        <SlugInput value={ns.slug} onChange={ns.setSlug} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Faction" required>
            {({ id }) => (
              <Select id={id} value={factionId} onChange={(e) => setFactionId(e.target.value)}>
                {factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Program / year" hint="e.g. BS Agriculture 3">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={program} onChange={(e) => setProgram(e.target.value)} />}
          </Field>
        </div>
        <ImagePick label="Photo" asset={photoAsset} onChange={setPhotoAsset} round />
      </div>
    </Modal>
  );
}

export function AthletesView({ athletes, factions, photos, query, onQuery, onAdd, onEdit, onDelete }: {
  athletes: SkAthleteRow[];
  factions: SkFactionRow[];
  photos: MediaAssetRow[];
  query: string;
  onQuery: (q: string) => void;
  onAdd: () => void;
  onEdit: (a: SkAthleteRow) => void;
  onDelete: (a: SkAthleteRow) => void;
}) {
  const q = query.trim().toLowerCase();
  const shown = q ? athletes.filter((a) => `${a.name} ${a.program ?? ''}`.toLowerCase().includes(q)) : athletes;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="search" aria-label="Search athletes" placeholder="Search athletes" value={query} onChange={(e) => onQuery(e.target.value)} className="w-64" />
        <Button size="sm" icon={<Plus className="size-4" aria-hidden />} className="ml-auto" onClick={onAdd} disabled={!factions.length}>
          Add athlete
        </Button>
      </div>
      {!factions.length ? (
        <EmptyState title="Add factions first">Athletes belong to a faction.</EmptyState>
      ) : athletes.length === 0 ? (
        <EmptyState title="No athletes yet">Add the players you want on MVP cards, individual medals and player stats. Team events don’t need a full roster.</EmptyState>
      ) : (
        factions.map((f) => {
          const list = shown.filter((a) => a.faction_id === f.id);
          if (!list.length) return null;
          return (
            <Card key={f.id} aria-labelledby={`ath-${f.id}`}>
              <CardHeader id={`ath-${f.id}`} title={`${f.name} (${list.length})`} />
              <ul className="px-5 pb-2">
                {list.map((a) => {
                  const p = photos.find((x) => x.id === a.photo_asset_id);
                  return (
                    <li key={a.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                      {p ? (
                        <Img bucket={p.bucket} path={p.path} variants={p.variants} width={p.width} alt="" ratio="1/1" sizes="36px" rounded={false} className="size-9 shrink-0 rounded-full" />
                      ) : (
                        <span className="size-9 shrink-0 rounded-full bg-photo" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{a.name}</p>
                        {a.program && <p className="truncate text-meta font-normal text-ink-muted">{a.program}</p>}
                      </div>
                      <RowActions label={a.name} onEdit={() => onEdit(a)} onDelete={() => onDelete(a)} />
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

export function AthletesTab({ editionId }: { editionId: string }) {
  const athletes = useSkRows('sk_athletes', editionId);
  const factions = useSkRows('sk_factions', editionId);
  const photos = useMediaByIds((athletes.data ?? []).map((a) => a.photo_asset_id));
  const del = useDeleteSkRow('sk_athletes');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<SkAthleteRow | 'new' | null>(null);

  const error = athletes.error ?? factions.error;
  if (error) return <ErrorState error={error} onRetry={() => (void athletes.refetch(), void factions.refetch())} />;
  if (!athletes.data || !factions.data) return <Skeleton className="h-64" />;
  const editing = modal && modal !== 'new' ? modal : null;

  return (
    <>
      {del.error && <Alert tone="error">{skErrorText(del.error)}</Alert>}
      <AthletesView
        athletes={athletes.data}
        factions={factions.data}
        photos={photos.data ?? []}
        query={query}
        onQuery={setQuery}
        onAdd={() => setModal('new')}
        onEdit={setModal}
        onDelete={(a) => window.confirm(`Delete ${a.name}? Their awards and player stats are deleted too.`) && del.mutate(a.id)}
      />
      {modal && <AthleteModal athlete={editing} factions={factions.data} photo={(photos.data ?? []).find((p) => p.id === editing?.photo_asset_id) ?? null} onClose={() => setModal(null)} />}
    </>
  );
}
