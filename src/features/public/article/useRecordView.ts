import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';

/** Counts one view per article per browser session (live articles only). */
export function useRecordView(articleId: string | undefined, live: boolean) {
  useEffect(() => {
    if (!articleId || !live) return;
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
  }, [articleId, live]);
}
