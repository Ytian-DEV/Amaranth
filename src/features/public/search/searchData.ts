import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { toStoryItem, type StoryItem } from '@/components/story/types';
import { getSupabase, unwrap, unwrapMaybe, pastLastPage } from '@/lib/supabase';
import { liveCards } from '../articles';

export const SEARCH_PAGE_SIZE = 10;

export type SearchFilters = {
  q: string;
  section: string | null;
  from: string | null;
  to: string | null;
  tag: string | null;
  page: number;
};

export type SearchResult = { items: StoryItem[]; total: number; pageCount: number; tagName?: string | null };

async function searchByText(f: SearchFilters): Promise<SearchResult> {
  const rows = unwrap(
    await getSupabase().rpc('search_articles', {
      p_query: f.q,
      p_section: f.section,
      p_from: f.from,
      p_to: f.to,
      p_limit: SEARCH_PAGE_SIZE,
      p_offset: (f.page - 1) * SEARCH_PAGE_SIZE,
      p_live_only: true,
    }),
  );
  const total = rows[0]?.total_count ?? 0;
  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)),
    items: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      label: r.category_name && r.category_name !== r.section_name ? `${r.section_name} · ${r.category_name}` : r.section_name,
      excerpt: r.excerpt,
      publishedAt: r.published_at,
      image: r.cover_path ? { bucket: r.cover_bucket, path: r.cover_path, alt: r.cover_alt } : null,
    })),
  };
}

async function searchByTag(f: SearchFilters): Promise<SearchResult> {
  const supabase = getSupabase();
  const tag = unwrapMaybe(await supabase.from('tags').select('id, name').eq('slug', f.tag!).maybeSingle());
  if (!tag) return { items: [], total: 0, pageCount: 1, tagName: null };
  // article_tags is only readable for live articles, so this is already filtered
  const ids = unwrap(await supabase.from('article_tags').select('article_id').eq('tag_id', tag.id)).map((r) => r.article_id);
  if (ids.length === 0) return { items: [], total: 0, pageCount: 1, tagName: tag.name };
  const from = (f.page - 1) * SEARCH_PAGE_SIZE;
  const { data, error, count } = await liveCards({ count: 'exact' })
    .in('id', ids)
    .order('published_at', { ascending: false })
    .range(from, from + SEARCH_PAGE_SIZE - 1);
  if (error && !pastLastPage(error)) throw error;
  const total = count ?? 0;
  return {
    items: (data ?? []).map(toStoryItem),
    total,
    pageCount: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)),
    tagName: tag.name,
  };
}

export const hasCriteria = (f: SearchFilters) => Boolean(f.q.trim() || f.tag || f.section || f.from || f.to);

export function useSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['search', filters],
    enabled: hasCriteria(filters),
    placeholderData: keepPreviousData,
    queryFn: () => (filters.tag ? searchByTag(filters) : searchByText(filters)),
  });
}
