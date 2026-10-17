import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { Modal } from '@/components/ui/Modal';
import type { MediaAssetRow, SkFactionRow } from '@/lib/database.types';
import { Card } from '../../ui';
import { skErrorText, useDeleteSkRow, useMediaByIds, useSaveSkRow, useSkRows } from '../skApi';
import { useNameSlug, validSlug } from './form';
import { ImagePick, RowActions, SlugInput } from './shared';

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Brand green as the starting colour (read from the token, so no hex lives in the code). */
function defaultColour() {
  const v = typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-green-700').trim() : '';
  return HEX.test(v) ? v : '';
}

function FactionModal({ editionId, faction, logo, nextOrder, onClose }: { editionId: string; faction: SkFactionRow | null; logo: MediaAssetRow | null; nextOrder: number; onClose: () => void }) {
  const save = useSaveSkRow('sk_factions');
  const ns = useNameSlug(faction?.name, faction?.slug);
  const [shortName, setShortName] = useState(faction?.short_name ?? '');
  const [motto, setMotto] = useState(faction?.motto ?? '');
  const [color, setColor] = useState(faction?.color ?? defaultColour());
  const [order, setOrder] = useState(faction?.sort_order ?? nextOrder);
  const [logoAsset, setLogoAsset] = useState(logo);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!ns.name.trim()) return setError('Name is required.');
    if (!validSlug(ns.slug)) return setError('The web name may only use lowercase letters, numbers and single dashes.');
    if (!HEX.test(color)) return setError('Colour must be # followed by six hex digits (RRGGBB).');
    try {
      await save.mutateAsync({
        id: faction?.id,
        edition_id: editionId,
        name: ns.name.trim(),
        slug: ns.slug,
        short_name: shortName.trim() || null,
        motto: motto.trim() || null,
        color,
        logo_asset_id: logoAsset?.id ?? null,
        sort_order: order,
      });
      onClose();
    } catch (err) {
      setError(skErrorText(err));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={faction ? `Edit ${faction.name}` : 'Add faction'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} onClick={() => void submit()}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>{({ id }) => <Input id={id} value={ns.name} onChange={(e) => ns.setName(e.target.value)} placeholder="e.g. Primordial Tiamat" />}</Field>
          <Field label="Short name" hint="2–4 letters for score tables">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} maxLength={6} value={shortName} onChange={(e) => setShortName(e.target.value.toUpperCase())} placeholder="PT" />}
          </Field>
        </div>
        <SlugInput value={ns.slug} onChange={ns.setSlug} />
        <Field label="Motto">{({ id }) => <Textarea id={id} rows={2} value={motto} onChange={(e) => setMotto(e.target.value)} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Colour" required hint="Used for bars, dots and the faction page">
            {({ id, describedBy }) => (
              <div className="flex items-center gap-2">
                <input type="color" aria-label="Pick colour" value={HEX.test(color) ? color : defaultColour()} onChange={(e) => setColor(e.target.value)} className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-1" />
                <Input id={id} aria-describedby={describedBy} value={color} onChange={(e) => setColor(e.target.value.trim())} placeholder="#RRGGBB" />
              </div>
            )}
          </Field>
          <Field label="Order">{({ id }) => <Input id={id} type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />}</Field>
        </div>
        <ImagePick label="Logo" asset={logoAsset} onChange={setLogoAsset} round />
      </div>
    </Modal>
  );
}

export function FactionsView({
  factions,
  logos,
  onAdd,
  onEdit,
  onDelete,
}: {
  factions: SkFactionRow[];
  logos: MediaAssetRow[];
  onAdd: () => void;
  onEdit: (f: SkFactionRow) => void;
  onDelete: (f: SkFactionRow) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {factions.length === 0 ? (
        <EmptyState title="No factions yet">Add the teams competing this year, with their colours and logos.</EmptyState>
      ) : (
        <Card as="div">
          <ul>
            {factions.map((f) => {
              const logo = logos.find((l) => l.id === f.logo_asset_id);
              return (
                <li key={f.id} className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-0">
                  {logo ? (
                    <Img bucket={logo.bucket} path={logo.path} variants={logo.variants} width={logo.width} alt="" ratio="1/1" sizes="44px" rounded={false} className="size-11 shrink-0 rounded-full" />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-on-dark" style={{ backgroundColor: f.color }} aria-hidden>
                      {f.short_name ?? f.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {f.name}
                      {f.short_name && <span className="ml-2 text-meta font-normal text-ink-muted">{f.short_name}</span>}
                    </p>
                    <p className="flex items-center gap-2 truncate text-meta font-normal text-ink-muted">
                      <span className="inline-block size-3 shrink-0 rounded-full border border-line" style={{ backgroundColor: f.color }} aria-hidden />
                      {f.color.toUpperCase()}
                      {f.motto && ` · ${f.motto}`}
                    </p>
                  </div>
                  <RowActions label={f.name} onEdit={() => onEdit(f)} onDelete={() => onDelete(f)} />
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <Button icon={<Plus className="size-4" aria-hidden />} className="self-start" onClick={onAdd}>
        Add faction
      </Button>
    </div>
  );
}

export function FactionsTab({ editionId }: { editionId: string }) {
  const rows = useSkRows('sk_factions', editionId);
  const logos = useMediaByIds((rows.data ?? []).map((f) => f.logo_asset_id));
  const del = useDeleteSkRow('sk_factions');
  const [modal, setModal] = useState<SkFactionRow | 'new' | null>(null);

  if (rows.error) return <ErrorState error={rows.error} onRetry={() => void rows.refetch()} />;
  if (!rows.data) return <Skeleton className="h-64" />;
  const editing = modal && modal !== 'new' ? modal : null;

  return (
    <>
      {del.error && <Alert tone="error">{skErrorText(del.error)}</Alert>}
      <FactionsView
        factions={rows.data}
        logos={logos.data ?? []}
        onAdd={() => setModal('new')}
        onEdit={setModal}
        onDelete={(f) => window.confirm(`Delete ${f.name}? Its athletes, medals and awards are deleted too, and its games lose this side.`) && del.mutate(f.id)}
      />
      {modal && (
        <FactionModal
          editionId={editionId}
          faction={editing}
          logo={(logos.data ?? []).find((l) => l.id === editing?.logo_asset_id) ?? null}
          nextOrder={rows.data.length}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
