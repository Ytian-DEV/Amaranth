import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ArticleStatus, DashboardStats } from '@/lib/database.types';
import { getSupabase, unwrap } from '@/lib/supabase';

export type RecentArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: ArticleStatus;
  date: string;
};

export type QueueItem = {
  id: string;
  kind: 'submission' | 'event';
  title: string;
  from: string;
  createdAt: string;
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    refetchInterval: 120_000,
    queryFn: async () => {
      const started = performance.now();
      const stats = unwrap(await getSupabase().rpc('dashboard_stats')) as DashboardStats;
      return { stats, latencyMs: Math.round(performance.now() - started), fetchedAt: new Date() };
    },
  });
}

export function useRecentArticles() {
  return useQuery({
    queryKey: ['recent-articles'],
    queryFn: async (): Promise<RecentArticle[]> =>
      unwrap(
        await getSupabase()
          .from('article_cards')
          .select('id, title, slug, category_name, status, updated_at, published_at')
          .order('updated_at', { ascending: false })
          .limit(5),
      ).map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        category: r.category_name,
        status: r.status,
        date: r.published_at ?? r.updated_at,
      })),
  });
}

export function useSubmissionQueue(enabled: boolean) {
  return useQuery({
    queryKey: ['submission-queue'],
    enabled,
    queryFn: async (): Promise<QueueItem[]> => {
      const supabase = getSupabase();
      const [subs, events] = await Promise.all([
        supabase
          .from('article_submissions')
          .select('id, title, submitter_name, submitter_affiliation, created_at')
          .in('status', ['submitted', 'reviewing'])
          .order('created_at', { ascending: false })
          .limit(5)
          .then(unwrap),
        supabase
          .from('event_reports')
          .select('id, event_title, organization, created_at')
          .in('status', ['submitted', 'reviewing'])
          .order('created_at', { ascending: false })
          .limit(5)
          .then(unwrap),
      ]);
      return [
        ...subs.map((s) => ({
          id: s.id,
          kind: 'submission' as const,
          title: s.title,
          from: s.submitter_affiliation ? `${s.submitter_name}, ${s.submitter_affiliation}` : s.submitter_name,
          createdAt: s.created_at,
        })),
        ...events.map((e) => ({ id: e.id, kind: 'event' as const, title: `Event: ${e.event_title}`, from: e.organization, createdAt: e.created_at })),
      ]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 4);
    },
  });
}

/** Declines a queued submission or event report (editors). */
export function useDeclineIntake() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (item: Pick<QueueItem, 'id' | 'kind'>) => {
      const supabase = getSupabase();
      const patch = { status: 'declined' as const, reviewed_at: new Date().toISOString() };
      const result =
        item.kind === 'submission'
          ? await supabase.from('article_submissions').update(patch).eq('id', item.id)
          : await supabase.from('event_reports').update(patch).eq('id', item.id);
      unwrap(result);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['submission-queue'] });
      void client.invalidateQueries({ queryKey: ['pending-intake'] });
      void client.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
