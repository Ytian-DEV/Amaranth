import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { trackerStatus } from '../analytics/tracker';

/**
 * Fallback view counter: the statistics tracker (/api/e) normally counts article views. Only when
 * /api/e is not set up yet does this count one view per article per browser session, as before.
 */
export function useRecordView(articleId: string | undefined, live: boolean) {
  useEffect(() => {
    if (!articleId || !live) return;
    let cancelled = false;
    void trackerStatus().then((status) => {
      if (cancelled || status !== 'legacy') return;
      countView(articleId);
    });
    return () => {
      cancelled = true;
    };
  }, [articleId, live]);
}

function countView(articleId: string) {
  const key = `amaranth:viewed:${articleId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // storage blocked: still count, at most once per page load
  }
  void getSupabase()
    .rpc('record_article_view', { p_article_id: articleId })
    .then(() => undefined);
}
