import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ButtonVariant } from '@/components/ui/buttonStyles';
import { Input, Textarea } from '@/components/ui/Field';
import { StatusPill } from '@/components/ui/StatusPill';
import { transitionLabels } from '@/features/auth/permissions';
import type { ArticleStatus } from '@/lib/database.types';
import { formatDateTime } from '@/lib/format';

const needsNote: ArticleStatus[] = ['rejected'];
const variantFor = (to: ArticleStatus): ButtonVariant =>
  to === 'published' || to === 'submitted' ? 'primary' : to === 'rejected' ? 'danger' : to === 'scheduled' ? 'accent' : 'outline';

/** Moves the article through the workflow; options come from allowedTransitions(). */
export function WorkflowPanel({
  status,
  publishedAt,
  options,
  busy,
  onTransition,
}: {
  status: ArticleStatus;
  publishedAt: string | null;
  options: ArticleStatus[];
  busy: boolean;
  onTransition: (to: ArticleStatus, note: string | null, scheduledFor: string | null) => void;
}) {
  const [pending, setPending] = useState<ArticleStatus | null>(null);
  const [note, setNote] = useState('');
  const [when, setWhen] = useState('');
  const noteId = useId();
  const whenId = useId();
  const order: ArticleStatus[] = ['published', 'scheduled', 'submitted', 'in_review', 'draft', 'archived', 'rejected'];
  const sorted = [...options].sort((a, b) => order.indexOf(a) - order.indexOf(b));

  const confirm = () => {
    if (!pending) return;
    const scheduledFor = pending === 'scheduled' && when ? new Date(when).toISOString() : null;
    onTransition(pending, note.trim() || null, scheduledFor);
    setPending(null);
    setNote('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={status} />
        {status === 'scheduled' && publishedAt && <span className="text-meta text-ink-muted">for {formatDateTime(publishedAt)}</span>}
        {status === 'published' && publishedAt && <span className="text-meta text-ink-muted">{formatDateTime(publishedAt)}</span>}
      </div>

      {pending ? (
        <div className="flex flex-col gap-3 rounded-md bg-paper p-3">
          <p className="text-[14px] font-semibold">{transitionLabels[pending]}</p>
          {pending === 'scheduled' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={whenId} className="text-[13px] font-semibold">
                Publish on
              </label>
              <Input id={whenId} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} min={new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16)} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={noteId} className="text-[13px] font-semibold">
              Note {needsNote.includes(pending) ? '(required)' : '(optional)'}
            </label>
            <Textarea id={noteId} rows={3} className="min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder={pending === 'draft' ? 'What needs to change?' : 'Visible to the newsroom'} />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={variantFor(pending)}
              loading={busy}
              disabled={(needsNote.includes(pending) && !note.trim()) || (pending === 'scheduled' && !when)}
              onClick={confirm}
            >
              Confirm
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : sorted.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sorted.map((to) => (
            <Button key={to} size="sm" variant={variantFor(to)} disabled={busy} onClick={() => setPending(to)}>
              {transitionLabels[to]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-meta font-normal text-ink-muted">
          {status === 'submitted' || status === 'in_review' ? 'Waiting for an editor.' : 'No actions available for your role.'}
        </p>
      )}
    </div>
  );
}
