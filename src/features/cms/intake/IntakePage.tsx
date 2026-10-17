import { ArrowLeft, Download, FileText, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Alert, EmptyState, ErrorState, Skeleton, Spinner } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage } from '@/components/ui/pageWindow';
import { Pill } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth/AuthProvider';
import type { IntakeStatus } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { errorText } from '@/lib/errors';
import { formatDate, formatDateTime, formatRelative } from '@/lib/format';
import { formatBytes } from '@/lib/images';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { useCategoryOptions } from '../articles/api';
import { Card, CmsPageHeader } from '../ui';
import {
  INTAKE_PAGE_SIZE,
  signedIntakeUrl,
  useConvertIntake,
  useIntakeItem,
  useIntakeList,
  useSetIntakeStatus,
  type IntakeFile,
  type IntakeItem,
  type IntakeKind,
} from './intakeApi';

const statusTone: Record<IntakeStatus, 'review' | 'blue' | 'green' | 'neutral' | 'lime'> = {
  submitted: 'review',
  reviewing: 'blue',
  accepted: 'green',
  declined: 'neutral',
  converted: 'lime',
};
const statusLabel: Record<IntakeStatus, string> = {
  submitted: 'New',
  reviewing: 'Reviewing',
  accepted: 'Accepted',
  declined: 'Declined',
  converted: 'Turned into an article',
};
const views: { value: IntakeStatus | 'open'; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'converted', label: 'Converted' },
  { value: 'declined', label: 'Declined' },
];

const meta = { submission: { title: 'Submissions', base: '/admin/submissions' }, event: { title: 'Event reports', base: '/admin/events' } };

