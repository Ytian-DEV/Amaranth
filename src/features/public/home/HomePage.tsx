import { ErrorState } from '@/components/ui/Feedback';
import { usePageMeta } from '@/lib/usePageMeta';
import { HomeSkeleton, HomeView } from './HomeView';
import { useHomeData } from './homeData';

export function HomePage() {
  usePageMeta({ title: null, path: '/' });
  const { data, error, isPending, refetch } = useHomeData();

  if (isPending) return <HomeSkeleton />;
  if (error) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">Amaranth</h1>
        <ErrorState title="We couldn’t load the front page" error={error} onRetry={() => void refetch()} />
      </div>
    );
  }
  return <HomeView data={data} />;
}
