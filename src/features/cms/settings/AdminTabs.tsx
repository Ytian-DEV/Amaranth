import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/StatusPill';
import type { CategoryRow, Json, NavPlacement, SectionRow } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { Card, CardHeader } from '../ui';
import {
  useDeleteDepartment,
  useDepartments,
  useSaveCategory,
  useSaveDepartment,
  useSaveSection,
  useSaveSetting,
  useSectionsAdmin,
  useSetting,
} from './settingsApi';

const placements: { value: NavPlacement; label: string }[] = [
  { value: 'primary', label: 'Main navigation' },
  { value: 'more', label: '“More” menu' },
  { value: 'hidden', label: 'Hidden' },
];

function SectionModal({ section, onClose }: { section: SectionRow | null; onClose: () => void }) {
  const save = useSaveSection();
  const [f, setF] = useState({
    name: section?.name ?? '',
    slug: section?.slug ?? '',
    description: section?.description ?? '',
    nav_placement: section?.nav_placement ?? ('more' as NavPlacement),
    nav_order: section?.nav_order ?? 99,
    accepts_submissions: section?.accepts_submissions ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (!f.name.trim()) return setError('Name is required.');
    try {
      await save.mutateAsync({ id: section?.id, ...f });
      onClose();
    } catch (err) {
      setError(errorText(err) ?? 'Couldn’t save.');
    }
  }
  return (
    <Modal open onClose={onClose} title={section ? `Edit ${section.name}` : 'New section'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => void submit()}>Save</Button></>}>
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>{({ id }) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
          <Field label="URL" hint={section ? 'Changing it breaks old links' : 'From the name if empty'}>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />}
          </Field>
          <Field label="Show in">
            {({ id }) => (
              <Select id={id} value={f.nav_placement} onChange={(e) => setF({ ...f, nav_placement: e.target.value as NavPlacement })}>
                {placements.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Order">{({ id }) => <Input id={id} type="number" value={f.nav_order} onChange={(e) => setF({ ...f, nav_order: Number(e.target.value) })} />}</Field>
        </div>
        <Field label="Description">{({ id }) => <Textarea id={id} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
        <Checkbox label="Accepts public submissions" checked={f.accepts_submissions} onChange={(e) => setF({ ...f, accepts_submissions: e.target.checked })} />
      </div>
    </Modal>
  );
}

function CategoryModal({ sectionId, category, onClose }: { sectionId: string; category: CategoryRow | null; onClose: () => void }) {
  const save = useSaveCategory();
  const [f, setF] = useState({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    sort_order: category?.sort_order ?? 99,
    is_active: category?.is_active ?? true,
    is_assignable: category?.is_assignable ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (!f.name.trim()) return setError('Name is required.');
    try {
      await save.mutateAsync({ id: category?.id, section_id: sectionId, ...f });
      onClose();
    } catch (err) {
      setError(errorText(err) ?? 'Couldn’t save.');
    }
  }
  return (
    <Modal open onClose={onClose} title={category ? `Edit ${category.name}` : 'New category'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => void submit()}>Save</Button></>}>
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_100px]">
          <Field label="Name" required>{({ id }) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
          <Field label="URL">{({ id }) => <Input id={id} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />}</Field>
          <Field label="Order">{({ id }) => <Input id={id} type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} />}</Field>
        </div>
        <Checkbox label="Active" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} />
        <Checkbox label="Writers may file here (off = editors only, e.g. Editorial)" checked={f.is_assignable} onChange={(e) => setF({ ...f, is_assignable: e.target.checked })} />
      </div>
    </Modal>
  );
}

export function SectionsTab() {
  const data = useSectionsAdmin();
  const [section, setSection] = useState<SectionRow | 'new' | null>(null);
  const [category, setCategory] = useState<{ sectionId: string; row: CategoryRow | null } | null>(null);
  if (data.error) return <ErrorState error={data.error} onRetry={() => void data.refetch()} />;
  if (!data.data) return <Skeleton className="h-64" />;
  return (
    <div className="flex flex-col gap-4">
      <Button className="self-end" icon={<Plus className="size-4" aria-hidden />} onClick={() => setSection('new')}>
        New section
      </Button>
      {data.data.map((s) => (
        <Card key={s.id}>
          <div className="flex flex-wrap items-center gap-3 px-5 pt-4">
            <h2 className="font-serif text-headline-m">{s.name}</h2>
            <Pill tone={s.nav_placement === 'hidden' ? 'neutral' : 'green'}>{placements.find((p) => p.value === s.nav_placement)?.label}</Pill>
            <span className="text-meta text-ink-muted">/{s.slug}</span>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setSection(s)}>
              Edit<span className="sr-only"> {s.name}</span>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2 px-5 py-4">
            {s.categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setCategory({ sectionId: s.id, row: c })}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-paper px-3 text-[13px] font-semibold hover:border-green-700"
                >
                  {c.name}
                  {!c.is_active && <span className="text-ink-muted">(off)</span>}
                  {!c.is_assignable && <span className="text-ink-muted">(editors)</span>}
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => setCategory({ sectionId: s.id, row: null })} className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-green-700 hover:bg-green-soft">
                <Plus className="size-3.5" aria-hidden /> Category<span className="sr-only"> in {s.name}</span>
              </button>
            </li>
          </ul>
        </Card>
      ))}
      {section && <SectionModal section={section === 'new' ? null : section} onClose={() => setSection(null)} />}
      {category && <CategoryModal sectionId={category.sectionId} category={category.row} onClose={() => setCategory(null)} />}
    </div>
  );
}

