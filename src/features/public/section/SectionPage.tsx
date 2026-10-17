import { useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/ui/Feedback';
import { parsePage } from '@/components/ui/pageWindow';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { usePageMeta } from '@/lib/usePageMeta';
import { NotFoundPage } from '../NotFoundPage';
import { SectionSkeleton, SectionView } from './SectionView';
import { SportsLandingPage } from './SportsLandingPage';
import { useArticlePage, useSectionInfo } from './sectionData';
import { sectionLandings } from './landing';
import { useSectionLanding } from './landing/data';

function useListParams() {
  const [params] = useSearchParams();
  return { page: parsePage(params.get('page')), category: params.get('category'), all: params.get('view') === 'all' };
}

const categoryHref = (base: string) => (slug: string | null) => (slug ? `${base}?category=${encodeURIComponent(slug)}` : base);

/** /:section — every section uses this one template. */
export function SectionPage() {
  const { section: slug = '' } = useParams();
  const { page, category, all } = useListParams();
  const info = useSectionInfo(slug);
  // page 1 of a section with its own design shows that landing instead of the list
  const Landing = page === 1 && !category && !all ? sectionLandings[slug] : undefined;
  const landing = useSectionLanding(slug, info.data?.section.name, Boolean(Landing));
  const articles = useArticlePage({ section: slug, category, page, enabled: !Landing });
  const activeCategory = info.data?.categories.some((c) => c.slug === category) ? category : null;
  usePageMeta({
    title: info.data?.section.name ?? (info.data === null ? 'Page not found' : undefined),
    description: info.data?.section.description,
    path: `/${slug}`,
  });

  const list = Landing ? landing : articles;
  if (info.isPending || (list.isPending && !list.data)) return <SectionSkeleton />;
  if (info.error || list.error) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">{slug}</h1>
        <ErrorState
          error={info.error ?? list.error}
          onRetry={() => {
            void info.refetch();
            void list.refetch();
          }}
        />
      </div>
    );
  }
  if (!info.data) return <NotFoundPage />;

  const { section, categories } = info.data;
  if (Landing && landing.data) return <Landing section={section} categories={categories} items={landing.data.items} mostRead={landing.data.mostRead} />;
  if (section.slug === 'sports' && page === 1 && !activeCategory && !category) {
    return <SportsLandingPage categories={categories} items={articles.data?.items ?? []} hasMore={(articles.data?.pageCount ?? 1) > 1} />;
  }
  return (
    <SectionView
      title={section.name}
      description={section.description}
      categories={categories}
      activeCategory={activeCategory}
      categoryHref={categoryHref(`/${section.slug}`)}
      items={articles.data?.items ?? []}
      page={page}
      pageCount={articles.data?.pageCount ?? 1}
      total={articles.data?.total ?? 0}
      loading={articles.isPlaceholderData}
    />
  );
}

/** /latest — every section, newest first. */
export function LatestPage() {
  const { page } = useListParams();
  const articles = useArticlePage({ section: null, page });
  useDocumentTitle('Latest stories');

  if (articles.isPending && !articles.data) return <SectionSkeleton />;
  if (articles.error) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">Latest stories</h1>
        <ErrorState error={articles.error} onRetry={() => void articles.refetch()} />
      </div>
    );
  }
  return (
    <SectionView
      title="Latest Stories"
      description="Everything Amaranth has published, newest first."
      items={articles.data?.items ?? []}
      page={page}
      pageCount={articles.data?.pageCount ?? 1}
      total={articles.data?.total ?? 0}
      loading={articles.isPlaceholderData}
    />
  );
}
