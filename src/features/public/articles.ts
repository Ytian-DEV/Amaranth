import type { StoryItem } from '@/components/story/types';
import type { MostReadRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

/** article_cards limited to live rows (RLS already does this for readers; staff also see drafts). */
export function liveCards() {
  return getSupabase()
    .from('article_cards')
    .select('*')
    .in('status', ['published', 'scheduled'])
    .lte('published_at', new Date().toISOString());
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
