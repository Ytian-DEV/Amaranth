import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/StatusPill';
import type { MediaAssetRow, TeamRoleGroup, TeamTermRow } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { MediaPickerDialog } from '../media/MediaLibraryPage';
import { Card, CardHeader } from '../ui';
import { groupLabels, groups } from './labels';
import { useContributors, useDeleteMember, useMembers, useSaveMember, useSaveTerm, useTerms, type BoardMember, type MemberInput } from './peopleApi';


function TermModal({ term, onClose }: { term: TeamTermRow | null; onClose: () => void }) {
  const save = useSaveTerm();
  const [label, setLabel] = useState(term?.label ?? '');
  const [starts, setStarts] = useState(term?.starts_on ?? '');
  const [ends, setEnds] = useState(term?.ends_on ?? '');
  const [current, setCurrent] = useState(term?.is_current ?? true);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (!label.trim() || !starts) return setError('Label and start date are required.');
    try {
      await save.mutateAsync({ id: term?.id, label, starts_on: starts, ends_on: ends || null, is_current: current });
      onClose();
    } catch (err) {
      setError(errorText(err) ?? 'Couldn’t save.');
    }
  }
  return (
    <Modal open onClose={onClose} title={term ? 'Edit term' : 'New term'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => void submit()}>Save</Button></>}>
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Label" required hint="e.g. 2026–2027">
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={label} onChange={(e) => setLabel(e.target.value)} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts" required>{({ id }) => <Input id={id} type="date" value={starts} onChange={(e) => setStarts(e.target.value)} />}</Field>
          <Field label="Ends">{({ id }) => <Input id={id} type="date" value={ends} onChange={(e) => setEnds(e.target.value)} />}</Field>
        </div>
        <Checkbox label="This is the current board (shown on the site)" checked={current} onChange={(e) => setCurrent(e.target.checked)} />
      </div>
    </Modal>
  );
}

