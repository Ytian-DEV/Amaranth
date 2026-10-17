import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select } from '@/components/ui/Field';
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pill } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth/AuthProvider';
import { assignableRoles, roleLabels } from '@/features/auth/permissions';
import { isEmail } from '@/features/public/intake/validate';
import type { AppRole } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { Card, CardHeader } from '../ui';
import { useDeleteInvite, useInvites, useSaveInvite, useSectionsList } from './peopleApi';

export function InvitesTab() {
  const { profile, session } = useAuth();
  const invites = useInvites();
  const sections = useSectionsList();
  const save = useSaveInvite();
  const del = useDeleteInvite();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('staff_writer');
  const [slugs, setSlugs] = useState<string[]>([]);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const roles = assignableRoles(profile?.role);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) return setMessage({ tone: 'error', text: 'Enter a valid email address.' });
    try {
      await save.mutateAsync({ email, role, section_slugs: role === 'section_editor' ? slugs : [], invited_by: session!.user.id });
      setMessage({ tone: 'success', text: `${email} is on the staff list. Now send them an invite from Supabase → Authentication → Users → Invite user.` });
      setEmail('');
      setSlugs([]);
    } catch (err) {
      setMessage({ tone: 'error', text: errorText(err) ?? 'Couldn’t save the invite.' });
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Add to staff list" />
        <form onSubmit={submit} className="flex flex-col gap-4 p-5 pt-2">
          <p className="text-meta font-normal text-ink-muted">
            Only emails on this list get newsroom access when they accept a Supabase invite. Public sign-up stays off.
          </p>
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <Field label="Email" required>
            {({ id }) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Role">
            {({ id }) => (
              <Select id={id} value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {role === 'section_editor' && (
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="mb-1 text-[14px] font-semibold">Sections</legend>
              {(sections.data ?? []).map((s) => (
                <Checkbox
                  key={s.slug}
                  label={s.name}
                  checked={slugs.includes(s.slug)}
                  onChange={(e) => setSlugs((v) => (e.target.checked ? [...v, s.slug] : v.filter((x) => x !== s.slug)))}
                />
              ))}
            </fieldset>
          )}
          <Button type="submit" loading={save.isPending} className="self-start">
            Add to staff list
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Pending and accepted" />
        {invites.error ? (
          <div className="p-5">
            <ErrorState error={invites.error} onRetry={() => void invites.refetch()} />
          </div>
        ) : !invites.data ? (
          <Skeleton className="m-5 h-32" />
        ) : invites.data.length === 0 ? (
          <p className="px-5 pb-5 text-body-m text-ink-muted">No invites yet.</p>
        ) : (
          <ul className="px-5 pb-2">
            {invites.data.map((inv) => (
              <li key={inv.email} className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{inv.email}</p>
                  <p className="text-meta font-normal text-ink-muted">
                    {roleLabels[inv.role]}
                    {inv.section_slugs.length > 0 && ` · ${inv.section_slugs.join(', ')}`} · added {formatDate(inv.created_at)}
                  </p>
                </div>
                <Pill tone={inv.accepted_at ? 'green' : 'review'}>{inv.accepted_at ? 'Joined' : 'Waiting'}</Pill>
                {!inv.accepted_at && (
                  <button
                    type="button"
                    onClick={() => window.confirm(`Remove ${inv.email} from the staff list?`) && del.mutate(inv.email)}
                    className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert"
                    aria-label={`Remove invite for ${inv.email}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
