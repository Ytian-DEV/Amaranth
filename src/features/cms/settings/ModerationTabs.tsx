import { Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pill } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth/AuthProvider';
import { isAdmin } from '@/features/auth/permissions';
import type { CommentStatus, ContactStatus, Json } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelative } from '@/lib/format';
import { Card } from '../ui';
import { useComments, useInbox, useModerate, useSaveSetting, useSetMessageStatus, useSetting } from './settingsApi';

function ViewTabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('h-9 rounded-full border px-4 text-[14px] font-semibold', value === o.value ? 'border-green-700 bg-green-700 text-on-dark' : 'border-line text-ink hover:border-green-700')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CommentsTab() {
  const { session, profile } = useAuth();
  const [status, setStatus] = useState<CommentStatus>('pending');
  const comments = useComments(status);
  const moderate = useModerate();
  const setting = useSetting<Json>('comments');
  const saveSetting = useSaveSetting('comments');
  const enabled = (setting.data as { enabled?: boolean } | null)?.enabled !== false;
  const act = (id: string, to: CommentStatus) => moderate.mutate({ id, status: to, userId: session!.user.id });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewTabs
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pending', label: 'Waiting' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'spam', label: 'Spam' },
          ]}
        />
        {isAdmin(profile?.role) && (
          <Checkbox label="Comments open on the site" checked={enabled} onChange={(e) => saveSetting.mutate({ enabled: e.target.checked })} />
        )}
      </div>
      {comments.error ? (
        <ErrorState error={comments.error} onRetry={() => void comments.refetch()} />
      ) : !comments.data ? (
        <Skeleton className="h-48" />
      ) : comments.data.length === 0 ? (
        <EmptyState title={status === 'pending' ? 'No comments waiting' : 'Nothing here'} />
      ) : (
        <Card as="div">
          <ul>
            {comments.data.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 border-b border-line px-5 py-4 last:border-0">
                <p className="text-meta text-ink-muted">
                  On{' '}
                  <a href={`/article/${c.articleSlug}`} target="_blank" rel="noreferrer" className="font-semibold text-green-700 hover:underline">
                    {c.articleTitle}
                  </a>{' '}
                  · {formatRelative(c.createdAt)}
                </p>
                <p className="text-[14px]">
                  <strong>{c.author}</strong> {c.email && <span className="text-ink-muted">({c.email})</span>}
                </p>
                <p className="whitespace-pre-line text-body-m">{c.body}</p>
                <div className="flex flex-wrap gap-2">
                  {status !== 'approved' && <Button size="sm" disabled={moderate.isPending} onClick={() => act(c.id, 'approved')}>Approve</Button>}
                  {status !== 'rejected' && <Button size="sm" variant="outline" disabled={moderate.isPending} onClick={() => act(c.id, 'rejected')}>Reject</Button>}
                  {status !== 'spam' && <Button size="sm" variant="ghost" className="text-alert" disabled={moderate.isPending} onClick={() => act(c.id, 'spam')}>Spam</Button>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

const messageTone: Record<ContactStatus, 'review' | 'blue' | 'green' | 'neutral'> = { unread: 'review', in_progress: 'blue', resolved: 'green', spam: 'neutral' };
const messageLabel: Record<ContactStatus, string> = { unread: 'Unread', in_progress: 'In progress', resolved: 'Resolved', spam: 'Spam' };

export function InboxTab() {
  const { session } = useAuth();
  const [view, setView] = useState<ContactStatus | 'open'>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const inbox = useInbox(view);
  const setStatus = useSetMessageStatus();
  const mark = (id: string, status: ContactStatus) => setStatus.mutate({ id, status, userId: session!.user.id });

  return (
    <div className="flex flex-col gap-4">
      <ViewTabs
        value={view}
        onChange={setView}
        options={[
          { value: 'open', label: 'Open' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'spam', label: 'Spam' },
        ]}
      />
      {inbox.error ? (
        <ErrorState error={inbox.error} onRetry={() => void inbox.refetch()} />
      ) : !inbox.data ? (
        <Skeleton className="h-48" />
      ) : inbox.data.length === 0 ? (
        <EmptyState title={view === 'open' ? 'Inbox zero' : 'Nothing here'} />
      ) : (
        <Card as="div">
          <ul>
            {inbox.data.map((m) => {
              const expanded = openId === m.id;
              return (
                <li key={m.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => {
                      setOpenId(expanded ? null : m.id);
                      if (!expanded && m.status === 'unread') mark(m.id, 'in_progress');
                    }}
                    className="flex w-full flex-col gap-1 px-5 py-4 text-left hover:bg-paper md:flex-row md:items-center md:gap-4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate', m.status === 'unread' ? 'font-bold' : 'font-semibold')}>{m.subject}</span>
                      <span className="block truncate text-meta font-normal text-ink-muted">
                        {m.name} · {m.category} · {formatRelative(m.created_at)}
                      </span>
                    </span>
                    <Pill tone={messageTone[m.status]}>{messageLabel[m.status]}</Pill>
                  </button>
                  {expanded && (
                    <div className="flex flex-col gap-3 px-5 pb-5">
                      <p className="text-meta text-ink-muted">
                        {m.email} · {formatDateTime(m.created_at)}
                      </p>
                      <p className="whitespace-pre-line text-body-m">{m.message}</p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-green-700 px-3 text-[13px] font-semibold text-on-dark hover:bg-green-900"
                        >
                          <Mail className="size-4" aria-hidden /> Reply by email
                        </a>
                        {m.status !== 'resolved' && <Button size="sm" variant="outline" onClick={() => mark(m.id, 'resolved')}>Mark resolved</Button>}
                        {m.status !== 'spam' && <Button size="sm" variant="ghost" className="text-alert" onClick={() => mark(m.id, 'spam')}>Spam</Button>}
                        {(m.status === 'resolved' || m.status === 'spam') && <Button size="sm" variant="ghost" onClick={() => mark(m.id, 'in_progress')}>Reopen</Button>}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
