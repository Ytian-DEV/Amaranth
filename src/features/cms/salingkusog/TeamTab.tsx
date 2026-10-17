import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Field';
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pill } from '@/components/ui/StatusPill';
import { roleLabels } from '@/features/auth/permissions';
import { errorText } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { Card, CardHeader } from '../ui';
import { useAddSkTeamMember, useRemoveSkTeamMember, useSkTeam, type SkTeamData, type SkTeamMember } from './skApi';

type TeamViewProps = SkTeamData & {
  canManage: boolean;
  adding?: boolean;
  message?: { tone: 'success' | 'error'; text: string } | null;
  onAdd: (profileId: string) => void;
  onRemove: (member: SkTeamMember) => void;
};

/** Salingkusog team: who may enter scores, results and other Salingkusog data. */
export function TeamView({ members, managers, candidates, canManage, adding, message, onAdd, onRemove }: TeamViewProps) {
  const [pick, setPick] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!pick) return;
    onAdd(pick);
    setPick('');
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card aria-labelledby="sk-team-members">
        <CardHeader id="sk-team-members" title="Team members" />
        <p className="px-5 text-meta font-normal text-ink-muted">
          Members can enter schedules, live scores, results, medals and awards. Everyone else in the newsroom can only view.
        </p>
        {members.length === 0 ? (
          <p className="px-5 py-5 text-body-m text-ink-muted">No one has been added yet.</p>
        ) : (
          <ul className="px-5 pb-2 pt-2">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{m.display_name}</p>
                  <p className="truncate text-meta font-normal text-ink-muted">
                    {m.email} · added {formatDate(m.created_at)}
                    {m.addedByName && ` by ${m.addedByName}`}
                  </p>
                </div>
                <Pill tone={m.is_active ? 'green' : 'neutral'}>{m.is_active ? roleLabels[m.role] : 'Inactive'}</Pill>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => onRemove(m)}
                    className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-alert-soft hover:text-alert"
                    aria-label={`Remove ${m.display_name} from the Salingkusog team`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-col gap-5">
        {canManage && (
          <Card aria-labelledby="sk-team-add">
            <CardHeader id="sk-team-add" title="Add a member" />
            <form onSubmit={submit} className="flex flex-col gap-4 p-5 pt-2">
              {message && <Alert tone={message.tone}>{message.text}</Alert>}
              {candidates.length === 0 ? (
                <p className="text-meta font-normal text-ink-muted">Every active staff account is already on the team.</p>
              ) : (
                <>
                  <Field label="Staff account">
                    {({ id }) => (
                      <Select id={id} value={pick} onChange={(e) => setPick(e.target.value)}>
                        <option value="">Choose someone…</option>
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.display_name} · {roleLabels[c.role]}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Button type="submit" loading={adding} disabled={!pick} className="self-start">
                    Add to team
                  </Button>
                </>
              )}
              <p className="text-meta font-normal text-ink-muted">Not listed? Invite them from Staff → Invites first.</p>
            </form>
          </Card>
        )}

        <Card aria-labelledby="sk-team-always">
          <CardHeader id="sk-team-always" title="Always have access" />
          <p className="px-5 text-meta font-normal text-ink-muted">
            {roleLabels.super_admin}, {roleLabels.editor_in_chief} and {roleLabels.managing_editor} accounts can edit everything and choose the team.
          </p>
          <ul className="px-5 pb-3 pt-2">
            {managers.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
                <span className="min-w-0 truncate font-semibold text-ink">{m.display_name}</span>
                <span className="shrink-0 text-meta text-ink-muted">{roleLabels[m.role]}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function TeamTab({ canManage }: { canManage: boolean }) {
  const team = useSkTeam();
  const add = useAddSkTeamMember();
  const remove = useRemoveSkTeamMember();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  if (team.error) return <ErrorState error={team.error} onRetry={() => void team.refetch()} />;
  if (!team.data) return <Skeleton className="h-64" />;

  const nameOf = (id: string) => team.data.candidates.find((c) => c.id === id)?.display_name ?? 'They';

  return (
    <TeamView
      {...team.data}
      canManage={canManage}
      adding={add.isPending}
      message={message}
      onAdd={(id) => {
        setMessage(null);
        add.mutate(id, {
          onSuccess: () => setMessage({ tone: 'success', text: `${nameOf(id)} can now enter Salingkusog data.` }),
          onError: (err) => setMessage({ tone: 'error', text: errorText(err) ?? 'Couldn’t add them.' }),
        });
      }}
      onRemove={(m) => {
        if (!window.confirm(`Remove ${m.display_name} from the Salingkusog team? They will no longer be able to enter scores.`)) return;
        setMessage(null);
        remove.mutate(m.id, { onError: (err) => setMessage({ tone: 'error', text: errorText(err) ?? 'Couldn’t remove them.' }) });
      }}
    />
  );
}
