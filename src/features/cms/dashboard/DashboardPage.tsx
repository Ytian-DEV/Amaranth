import { useAuth } from '@/features/auth/AuthProvider';
import { isEditor } from '@/features/auth/permissions';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { DashboardView } from './DashboardView';
import { useDashboardStats, useDeclineIntake, useRecentArticles, useSubmissionQueue } from './dashboardData';

export function DashboardPage() {
  useDocumentTitle('Newsroom');
  const { profile } = useAuth();
  const canReview = isEditor(profile?.role);
  const stats = useDashboardStats();
  const recent = useRecentArticles();
  const queue = useSubmissionQueue(canReview);
  const decline = useDeclineIntake();

  return (
    <DashboardView
      name={profile?.display_name ?? 'Editor'}
      canReview={canReview}
      stats={stats.data?.stats}
      statsError={stats.error}
      recent={recent.data}
      recentError={recent.error}
      queue={queue.data}
      onDecline={(item) => decline.mutate(item)}
      db={{ ok: !stats.error, latencyMs: stats.data?.latencyMs, fetchedAt: stats.data?.fetchedAt }}
      onRetry={() => {
        void stats.refetch();
        void recent.refetch();
      }}
    />
  );
}
