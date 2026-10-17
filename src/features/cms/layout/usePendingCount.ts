import { useQuery } from '@tanstack/react-query';
import { getSupabase, unwrap } from '@/lib/supabase';

/** Submissions + event reports waiting for an editor (sidebar badge). */
export function usePendingCount(enabled: boolean) {
  return useQuery({
    queryKey: ['pending-intake'],
    enabled,
    refetchInterval: 120_000,
    queryFn: async () => {
      const supabase = getSupabase();
      const [subs, events] = await Promise.all([
        supabase.from('article_submissions').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'reviewing']),
        supabase.from('event_reports').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'reviewing']),
      ]);
      unwrap(subs);
      unwrap(events);
      return (subs.count ?? 0) + (events.count ?? 0);
    },
  });
}