export function ContactsTab() {
  const list = useDepartments();
  const save = useSaveDepartment();
  const del = useDeleteDepartment();
  const [draft, setDraft] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  if (!list.data) return <Skeleton className="h-48" />;
  return (
    <Card>
      <CardHeader title="Desks on the contact page" />
      <ul className="px-5">
        {list.data.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-3 border-b border-line py-3">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{d.name}</span>
              <span className="block text-meta font-normal text-ink-muted">{[d.email, d.phone].filter(Boolean).join(' · ')}</span>
            </span>
            <button type="button" onClick={() => window.confirm(`Remove ${d.name}?`) && del.mutate(d.id)} className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert" aria-label={`Remove ${d.name}`}>
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.name.trim()) return setError('Name is required.');
          setError(null);
          save.mutate({ ...draft, sort_order: (list.data?.length ?? 0) + 1 }, { onSuccess: () => setDraft({ name: '', email: '', phone: '' }), onError: (err) => setError(errorText(err) ?? 'Failed.') });
        }}
        className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end"
      >
        <Field label="Desk">{({ id }) => <Input id={id} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}</Field>
        <Field label="Email">{({ id }) => <Input id={id} type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />}</Field>
        <Field label="Phone">{({ id }) => <Input id={id} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />}</Field>
        <Button type="submit" loading={save.isPending}>Add</Button>
        {error && <p role="alert" className="text-meta text-alert sm:col-span-4">{error}</p>}
      </form>
    </Card>
  );
}

type ContactInfo = { office_address: string[]; phones: string[]; emails: string[]; office_hours: string[] };
type Social = { platform: string; label: string; url: string }[];

const lines = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean);

export function GeneralTab() {
  const contact = useSetting<Json>('contact');
  const social = useSetting<Json>('social_links');
  const saveContact = useSaveSetting('contact');
  const saveSocial = useSaveSetting('social_links');
  const [c, setC] = useState({ office_address: '', phones: '', emails: '', office_hours: '' });
  const [s, setS] = useState<Social>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const v = contact.data as ContactInfo | null;
    if (v) setC({ office_address: v.office_address?.join('\n') ?? '', phones: v.phones?.join('\n') ?? '', emails: v.emails?.join('\n') ?? '', office_hours: v.office_hours?.join('\n') ?? '' });
  }, [contact.data]);
  useEffect(() => {
    if (Array.isArray(social.data)) setS(social.data as unknown as Social);
  }, [social.data]);

  async function save() {
    await saveContact.mutateAsync({ office_address: lines(c.office_address), phones: lines(c.phones), emails: lines(c.emails), office_hours: lines(c.office_hours) });
    await saveSocial.mutateAsync(s.filter((x) => x.url.trim()) as unknown as Json);
    setMsg('Saved. The site picks up changes within a few minutes.');
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader title="Contact details" />
        <div className="grid gap-4 p-5 pt-2">
          {(['office_address', 'emails', 'phones', 'office_hours'] as const).map((k) => (
            <Field key={k} label={{ office_address: 'Office address', emails: 'Emails', phones: 'Phones', office_hours: 'Office hours' }[k]} hint="One per line">
              {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} rows={k === 'office_address' ? 4 : 2} value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} />}
            </Field>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Social links" />
        <div className="flex flex-col gap-3 p-5 pt-2">
          {s.map((link, i) => (
            <Field key={link.platform} label={link.label}>
              {({ id }) => <Input id={id} type="url" value={link.url} onChange={(e) => setS(s.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />}
            </Field>
          ))}
        </div>
      </Card>
      <div className="flex flex-col gap-3 xl:col-span-2">
        {msg && <Alert tone="success">{msg}</Alert>}
        <Button className="self-start" loading={saveContact.isPending || saveSocial.isPending} onClick={() => void save().catch((e) => setMsg(errorText(e) ?? 'Failed.'))}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
