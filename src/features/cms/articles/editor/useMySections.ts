import { useQuery } from '@tanstack/react-query';
import { getSupabase, unwrap } from '@/lib/supabase';

/** Section ids a section editor looks after (profile_sections). */
export function useMySections(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-sections', userId],
    enabled: Boolean(userId),
    staleTime: 10 * 60_000,
    queryFn: async () =>
      unwrap(await getSupabase().from('profile_sections').select('section_id').eq('profile_id', userId!)).map((r) => r.section_id),
  });
}
