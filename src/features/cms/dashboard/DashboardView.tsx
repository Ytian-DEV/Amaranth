import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { StatusPill } from '@/components/ui/StatusPill';
import { Tag } from '@/components/ui/Tag';
import type { DashboardStats } from '@/lib/database.types';
import { formatCompact, formatLongDate, formatRelative, formatShortDate } from '@/lib/format';
import { Card, CardHeader, StatCard } from '../ui';
import type { QueueItem, RecentArticle } from './dashboardData';
import { greeting } from './greeting';

function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function percentChange(now: number, before: number) {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
}

export type DashboardViewProps = {
  name: string;
  canReview: boolean;
  stats?: DashboardStats;
  statsError?: unknown;
  recent?: RecentArticle[];
  recentError?: unknown;
  queue?: QueueItem[];
  onDecline?: (item: QueueItem) => void;
  db?: { ok: boolean; latencyMs?: number; fetchedAt?: Date };
  onRetry?: () => void;
};

export function DashboardView({ name, canReview, stats, statsError, recent, recentError, queue, onDecline, db, onRetry }: DashboardViewProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const first = name.split(' ')[0];
  const pending = stats?.pending_submissions ?? null;
  const change = stats ? percentChange(stats.views_this_month, stats.views_last_month) : null;
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthName = lastMonth.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Manila' });

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-serif text-[28px] font-semibold leading-tight tracking-[-0.5px] text-ink md:text-headline-l">
            {greeting()}, {first}
          </h1>
          <p className="mt-1 text-body-m text-ink-muted">
            {formatLongDate()}
            {canReview && pending !== null && (
              <>
                {' · '}
                {pending === 0 ? 'No submissions waiting' : `${pending} submission${pending === 1 ? '' : 's'} waiting for review`}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/admin/articles${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
            }}
            className="relative sm:w-[280px]"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <Input aria-label="Search articles" placeholder="Search articles…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
          </form>
          <ButtonLink to="/admin/articles/new" icon={<Plus className="size-4" aria-hidden />}>
            New Article
          </ButtonLink>
        </div>
      </div>

      {statsError ? (
        <ErrorState title="We couldn’t load the newsroom numbers" error={statsError} onRetry={onRetry} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4" aria-label="Newsroom at a glance">
          {stats ? (
            <>
              <li>
                <StatCard label="Published" value={stats.published} note={`+${stats.published_this_week} this week`} tone="good" />
              </li>
              <li>
                <StatCard
                  label={canReview ? 'Drafts' : 'My drafts'}
                  value={stats.drafts}
                  note={stats.in_review ? `${stats.in_review} in review` : stats.scheduled ? `${stats.scheduled} scheduled` : undefined}
                />
              </li>
              <li>
                {canReview && pending !== null ? (
                  <StatCard
                    label="Pending submissions"
                    value={pending}
                    note={stats.oldest_pending_at ? `Oldest: ${daysSince(stats.oldest_pending_at)} day${daysSince(stats.oldest_pending_at) === 1 ? '' : 's'}` : 'All caught up'}
                    tone={stats.oldest_pending_at && daysSince(stats.oldest_pending_at) >= 2 ? 'alert' : 'muted'}
                  />
                ) : (
                  <StatCard label="Scheduled" value={stats.scheduled} />
                )}
              </li>
              <li>
                <StatCard
                  label="Readers this month"
                  value={formatCompact(stats.views_this_month)}
                  note={change === null ? 'Page views' : `${change >= 0 ? '+' : ''}${change}% vs ${lastMonthName}`}
                  tone={change !== null && change < 0 ? 'alert' : 'good'}
                />
              </li>
            </>
          ) : (
            [0, 1, 2, 3].map((i) => (
              <li key={i}>
                <Skeleton className="h-[138px] rounded-[12px]" />
              </li>
            ))
          )}
        </ul>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card aria-labelledby="recent">
          <CardHeader
            id="recent"
            title="Recent Articles"
            action={
              <Link to="/admin/articles" className="text-button text-green-700 hover:underline">
                View all <span aria-hidden>→</span>
              </Link>
            }
          />
          {recentError ? (
            <div className="p-5">
              <ErrorState error={recentError} onRetry={onRetry} />
            </div>
          ) : !recent ? (
            <div className="flex flex-col gap-3 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="px-5 pb-6 text-body-m text-ink-muted">
              No articles yet. <Link to="/admin/articles/new" className="text-green-700 underline">Write the first one</Link>.
            </p>
          ) : (
            <div className="px-5 pb-3">
              <table className="hidden w-full md:table">
                <thead>
                  <tr className="border-b border-line text-left text-kicker uppercase text-ink-muted">
                    <th scope="col" className="py-3 pr-4 font-bold">Title</th>
                    <th scope="col" className="py-3 pr-4 font-bold">Category</th>
                    <th scope="col" className="py-3 pr-4 font-bold">Status</th>
                    <th scope="col" className="py-3 pr-4 font-bold">Date</th>
                    <th scope="col" className="py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0">
                      <td className="max-w-[260px] py-4 pr-4 font-serif text-headline-s text-ink">{a.title}</td>
                      <td className="py-4 pr-4"><Tag>{a.category}</Tag></td>
                      <td className="py-4 pr-4"><StatusPill status={a.status} /></td>
                      <td className="whitespace-nowrap py-4 pr-4 text-meta text-ink-muted">{formatShortDate(a.date)}</td>
                      <td className="py-4 text-right">
                        <Link to={`/admin/articles/${a.id}`} className="text-button text-green-700 hover:underline">
                          Edit<span className="sr-only"> {a.title}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="flex flex-col md:hidden">
                {recent.map((a) => (
                  <li key={a.id} className="flex flex-col gap-2 border-b border-line py-4 last:border-0">
                    <p className="font-serif text-headline-s text-ink">{a.title}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag>{a.category}</Tag>
                      <StatusPill status={a.status} />
                      <span className="text-meta text-ink-muted">{formatShortDate(a.date)}</span>
                      <Link to={`/admin/articles/${a.id}`} className="ml-auto text-button text-green-700">
                        Edit<span className="sr-only"> {a.title}</span>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          {canReview && (
            <Card aria-labelledby="queue">
              <CardHeader id="queue" title="Submission Queue" />
              {!queue ? (
                <div className="flex flex-col gap-3 p-5">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : queue.length === 0 ? (
                <p className="px-5 pb-6 text-body-m text-ink-muted">Nothing waiting. Nice work.</p>
              ) : (
                <ul className="px-5 pb-3">
                  {queue.map((q) => (
                    <li key={`${q.kind}-${q.id}`} className="flex flex-col gap-1.5 border-b border-line py-3.5 last:border-0">
                      <p className="font-serif text-headline-s text-ink">{q.title}</p>
                      <p className="text-meta font-normal text-ink-muted">
                        From {q.from} · {formatRelative(q.createdAt)}
                      </p>
                      <div className="flex gap-4 pt-0.5">
                        <Link
                          to={q.kind === 'submission' ? `/admin/submissions/${q.id}` : `/admin/events/${q.id}`}
                          className="text-button text-green-700 hover:underline"
                        >
                          Review<span className="sr-only"> {q.title}</span>
                        </Link>
                        {onDecline && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Decline “${q.title}”? The sender won’t be notified automatically.`)) onDecline(q);
                            }}
                            className="text-button text-ink-muted hover:text-alert"
                          >
                            Decline<span className="sr-only"> {q.title}</span>
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {db && (
            <div role="status" className="flex items-center gap-3 rounded-[12px] bg-green-soft px-4 py-4">
              <span className={`size-2.5 shrink-0 rounded-full ${db.ok ? 'bg-green-500' : 'bg-alert'}`} aria-hidden />
              <div>
                <p className="text-[14px] font-semibold text-ink">{db.ok ? 'Database connected' : 'Database unreachable'}</p>
                {db.fetchedAt && (
                  <p className="text-meta font-normal text-ink-muted">
                    Last sync {formatRelative(db.fetchedAt)}
                    {db.latencyMs !== undefined && ` · ${db.latencyMs} ms`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
