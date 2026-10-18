import type { StoryItem } from '@/components/story/types';
import type { MostReadRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

/** Now, rounded down to the minute, so every reader in the same minute sends the same (cacheable) query. */
export const liveCutoff = (now = Date.now()) => new Date(now - (now % 60_000)).toISOString();

/** article_cards limited to live rows (RLS already does this for readers; staff also see drafts). */
export function liveCards(options?: { count?: 'exact' }) {
  return getSupabase()
    .from('article_cards')
    .select('*', options)
    .in('status', ['published', 'scheduled'])
    .lte('published_at', liveCutoff());
}

export function mostReadToStory(row: MostReadRow): StoryItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    label: row.category_name || row.section_name,
    publishedAt: row.published_at,
  };
}
