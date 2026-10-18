import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { errorText } from '@/lib/errors';
import { formatRelative } from '@/lib/format';
import { Turnstile } from '@/components/ui/Turnstile';
import type { ArticleComment, CommentInput } from './articleData';

type Props = {
  comments: ArticleComment[];
  loading?: boolean;
  open: boolean;
  onSubmit: (input: CommentInput) => Promise<unknown>;
};

function CommentItem({ comment, replies, onReply }: { comment: ArticleComment; replies: ArticleComment[]; onReply?: () => void }) {
  return (
    <li className="flex flex-col gap-2 border-b border-line py-5">
      <p className="text-[14px] font-semibold text-ink">
        {comment.authorName}{' '}
        <span className="font-medium text-ink-muted">
          · <time dateTime={comment.createdAt}>{formatRelative(comment.createdAt)}</time>
        </span>
      </p>
      <p className="whitespace-pre-line text-body-m text-ink">{comment.body}</p>
      {onReply && (
        <button type="button" onClick={onReply} className="self-start text-meta text-green-700 hover:underline">
          Reply
        </button>
      )}
      {replies.length > 0 && (
        <ul className="ml-4 border-l-2 border-green-soft pl-4">
          {replies.map((r) => (
            <CommentItem key={r.id} comment={r} replies={[]} />
          ))}
        </ul>
      )}
    </li>
  );
}

const empty = { name: '', email: '', body: '', website: '' };

export function Comments({ comments, loading, open, onSubmit }: Props) {
  const [form, setForm] = useState(empty);
  const [replyTo, setReplyTo] = useState<ArticleComment | null>(null);
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'sent' | 'error'; message?: string }>({ status: 'idle' });
  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState({ status: 'sending' });
    try {
      await onSubmit({ ...form, parentId: replyTo?.id ?? null });
      setForm(empty);
      setReplyTo(null);
      setState({ status: 'sent' });
    } catch (err) {
      setState({ status: 'error', message: errorText(err) ?? 'Your comment could not be sent.' });
    }
  }

  const set = (key: keyof typeof empty) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <section aria-labelledby="comments" className="flex flex-col gap-4">
      <h2 id="comments" className="font-serif text-headline-m text-ink">
        Comments {comments.length > 0 && <span className="text-ink-muted">({comments.length})</span>}
      </h2>

      {loading ? (
        <Spinner label="Loading comments" />
      ) : roots.length > 0 ? (
        <ul>
          {roots.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={repliesOf(c.id)}
              onReply={open ? () => setReplyTo(c) : undefined}
            />
          ))}
        </ul>
      ) : (
        <p className="text-body-m text-ink-muted">{open ? 'No comments yet. Start the conversation.' : 'No comments.'}</p>
      )}

      {open ? (
        <form onSubmit={submit} className="mt-2 flex flex-col gap-4 rounded-lg border border-line bg-surface p-5" noValidate>
          <p className="text-[15px] font-semibold text-ink">
            {replyTo ? (
              <>
                Replying to {replyTo.authorName}{' '}
                <button type="button" className="ml-1 text-meta text-green-700 underline" onClick={() => setReplyTo(null)}>
                  cancel
                </button>
              </>
            ) : (
              'Leave a comment'
            )}
          </p>
          {state.status === 'sent' && (
            <Alert tone="success">Thanks! Your comment will appear once an editor approves it.</Alert>
          )}
          {state.status === 'error' && <Alert tone="error">{state.message}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              {({ id }) => <Input id={id} autoComplete="name" maxLength={80} required value={form.name} onChange={set('name')} />}
            </Field>
            <Field label="Email" required hint="Never shown publicly.">
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="email"
                  required
                  aria-describedby={describedBy}
                  value={form.email}
                  onChange={set('email')}
                />
              )}
            </Field>
          </div>
          <Field label="Comment" required>
            {({ id }) => <Textarea id={id} required maxLength={3000} value={form.body} onChange={set('body')} />}
          </Field>
          {/* honeypot: hidden from people, filled by bots */}
          <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
            </label>
          </div>
          <Turnstile />
          <p className="text-meta font-normal text-ink-muted">
            Comments are moderated. Be kind, stay on topic, and don’t share personal information.
          </p>
          <Button
            type="submit"
            className="self-start"
            loading={state.status === 'sending'}
            disabled={!form.name.trim() || !form.email.trim() || form.body.trim().length < 2}
          >
            Post comment
          </Button>
        </form>
      ) : (
        <p className="text-meta text-ink-muted">Comments are closed for this article.</p>
      )}
    </section>
  );
}
