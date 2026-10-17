import { Link } from 'react-router-dom';
import { StoryCard, StoryCompact } from '@/components/story/Story';
import { articlePath, storyMeta, type StoryItem } from '@/components/story/types';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { Img } from '@/components/ui/Img';
import { Pagination } from '@/components/ui/Pagination';
import { Kicker } from '@/components/ui/Tag';
import { cn } from '@/lib/cn';

export type SectionViewProps = {
  title: string;
  description?: string | null;
  /** Category filter chips; `active` is the selected slug or null for "All". */
  categories?: { slug: string; name: string }[];
  activeCategory?: string | null;
  categoryHref?: (slug: string | null) => string;
  items: StoryItem[];
  page: number;
  pageCount: number;
  total: number;
  loading?: boolean;
};

function LeadCard({ story }: { story: StoryItem }) {
  return (
    <article className="group relative grid gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center md:gap-8">
      <Img {...story.image} ratio="16/10" priority sizes="(min-width: 1024px) 700px, 100vw" />
      <div className="flex flex-col gap-3">
        <Kicker>{story.label}</Kicker>
        <h2 className="font-serif text-[28px] font-semibold leading-[1.15] tracking-[-0.5px] text-ink group-hover:text-green-700 md:text-headline-l">
          <Link to={articlePath(story.slug)} className="after:absolute after:inset-0">
            {story.title}
          </Link>
        </h2>
        {story.excerpt && <p className="line-clamp-4 text-body-m text-ink-muted md:text-body-l">{story.excerpt}</p>}
        <p className="text-meta text-ink-muted">{storyMeta(story)}</p>
      </div>
    </article>
  );
}

export function SectionView({
  title,
  description,
  categories = [],
  activeCategory = null,
  categoryHref,
  items,
  page,
  pageCount,
  total,
  loading,
}: SectionViewProps) {
  const [lead, ...rest] = items;
  const showLead = page === 1 && Boolean(lead);
  const grid = showLead ? rest : items;

  return (
    <div className="pb-16">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex flex-col gap-3 py-8 md:py-12">
          <div className="flex items-center gap-4">
            <span className="h-8 w-1.5 rounded-[2px] bg-lime md:h-10" aria-hidden />
            <h1 className="font-serif text-[34px] font-bold leading-none tracking-[-1px] text-ink md:text-display-l">{title}</h1>
          </div>
          {description && <p className="max-w-2xl text-body-m text-ink-muted md:text-body-l">{description}</p>}
          {categories.length > 1 && categoryHref && (
            <nav aria-label={`${title} categories`} className="-mx-4 mt-2 md:mx-0">
              <ul data-scroll-x className="no-scrollbar flex gap-2 overflow-x-auto px-4 md:flex-wrap md:px-0">
                {[{ slug: null as string | null, name: 'All' }, ...categories].map((c) => {
                  const active = c.slug === activeCategory;
                  return (
                    <li key={c.slug ?? 'all'} className="shrink-0">
                      <Link
                        to={categoryHref(c.slug)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'inline-flex h-9 items-center rounded-full border px-4 text-[14px] font-semibold transition-colors',
                          active ? 'border-green-700 bg-green-700 text-on-dark' : 'border-line text-ink hover:border-green-700',
                        )}
                      >
                        {c.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </div>
      </header>

      <div className={cn('container-page pt-8 md:pt-12', loading && 'opacity-60 transition-opacity')} aria-busy={loading || undefined}>
        {items.length === 0 ? (
          <EmptyState title="No stories here yet">
            {activeCategory ? 'Nothing in this category so far. Try “All”.' : 'New articles in this section will show up here.'}
          </EmptyState>
        ) : (
          <>
            <p className="sr-only" aria-live="polite">
              {total} {total === 1 ? 'story' : 'stories'}, page {page} of {pageCount}
            </p>
            {showLead && (
              <div className="border-b border-line pb-10 md:pb-12">
                <LeadCard story={lead} />
              </div>
            )}
            {grid.length > 0 && (
              <>
                <ul className={cn('hidden gap-x-12 gap-y-12 md:grid md:grid-cols-2 lg:grid-cols-3', showLead && 'pt-10 md:pt-12')}>
                  {grid.map((s) => (
                    <li key={s.id}>
                      <StoryCard story={s} as="h2" />
                    </li>
                  ))}
                </ul>
                <ul className={cn('flex flex-col gap-5 md:hidden', showLead && 'pt-8')}>
                  {grid.map((s) => (
                    <li key={s.id} className="border-b border-line pb-5 last:border-0">
                      <StoryCompact story={s} as="h2" />
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Pagination page={page} pageCount={pageCount} className="mt-14" />
          </>
        )}
      </div>
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="pb-16" aria-busy>
      <h1 className="sr-only">Loading</h1>
      <div className="border-b border-line bg-surface">
        <div className="container-page flex flex-col gap-4 py-12">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="container-page grid gap-12 pt-12 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[360/220]" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
