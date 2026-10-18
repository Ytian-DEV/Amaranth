import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { articlePath, type StoryItem } from '@/components/story/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { Pagination } from '@/components/ui/Pagination';
import { Kicker } from '@/components/ui/Tag';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { NavSection } from '../nav';
import type { SearchFilters, SearchResult } from './searchData';

export function ResultItem({ story }: { story: StoryItem }) {
  return (
    <article className="group relative flex gap-4 border-b border-line py-5 md:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Kicker>{story.label}</Kicker>
        <h2 className="font-serif text-headline-s text-ink group-hover-lime md:text-headline-m">
          <Link to={articlePath(story.slug)} className="after:absolute after:inset-0">
            {story.title}
          </Link>
        </h2>
        {story.excerpt && <p className="line-clamp-2 text-body-m text-ink-muted">{story.excerpt}</p>}
        <p className="text-meta text-ink-muted">{formatDate(story.publishedAt)}</p>
      </div>
      <Img {...story.image} ratio="4/3" sizes="160px" className="w-24 shrink-0 self-start md:w-40" />
    </article>
  );
}

type Props = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  filters: SearchFilters;
  onFilter: (patch: Partial<SearchFilters>) => void;
  sections: NavSection[];
  result?: SearchResult;
  loading: boolean;
  fetching: boolean;
  error: unknown;
  onRetry: () => void;
};

export function SearchView({ draft, onDraftChange, onSubmit, filters, onFilter, sections, result, loading, fetching, error, onRetry }: Props) {
  const active = Boolean(filters.q.trim() || filters.tag || filters.section || filters.from || filters.to);
  return (
    <div className="pb-16">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex max-w-[960px] flex-col gap-5 py-8 md:py-12">
          <h1 className="font-serif text-[34px] font-bold leading-none tracking-[-1px] md:text-display-l">
            {filters.tag ? <>Tagged “{result?.tagName ?? filters.tag}”</> : 'Search'}
          </h1>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="flex flex-col gap-3"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-muted" aria-hidden />
              <Input
                type="search"
                aria-label="Search articles"
                placeholder="Search stories, people, places…"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                className="h-14 pl-12 text-body-l"
                autoFocus={!filters.tag}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <label className="flex flex-col gap-1 text-meta text-ink-muted">
                Section
                <Select value={filters.section ?? ''} onChange={(e) => onFilter({ section: e.target.value || null, page: 1 })}>
                  <option value="">All sections</option>
                  {sections.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1 text-meta text-ink-muted">
                From
                <Input type="date" value={filters.from ?? ''} onChange={(e) => onFilter({ from: e.target.value || null, page: 1 })} />
              </label>
              <label className="flex flex-col gap-1 text-meta text-ink-muted">
                To
                <Input type="date" value={filters.to ?? ''} onChange={(e) => onFilter({ to: e.target.value || null, page: 1 })} />
              </label>
              <Button type="submit" className="self-end">
                Search
              </Button>
            </div>
          </form>
          {active && (
            <button
              type="button"
              onClick={() => onFilter({ q: '', section: null, from: null, to: null, tag: null, page: 1 })}
              className="inline-flex items-center gap-1 self-start text-meta text-green-700 hover:underline"
            >
              <X className="size-4" aria-hidden /> Clear search
            </button>
          )}
        </div>
      </header>

      <div className={cn('container-page max-w-[960px] pt-6', fetching && !loading && 'opacity-60 transition-opacity')}>
        <p className="text-meta text-ink-muted" aria-live="polite">
          {active && result && !loading ? `${result.total} ${result.total === 1 ? 'result' : 'results'}` : ''}
        </p>
        {!active ? (
          <EmptyState title="Search the Amaranth archive" className="mt-6">
            Type a word or phrase, pick a section, or narrow by date. Try “enrollment”, “Vipers” or “typhoon”.
          </EmptyState>
        ) : error ? (
          <ErrorState error={error} onRetry={onRetry} className="mt-6" />
        ) : loading ? (
          <div className="mt-4 flex flex-col gap-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : result && result.items.length > 0 ? (
          <>
            <ul>
              {result.items.map((s) => (
                <li key={s.id}>
                  <ResultItem story={s} />
                </li>
              ))}
            </ul>
            <Pagination page={filters.page} pageCount={result.pageCount} className="mt-12" />
          </>
        ) : (
          <EmptyState title="No matches" className="mt-6">
            Try fewer words, another spelling, or remove a filter.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
