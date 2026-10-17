import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/Button';
import { Checkbox, Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { parsePage } from '@/components/ui/pageWindow';
import { statusInfo } from '@/components/ui/status';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth/AuthProvider';
import { defaultSections } from '@/features/public/nav';
import type { ArticleStatus } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { formatShortDate } from '@/lib/format';
import { useDebounced } from '@/lib/useDebounced';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { Card, CmsPageHeader } from '../ui';
import { LIST_PAGE_SIZE, useArticleList, type ArticleListFilters, type ArticleListRow } from './api';

export function ArticlesTable({ rows, loading }: { rows: ArticleListRow[]; loading?: boolean }) {
  return (
    <div className={cn(loading && 'opacity-60 transition-opacity')}>
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-line text-left text-kicker uppercase text-ink-muted">
            <th scope="col" className="px-5 py-3 font-bold">Title</th>
            <th scope="col" className="py-3 pr-4 font-bold">Section</th>
            <th scope="col" className="py-3 pr-4 font-bold">Status</th>
            <th scope="col" className="py-3 pr-5 font-bold">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="group border-b border-line last:border-0 hover:bg-paper">
              <td className="px-5 py-3.5">
                <Link to={`/admin/articles/${r.id}`} className="font-serif text-headline-s text-ink group-hover:text-green-700">
                  {r.title}
                </Link>
                {r.byline && <p className="mt-0.5 text-meta font-normal text-ink-muted">By {r.byline}</p>}
              </td>
              <td className="py-3.5 pr-4 text-meta text-ink-muted">
                {r.section}
                {r.category !== r.section && <span className="block font-normal">{r.category}</span>}
              </td>
              <td className="py-3.5 pr-4"><StatusPill status={r.status} /></td>
              <td className="whitespace-nowrap py-3.5 pr-5 text-meta text-ink-muted">{formatShortDate(r.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="border-b border-line px-4 py-3.5 last:border-0">
            <Link to={`/admin/articles/${r.id}`} className="font-serif text-headline-s text-ink">
              {r.title}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-meta text-ink-muted">
              <StatusPill status={r.status} />
              <span>{r.section}</span>
              <span>· {formatShortDate(r.updatedAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const statuses = Object.keys(statusInfo) as ArticleStatus[];

const quickViews: { label: string; status: ArticleListFilters['status']; mine: boolean }[] = [
  { label: 'All', status: '', mine: false },
  { label: 'Mine', status: '', mine: true },
  { label: 'Needs review', status: 'review', mine: false },
  { label: 'Drafts', status: 'draft', mine: false },
  { label: 'Scheduled', status: 'scheduled', mine: false },
  { label: 'Published', status: 'published', mine: false },
];

export function ArticlesListPage() {
  useDocumentTitle('Articles');
  const { session } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters: ArticleListFilters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      status: (params.get('status') as ArticleListFilters['status'] | null) ?? '',
      section: params.get('section') ?? '',
      mine: params.get('mine') === '1',
      page: parsePage(params.get('page')),
    }),
    [params],
  );
  const [q, setQ] = useState(filters.q);
  const debouncedQ = useDebounced(q);
  const list = useArticleList(filters, session?.user.id);

  function update(patch: Partial<ArticleListFilters>) {
    const next = { ...filters, page: 1, ...patch };
    const out = new URLSearchParams();
    if (next.q) out.set('q', next.q);
    if (next.status) out.set('status', next.status);
    if (next.section) out.set('section', next.section);
    if (next.mine) out.set('mine', '1');
    if (next.page > 1) out.set('page', String(next.page));
    setParams(out, { replace: true });
  }

  useEffect(() => {
    if (debouncedQ !== filters.q) update({ q: debouncedQ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const total = list.data?.total ?? 0;
  return (
    <div className="flex flex-col gap-6">
      <CmsPageHeader
        title="Articles"
        subtitle={list.data ? `${total} article${total === 1 ? '' : 's'}` : undefined}
        actions={
          <ButtonLink to="/admin/articles/new" icon={<Plus className="size-4" aria-hidden />}>
            New Article
          </ButtonLink>
        }
      />

      <nav aria-label="Article views" className="-mx-4 md:mx-0">
        <ul data-scroll-x className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-4 md:px-0">
          {quickViews.map((v) => {
            const active = filters.status === v.status && filters.mine === v.mine;
            return (
              <li key={v.label} className="shrink-0">
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => update({ status: v.status, mine: v.mine })}
                  className={cn(
                    '-mb-px border-b-2 px-3 py-2.5 text-button',
                    active ? 'border-green-700 text-green-700' : 'border-transparent text-ink-muted hover:text-ink',
                  )}
                >
                  {v.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_200px_auto] md:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <Input type="search" aria-label="Search by title" placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <Select aria-label="Filter by status" value={filters.status} onChange={(e) => update({ status: e.target.value as ArticleListFilters['status'] })}>
          <option value="">All statuses</option>
          <option value="review">Needs review</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusInfo[s].label}
            </option>
          ))}
        </Select>
        <Select aria-label="Filter by section" value={filters.section} onChange={(e) => update({ section: e.target.value })}>
          <option value="">All sections</option>
          {defaultSections.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </Select>
        <Checkbox label="Mine only" checked={filters.mine} onChange={(e) => update({ mine: e.target.checked })} />
      </div>

      <Card as="div">
        {list.error ? (
          <div className="p-5">
            <ErrorState error={list.error} onRetry={() => void list.refetch()} />
          </div>
        ) : !list.data ? (
          <div className="flex flex-col gap-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : list.data.rows.length === 0 ? (
          <EmptyState title="No articles match" className="m-5 border-0">
            {filters.q || filters.status || filters.section || filters.mine ? 'Try clearing a filter.' : 'Start with a new article.'}
          </EmptyState>
        ) : (
          <ArticlesTable rows={list.data.rows} loading={list.isPlaceholderData} />
        )}
      </Card>
      <Pagination page={filters.page} pageCount={Math.max(1, Math.ceil(total / LIST_PAGE_SIZE))} />
    </div>
  );
}