function MemberModal({ termId, member, nextOrder, onClose }: { termId: string; member: BoardMember | null; nextOrder: number; onClose: () => void }) {
  const save = useSaveMember();
  const contributors = useContributors();
  const [form, setForm] = useState<MemberInput>({
    id: member?.id,
    term_id: termId,
    role_group: member?.role_group ?? 'section_head',
    position_title: member?.position_title ?? '',
    contributor_id: member?.contributor_id ?? null,
    display_name: member?.display_name ?? '',
    photo_asset_id: member?.photo_asset_id ?? null,
    sort_order: member?.sort_order ?? nextOrder,
  });
  const [photo, setPhoto] = useState<MediaAssetRow | null>(member?.photo ?? null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!form.position_title.trim()) return setError('Position is required.');
    if (!form.contributor_id && !form.display_name.trim()) return setError('Choose a contributor or type a name.');
    try {
      await save.mutateAsync(form);
      onClose();
    } catch (err) {
      setError(errorText(err) ?? 'Couldn’t save.');
    }
  }

  return (
    <Modal open onClose={onClose} title={member ? 'Edit member' : 'Add member'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => void submit()}>Save</Button></>}>
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Group">
            {({ id }) => (
              <Select id={id} value={form.role_group} onChange={(e) => setForm((f) => ({ ...f, role_group: e.target.value as TeamRoleGroup }))}>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {groupLabels[g]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Position" required>
            {({ id }) => <Input id={id} value={form.position_title} onChange={(e) => setForm((f) => ({ ...f, position_title: e.target.value }))} placeholder="e.g. News Editor" />}
          </Field>
          <Field label="Contributor">
            {({ id }) => (
              <Select id={id} value={form.contributor_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, contributor_id: e.target.value || null }))}>
                <option value="">— none —</option>
                {(contributors.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Display name" hint="Used when no contributor is chosen">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />}
          </Field>
          <Field label="Order">
            {({ id }) => <Input id={id} type="number" min={0} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />}
          </Field>
        </div>
        <div className="flex items-center gap-3">
          {photo && <Img bucket={photo.bucket} path={photo.path} variants={photo.variants} width={photo.width} alt="" ratio="1/1" sizes="64px" rounded={false} className="size-16 rounded-full" />}
          <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
            {photo ? 'Change photo' : 'Add photo'}
          </Button>
        </div>
      </div>
      <MediaPickerDialog open={picking} onClose={() => setPicking(false)} onPick={(a) => { setPhoto(a); setForm((f) => ({ ...f, photo_asset_id: a.id })); }} />
    </Modal>
  );
}

export function BoardTab() {
  const terms = useTerms();
  const [termId, setTermId] = useState<string | undefined>();
  const members = useMembers(termId);
  const del = useDeleteMember(termId);
  const [termModal, setTermModal] = useState<TeamTermRow | 'new' | null>(null);
  const [memberModal, setMemberModal] = useState<BoardMember | 'new' | null>(null);

  useEffect(() => {
    if (!termId && terms.data?.length) setTermId((terms.data.find((t) => t.is_current) ?? terms.data[0]).id);
  }, [terms.data, termId]);

  if (terms.error) return <ErrorState error={terms.error} onRetry={() => void terms.refetch()} />;
  if (!terms.data) return <Skeleton className="h-64" />;
  const term = terms.data.find((t) => t.id === termId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[14px] font-semibold">
          Term
          <Select value={termId ?? ''} onChange={(e) => setTermId(e.target.value)} className="w-56">
            {terms.data.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
                {t.is_current ? ' (current)' : ''}
              </option>
            ))}
          </Select>
        </label>
        {term && (
          <Button variant="outline" onClick={() => setTermModal(term)}>
            Edit term
          </Button>
        )}
        <Button variant="ghost" icon={<Plus className="size-4" aria-hidden />} onClick={() => setTermModal('new')}>
          New term
        </Button>
        {term && (
          <Button className="ml-auto" icon={<Plus className="size-4" aria-hidden />} onClick={() => setMemberModal('new')}>
            Add member
          </Button>
        )}
      </div>

      {!term ? (
        <EmptyState title="No terms yet" action={<Button onClick={() => setTermModal('new')}>Create the first term</Button>}>
          A term groups the advisers, editorial board and section heads for one school year.
        </EmptyState>
      ) : members.error ? (
        <ErrorState error={members.error} onRetry={() => void members.refetch()} />
      ) : !members.data ? (
        <Skeleton className="h-64" />
      ) : (
        groups.map((g) => {
          const list = members.data.filter((m) => m.role_group === g);
          if (!list.length) return null;
          return (
            <Card key={g}>
              <CardHeader title={groupLabels[g]} />
              <ul className="px-5 pb-2">
                {list.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                    <Img {...(m.photo ? { bucket: m.photo.bucket, path: m.photo.path, variants: m.photo.variants, width: m.photo.width } : {})} alt="" ratio="1/1" sizes="40px" rounded={false} className="size-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.contributor?.name ?? m.display_name}</p>
                      <p className="truncate text-meta font-normal text-ink-muted">{m.position_title}</p>
                    </div>
                    <Pill>#{m.sort_order}</Pill>
                    <Button size="sm" variant="outline" onClick={() => setMemberModal(m)}>
                      Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => window.confirm('Remove this member from the term?') && del.mutate(m.id)}
                      className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert"
                      aria-label={`Remove ${m.contributor?.name ?? m.display_name}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })
      )}
      {termModal && <TermModal term={termModal === 'new' ? null : termModal} onClose={() => setTermModal(null)} />}
      {memberModal && termId && (
        <MemberModal
          termId={termId}
          member={memberModal === 'new' ? null : memberModal}
          nextOrder={(members.data?.length ?? 0) + 1}
          onClose={() => setMemberModal(null)}
        />
      )}
    </div>
  );
}
