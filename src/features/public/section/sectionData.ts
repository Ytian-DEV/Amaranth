import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { toStoryItem, type StoryItem } from '@/components/story/types';
import type { CategoryRow, SectionRow } from '@/lib/database.types';
import { getSupabase, unwrap, unwrapMaybe } from '@/lib/supabase';

export const PAGE_SIZE = 12;

export type SectionInfo = {
  section: Pick<SectionRow, 'id' | 'slug' | 'name' | 'description'>;
  categories: Pick<CategoryRow, 'id' | 'slug' | 'name'>[];
};

export type ArticlePage = { items: StoryItem[]; total: number; pageCount: number };

export function useSectionInfo(slug: string) {
  return useQuery({
    queryKey: ['section', slug],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<SectionInfo | null> => {
      const supabase = getSupabase();
      const section = unwrapMaybe(
        await supabase.from('sections').select('id, slug, name, description').eq('slug', slug).maybeSingle(),
      );
      if (!section) return null;
      const categories = unwrap(
        await supabase
          .from('categories')
          .select('id, slug, name')
          .eq('section_id', section.id)
          .eq('is_active', true)
          .order('sort_order'),
      );
      return { section, categories };
    },
  });
}

/** One page of live articles, newest first; `section` null = every section. */
export function useArticlePage({ section, category, page }: { section: string | null; category?: string | null; page: number }) {
  return useQuery({
    queryKey: ['article-page', section, category ?? null, page],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ArticlePage> => {
      const from = (page - 1) * PAGE_SIZE;
      let query = getSupabase()
        .from('article_cards')
        .select('*', { count: 'exact' })
        .in('status', ['published', 'scheduled'])
        .lte('published_at', new Date().toISOString());
      if (section) query = query.eq('section_slug', section);
      if (category) query = query.eq('category_slug', category);
      const { data, error, count } = await query
        .order('published_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      const total = count ?? 0;
      return { items: (data ?? []).map(toStoryItem), total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
    },
  });
}