export function IntakeList({ kind }: { kind: IntakeKind }) {
  useDocumentTitle(meta[kind].title);
  const [params, setParams] = useSearchParams();
  const view = (params.get('view') as IntakeStatus | 'open' | null) ?? 'open';
  const page = parsePage(params.get('page'));
  const list = useIntakeList(kind, view, page);
  const total = list.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <CmsPageHeader
        title={meta[kind].title}
        subtitle={kind === 'submission' ? 'Stories sent in through “Submit a story”.' : 'Reports sent in through “Report an event”.'}
        actions={
          <Link to={kind === 'submission' ? '/admin/events' : '/admin/submissions'} className="text-button text-green-700 hover:underline">
            {kind === 'submission' ? 'Event reports →' : 'Article submissions →'}
          </Link>
        }
      />
      <nav aria-label="Filter" className="-mx-4 md:mx-0">
        <ul data-scroll-x className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-4 md:px-0">
          {views.map((v) => (
            <li key={v.value} className="shrink-0">
              <button
                type="button"
                aria-current={view === v.value ? 'page' : undefined}
                onClick={() => setParams(v.value === 'open' ? {} : { view: v.value }, { replace: true })}
                className={cn('-mb-px border-b-2 px-3 py-2.5 text-button', view === v.value ? 'border-green-700 text-green-700' : 'border-transparent text-ink-muted hover:text-ink')}
              >
                {v.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <Card as="div">
        {list.error ? (
          <div className="p-5">
            <ErrorState error={list.error} onRetry={() => void list.refetch()} />
          </div>
        ) : !list.data ? (
          <Skeleton className="m-5 h-48" />
        ) : list.data.items.length === 0 ? (
          <EmptyState title={view === 'open' ? 'Nothing waiting' : 'Nothing here'} className="m-5 border-0">
            {view === 'open' ? 'New submissions will show up here.' : undefined}
          </EmptyState>
        ) : (
          <ul className={cn(list.isPlaceholderData && 'opacity-60')}>
            {list.data.items.map((item) => (
              <li key={item.id} className="border-b border-line last:border-0">
                <Link to={`${meta[kind].base}/${item.id}`} className="flex flex-col gap-1.5 px-5 py-4 hover:bg-paper md:flex-row md:items-center md:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-headline-s text-ink">{item.title}</p>
                    <p className="truncate text-meta font-normal text-ink-muted">
                      From {item.from}
                      {item.section && ` · ${item.section}`} · {formatRelative(item.createdAt)}
                    </p>
                  </div>
                  <Pill tone={statusTone[item.status]}>{statusLabel[item.status]}</Pill>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / INTAKE_PAGE_SIZE))} />
    </div>
  );
}

function FileRow({ file }: { file: IntakeFile }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function open() {
    setBusy(true);
    setError(null);
    try {
      window.open(await signedIntakeUrl(file.path), '_blank', 'noopener');
    } catch (err) {
      setError(errorText(err) ?? 'Couldn’t open the file.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <li className="flex items-center gap-3 rounded-md bg-paper px-3 py-2">
      <FileText className="size-4 shrink-0 text-green-700" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[14px]">{file.name}</span>
      {file.size && <span className="text-meta text-ink-muted">{formatBytes(file.size)}</span>}
      <Button size="sm" variant="ghost" loading={busy} icon={<Download className="size-4" aria-hidden />} onClick={() => void open()}>
        Open<span className="sr-only"> {file.name}</span>
      </Button>
      {error && <span role="alert" className="text-meta text-alert">{error}</span>}
    </li>
  );
}

export function IntakeDetailView({
  item,
  files,
  categories,
  busy,
  onStatus,
  onConvert,
}: {
  item: IntakeItem;
  files: IntakeFile[];
  categories: { id: string; name: string; sectionName: string }[];
  busy: boolean;
  onStatus: (status: IntakeStatus, note: string | null) => void;
  onConvert: (categoryId: string) => void;
}) {
  const [note, setNote] = useState(item.reviewNote ?? '');
  const [category, setCategory] = useState('');
  const open = item.status === 'submitted' || item.status === 'reviewing' || item.status === 'accepted';
  const groups = new Map<string, typeof categories>();
  for (const c of categories) groups.set(c.sectionName, [...(groups.get(c.sectionName) ?? []), c]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="flex flex-col gap-4 p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={statusTone[item.status]}>{statusLabel[item.status]}</Pill>
          <span className="text-meta text-ink-muted">Received {formatDateTime(item.createdAt)}</span>
        </div>
        <h1 className="font-serif text-[28px] font-semibold leading-tight md:text-headline-l">{item.title}</h1>
        <dl className="grid gap-x-6 gap-y-1 text-[14px] sm:grid-cols-[140px_1fr]">
          <dt className="text-ink-muted">From</dt>
          <dd>{item.from}</dd>
          <dt className="text-ink-muted">Email</dt>
          <dd>
            <a href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.title}`)}`} className="inline-flex items-center gap-1 text-green-700 hover:underline">
              <Mail className="size-3.5" aria-hidden /> {item.email}
            </a>
          </dd>
          {item.kind === 'submission' && item.affiliation && (
            <>
              <dt className="text-ink-muted">Program / org</dt>
              <dd>{item.affiliation}</dd>
            </>
          )}
          {item.section && (
            <>
              <dt className="text-ink-muted">Section</dt>
              <dd>{item.section}</dd>
            </>
          )}
          {item.eventDate && (
            <>
              <dt className="text-ink-muted">Event date</dt>
              <dd>{formatDate(item.eventDate)}</dd>
            </>
          )}
          {item.venue && (
            <>
              <dt className="text-ink-muted">Venue</dt>
              <dd>{item.venue}</dd>
            </>
          )}
        </dl>
        {item.summary && <p className="rounded-md bg-lime-soft p-3 text-body-m">{item.summary}</p>}
        {item.body ? (
          <div className="whitespace-pre-line border-t border-line pt-4 text-body-l text-ink">{item.body}</div>
        ) : (
          <p className="text-body-m text-ink-muted">No text — see the attachments.</p>
        )}
        {files.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <h2 className="text-kicker uppercase text-ink-muted">Attachments</h2>
            <ul className="flex flex-col gap-2">
              {files.map((f) => (
                <FileRow key={f.id} file={f} />
              ))}
            </ul>
          </div>
        )}
      </Card>

      <aside className="flex flex-col gap-4">
        {item.convertedArticleId ? (
          <Card className="flex flex-col gap-3 p-4">
            <p className="text-body-m">This became an article draft.</p>
            <Link to={`/admin/articles/${item.convertedArticleId}`} className="text-button text-green-700 hover:underline">
              Open the draft →
            </Link>
          </Card>
        ) : (
          open && (
            <Card className="flex flex-col gap-3 p-4">
              <h2 className="text-kicker uppercase text-ink-muted">Turn into an article</h2>
              <Select aria-label="Category for the new article" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Choose a category…</option>
                {[...groups.entries()].map(([section, list]) => (
                  <optgroup key={section} label={section}>
                    {list.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <Button disabled={!category} loading={busy} onClick={() => onConvert(category)}>
                Create draft
              </Button>
              <p className="text-meta font-normal text-ink-muted">Copies the title and text into a new draft you can edit.</p>
            </Card>
          )
        )}
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="text-kicker uppercase text-ink-muted">Review</h2>
          <label htmlFor="intake-note" className="text-[13px] font-semibold">
            Internal note
          </label>
          <Textarea id="intake-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only staff see this" />
          <div className="flex flex-wrap gap-2">
            {item.status === 'submitted' && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus('reviewing', note || null)}>
                Mark reviewing
              </Button>
            )}
            {open && item.status !== 'accepted' && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus('accepted', note || null)}>
                Accept
              </Button>
            )}
            {open && (
              <Button size="sm" variant="ghost" className="text-alert" disabled={busy} onClick={() => onStatus('declined', note || null)}>
                Decline
              </Button>
            )}
            {!open && item.status === 'declined' && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus('reviewing', note || null)}>
                Reopen
              </Button>
            )}
          </div>
          <p className="text-meta font-normal text-ink-muted">Senders aren’t emailed automatically — reply from your inbox.</p>
        </Card>
      </aside>
    </div>
  );
}

export function IntakeDetail({ kind }: { kind: IntakeKind }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const data = useIntakeItem(kind, id);
  const categories = useCategoryOptions();
  const setStatus = useSetIntakeStatus(kind);
  const convert = useConvertIntake(kind);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle(data.data?.item.title ?? meta[kind].title);

  if (data.isPending) return <Spinner label="Opening" className="py-16" />;
  if (data.error) return <ErrorState error={data.error} onRetry={() => void data.refetch()} />;
  if (!data.data) return <EmptyState title="Not found">It may have been removed.</EmptyState>;

  return (
    <div className="flex flex-col gap-5">
      <Link to={meta[kind].base} className="inline-flex items-center gap-1.5 self-start text-button text-green-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> {meta[kind].title}
      </Link>
      {error && <Alert tone="error">{error}</Alert>}
      <IntakeDetailView
        item={data.data.item}
        files={data.data.files}
        categories={categories.data ?? []}
        busy={setStatus.isPending || convert.isPending}
        onStatus={(status, note) =>
          setStatus.mutate({ id: data.data!.item.id, status, note, reviewerId: session!.user.id }, { onError: (e) => setError(errorText(e) ?? 'Failed.') })
        }
        onConvert={(categoryId) =>
          convert.mutate(
            { id: data.data!.item.id, categoryId },
            { onSuccess: (articleId) => navigate(`/admin/articles/${articleId}`), onError: (e) => setError(errorText(e) ?? 'Failed.') },
          )
        }
      />
    </div>
  );
}
