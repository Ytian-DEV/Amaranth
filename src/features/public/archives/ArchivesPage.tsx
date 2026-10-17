import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import { toStoryItem } from '@/components/story/types';
import { ErrorState } from '@/components/ui/Feedback';
import { parsePage } from '@/components/ui/pageWindow';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { liveCards } from '../articles';
import { NotFoundPage } from '../NotFoundPage';
import { PAGE_SIZE } from '../section/sectionData';
import { SectionSkeleton, SectionView } from '../section/SectionView';
import { ArchivesView } from './ArchivesView';
import { monthLabel, monthRange, useArchiveMonths, useIssues } from './archivesData';

export function ArchivesPage() {
  useDocumentTitle('Archives');
  const issues = useIssues();
  const months = useArchiveMonths();
  const error = issues.error ?? months.error;
  if (error) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">Archives</h1>
        <ErrorState
          error={error}
          onRetry={() => {
            void issues.refetch();
            void months.refetch();
          }}
        />
      </div>
    );
  }
  return <ArchivesView issues={issues.data} months={months.data} />;
}

/** /archives/2026-10 — every live article from one month. */
export function ArchiveMonthPage() {
  const { month = '' } = useParams();
  const [params] = useSearchParams();
  const page = parsePage(params.get('page'));
  const range = monthRange(month);
  const label = range ? monthLabel(month) : null;
  useDocumentTitle(label ? `Archives: ${label}` : 'Page not found');

  const query = useQuery({
    queryKey: ['archive-month', month, page],
    enabled: Boolean(range),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await liveCards({ count: 'exact' })
        .gte('published_at', range![0])
        .lt('published_at', range![1])
        .order('published_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: (data ?? []).map(toStoryItem), total: count ?? 0 };
    },
  });

  if (!range) return <NotFoundPage />;
  if (query.isPending) return <SectionSkeleton />;
  if (query.error) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">{label}</h1>
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }
  return (
    <SectionView
      title={label!}
      description="Stories published this month, newest first."
      items={query.data.items}
      page={page}
      pageCount={Math.max(1, Math.ceil(query.data.total / PAGE_SIZE))}
      total={query.data.total}
      loading={query.isPlaceholderData}
    />
  );
}
