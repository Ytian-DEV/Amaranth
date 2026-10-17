import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/StatusPill';
import type { ContributorType, MediaAssetRow } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { MediaPickerDialog } from '../media/MediaLibraryPage';
import { Card } from '../ui';
import { useContributors, useSaveContributor, type ContributorInput, type ContributorWithAvatar } from './peopleApi';

const types: ContributorType[] = ['staff', 'student', 'guest', 'faculty', 'alumni'];

function Avatar({ asset, name, size = 'size-10' }: { asset: MediaAssetRow | null; name: string; size?: string }) {
  return asset ? (
    <Img bucket={asset.bucket} path={asset.path} variants={asset.variants} width={asset.width} alt="" ratio="1/1" sizes="64px" rounded={false} className={`${size} shrink-0 rounded-full`} />
  ) : (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-green-soft text-[13px] font-semibold text-green-700`} aria-hidden>
      {name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
    </span>
  );
}

function EditContributor({ initial, onClose }: { initial: ContributorWithAvatar | null; onClose: () => void }) {
  const save = useSaveContributor();
  const [form, setForm] = useState<ContributorInput>({
    id: initial?.id,
    name: initial?.name ?? '',
    slug: initial?.slug,
    type: initial?.type ?? 'student',
    position: initial?.position ?? '',
    program: initial?.program ?? '',
    bio: initial?.bio ?? '',
    avatar_asset_id: initial?.avatar_asset_id ?? null,
    is_public: initial?.is_public ?? true,
    is_active: initial?.is_active ?? true,
  });
  const [avatar, setAvatar] = useState<MediaAssetRow | null>(initial?.avatar ?? null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof ContributorInput) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (form.name.trim().length < 2) return setError('Name is required.');
    setError(null);
    try {
      await save.mutateAsync(form);
      onClose();
    } catch (err) {
      const text = errorText(err) ?? '';
      setError(text.includes('duplicate') ? 'Another contributor already uses that URL name. Change the slug.' : text || 'Couldn’t save.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? `Edit ${initial.name}` : 'New contributor'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={() => void submit()}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex items-center gap-4">
          <Avatar asset={avatar} name={form.name || '?'} size="size-16" />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
              {avatar ? 'Change photo' : 'Add photo'}
            </Button>
            {avatar && (
              <Button size="sm" variant="ghost" onClick={() => { setAvatar(null); setForm((f) => ({ ...f, avatar_asset_id: null })); }}>
                Remove
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            {({ id }) => <Input id={id} value={form.name} onChange={set('name')} />}
          </Field>
          <Field label="URL name" hint="Leave empty to use the name">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={form.slug ?? ''} onChange={set('slug')} />}
          </Field>
          <Field label="Type">
            {({ id }) => (
              <Select id={id} value={form.type} onChange={set('type')}>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Position">
            {({ id }) => <Input id={id} value={form.position} onChange={set('position')} placeholder="e.g. News Editor" />}
          </Field>
        </div>
        <Field label="Program / year">
          {({ id }) => <Input id={id} value={form.program} onChange={set('program')} placeholder="e.g. BS Development Communication 3" />}
        </Field>
        <Field label="Short bio">
          {({ id }) => <Textarea id={id} rows={3} value={form.bio} onChange={set('bio')} />}
        </Field>
        <div className="flex flex-wrap gap-5">
          <Checkbox label="Show publicly" checked={form.is_public} onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))} />
          <Checkbox label="Active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
        </div>
      </div>
      <MediaPickerDialog
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(asset) => {
          setAvatar(asset);
          setForm((f) => ({ ...f, avatar_asset_id: asset.id }));
        }}
      />
    </Modal>
  );
}

export function ContributorsTab() {
  const list = useContributors();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<ContributorWithAvatar | 'new' | null>(null);
  const shown = (list.data ?? []).filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <Input type="search" aria-label="Search contributors" placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing('new')}>
          New contributor
        </Button>
      </div>
      {list.error ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : !list.data ? (
        <Skeleton className="h-64" />
      ) : (
        <Card as="div">
          <ul>
            {shown.map((c) => (
              <li key={c.id} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-0">
                <Avatar asset={c.avatar} name={c.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="truncate text-meta font-normal text-ink-muted">{[c.position, c.program].filter(Boolean).join(' · ') || c.type}</p>
                </div>
                {c.profile_id && <Pill tone="green">Staff account</Pill>}
                {!c.is_public && <Pill>Hidden</Pill>}
                {!c.is_active && <Pill>Inactive</Pill>}
                <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                  Edit<span className="sr-only"> {c.name}</span>
                </Button>
              </li>
            ))}
            {shown.length === 0 && <li className="px-5 py-6 text-body-m text-ink-muted">No contributors match.</li>}
          </ul>
        </Card>
      )}
      {editing && <EditContributor initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
