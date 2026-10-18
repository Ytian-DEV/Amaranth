import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Select } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth/AuthProvider';
import { assignableRoles, canGrantPublishing, isAdmin, publishesByRole, roleLabels } from '@/features/auth/permissions';
import type { AppRole } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { formatRelative } from '@/lib/format';
import { Card } from '../ui';
import { useSectionsList, useStaff, useUpdateStaff, type StaffMember } from './peopleApi';

function EditStaff({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const { profile } = useAuth();
  const sections = useSectionsList();
  const update = useUpdateStaff();
  const [role, setRole] = useState<AppRole>(member.role);
  const [active, setActive] = useState(member.is_active);
  const [sectionIds, setSectionIds] = useState(member.sectionIds);
  const [publish, setPublish] = useState(member.can_publish);
  const [error, setError] = useState<string | null>(null);
  const roles = assignableRoles(profile?.role);
  const self = member.id === profile?.id;
  // Super admin and Executive Editor manage accounts; the Managing editor only gives publishing access
  const admin = isAdmin(profile?.role);
  const grants = canGrantPublishing(profile?.role);
  const alwaysPublishes = publishesByRole(role);

  async function save() {
    setError(null);
    try {
      await update.mutateAsync({
        id: member.id,
        role: admin && role !== member.role ? role : undefined,
        is_active: admin && active !== member.is_active ? active : undefined,
        sectionIds: admin ? (role === 'section_editor' ? sectionIds : []) : undefined,
        canPublish: grants && publish !== member.can_publish ? publish : undefined,
      });
      onClose();
    } catch (err) {
      setError(errorText(err) ?? 'Couldn’t save.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={member.display_name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={update.isPending} onClick={() => void save()}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-body-m text-ink-muted">{member.email}</p>
        {error && <Alert tone="error">{error}</Alert>}
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
          Role
          <Select value={role} onChange={(e) => setRole(e.target.value as AppRole)} disabled={!admin || (!roles.includes(member.role) && member.role === 'super_admin')}>
            {(roles.includes(member.role) ? roles : [member.role, ...roles]).map((r) => (
              <option key={r} value={r} disabled={!roles.includes(r)}>
                {roleLabels[r]}
              </option>
            ))}
          </Select>
        </label>
        {admin && role === 'section_editor' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[14px] font-semibold">Sections they edit</legend>
            <div className="grid grid-cols-2 gap-2">
              {(sections.data ?? []).map((s) => (
                <Checkbox
                  key={s.id}
                  label={s.name}
                  checked={sectionIds.includes(s.id)}
                  onChange={(e) => setSectionIds((ids) => (e.target.checked ? [...ids, s.id] : ids.filter((x) => x !== s.id)))}
                />
              ))}
            </div>
          </fieldset>
        )}
        {grants && (
          <fieldset className="flex flex-col gap-2 rounded-md border border-line p-4">
            <legend className="px-1 text-[14px] font-semibold">Publishing</legend>
            {alwaysPublishes ? (
              <p className="text-body-m text-ink-muted">{roleLabels[role]} accounts can always publish and schedule articles.</p>
            ) : (
              <>
                <Checkbox label="Can publish and schedule articles" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
                <p className="text-meta font-normal text-ink-muted">Without this, they save drafts and submit them for review.</p>
              </>
            )}
          </fieldset>
        )}
        {admin && (
          <>
            <Checkbox label="Active — can sign in to the newsroom" checked={active} disabled={self} onChange={(e) => setActive(e.target.checked)} />
            {self && <p className="text-meta font-normal text-ink-muted">You can’t deactivate your own account.</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

export function StaffTab() {
  const staff = useStaff();
  const sections = useSectionsList();
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const sectionName = (id: string) => sections.data?.find((s) => s.id === id)?.name ?? '';

  if (staff.error) return <ErrorState error={staff.error} onRetry={() => void staff.refetch()} />;
  if (!staff.data) return <Skeleton className="h-64" />;
  if (!staff.data.length) return <EmptyState title="No staff accounts yet">Invite people from the Invites tab.</EmptyState>;

  return (
    <Card as="div">
      <ul>
        {staff.data.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 border-b border-line px-5 py-4 last:border-0 md:flex-row md:items-center md:gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{m.display_name}</p>
              <p className="truncate text-meta font-normal text-ink-muted">{m.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={m.is_active ? 'green' : 'neutral'}>{m.is_active ? roleLabels[m.role] : 'Inactive'}</Pill>
              {m.is_active && (publishesByRole(m.role) || m.can_publish) && (
                <Pill tone="neutral">{publishesByRole(m.role) ? 'Publishes' : 'Can publish'}</Pill>
              )}
              {m.role === 'section_editor' && m.sectionIds.length > 0 && (
                <span className="text-meta text-ink-muted">{m.sectionIds.map(sectionName).join(', ')}</span>
              )}
              {m.last_seen_at && <span className="text-meta font-normal text-ink-muted">seen {formatRelative(m.last_seen_at)}</span>}
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(m)}>
              Edit<span className="sr-only"> {m.display_name}</span>
            </Button>
          </li>
        ))}
      </ul>
      {editing && <EditStaff member={editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}
