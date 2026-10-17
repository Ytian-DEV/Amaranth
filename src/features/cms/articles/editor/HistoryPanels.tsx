import { History, MessageSquare } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Feedback';
import { statusInfo } from '@/components/ui/status';
import { errorText } from '@/lib/errors';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { ActivityItem, RevisionItem } from './history';

function describe(item: ActivityItem) {
  if (item.action === 'created') return 'created the article';
  if (item.action === 'note') return 'left a note';
  const to = item.to ? statusInfo[item.to].label.toLowerCase() : '';
  if (item.to === 'submitted') return 'submitted it for review';
  if (item.to === 'in_review') return 'started reviewing';
  if (item.to === 'draft' && (item.from === 'submitted' || item.from === 'in_review')) return 'returned it to draft';
  if (item.to === 'draft' && item.from === 'published') return 'unpublished it';
  return `moved it to ${to}`;
}

/** Review notes + status history, newest first. */
export function ActivityPanel({
  items,
  loading,
  onAddNote,
}: {
  items: ActivityItem[] | undefined;
  loading?: boolean;
  onAddNote?: (note: string) => Promise<unknown>;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!note.trim() || !onAddNote) return;
    setBusy(true);
    setError(null);
    try {
      await onAddNote(note.trim());
      setNote('');
    } catch (err) {
      setError(errorText(err) ?? 'Couldn’t add the note.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {onAddNote && (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor={id} className="text-[13px] font-semibold">
            Note to the newsroom
          </label>
          <Textarea id={id} rows={2} className="min-h-16" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Feedback, sources to check, questions…" />
          {error && (
            <p role="alert" className="text-meta text-alert">
              {error}
            </p>
          )}
          <Button type="submit" size="sm" variant="outline" className="self-start" loading={busy} disabled={!note.trim()}>
            Add note
          </Button>
        </form>
      )}
      {loading ? (
        <Spinner label="Loading history" />
      ) : !items?.length ? (
        <p className="text-meta font-normal text-ink-muted">No activity yet.</p>
      ) : (
        <ol className="flex flex-col">
          {items.map((item) => (
            <li key={item.id} className="relative flex gap-3 border-l-2 border-line pb-4 pl-4 last:pb-0">
              <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-green-500" aria-hidden />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-[13px]">
                  <span className="font-semibold text-ink">{item.actor}</span> <span className="text-ink-muted">{describe(item)}</span>
                </p>
                {item.note && (
                  <p className="flex gap-1.5 rounded-md bg-lime-soft px-2.5 py-2 text-[13px] text-ink">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-lime-dark-text" aria-hidden />
                    <span className="whitespace-pre-line">{item.note}</span>
                  </p>
                )}
                <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)} className="text-meta font-normal text-ink-muted">
                  {formatRelative(item.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const kindLabel = { autosave: 'Autosave', manual: 'Saved', status: 'Status change' } as const;

export function RevisionsPanel({
  items,
  loading,
  canRestore,
  onRestore,
}: {
  items: RevisionItem[] | undefined;
  loading?: boolean;
  canRestore: boolean;
  onRestore: (id: number) => void;
}) {
  if (loading) return <Spinner label="Loading revisions" />;
  if (!items?.length) return <p className="text-meta font-normal text-ink-muted">Revisions appear after the first save.</p>;
  return (
    <ul className="flex max-h-72 flex-col overflow-y-auto">
      {items.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-2 border-b border-line py-2 last:border-0">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <History className="size-3.5 text-ink-muted" aria-hidden />
              {kindLabel[r.kind]}
            </p>
            <p className="truncate text-meta font-normal text-ink-muted">
              {formatRelative(r.createdAt)}
              {r.savedBy && ` · ${r.savedBy}`}
            </p>
          </div>
          {canRestore && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Replace the headline and body in the editor with this revision? You can still undo by not saving.')) onRestore(r.id);
              }}
              className="shrink-0 text-meta text-green-700 hover:underline"
            >
              Restore<span className="sr-only"> revision from {formatDateTime(r.createdAt)}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
