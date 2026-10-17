import { useQuery } from '@tanstack/react-query';
import { toStoryItem, type StoryItem } from '@/components/story/types';
import { getSupabase, unwrap } from '@/lib/supabase';
import { liveCards, mostReadToStory } from '../../articles';

export const LANDING_SIZE = 24;

export type LandingData = { items: StoryItem[]; mostRead: StoryItem[] };

/** The newest live stories in a section, and its most-read ones this month. */
export function useSectionLanding(slug: string, sectionName: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['section-landing', slug],
    enabled: enabled && Boolean(sectionName),
    staleTime: 60_000,
    queryFn: async (): Promise<LandingData> => {
      const [rows, read] = await Promise.all([
        liveCards().eq('section_slug', slug).order('published_at', { ascending: false }).limit(LANDING_SIZE).then(unwrap),
        getSupabase().rpc('most_read_articles', { p_days: 30, p_limit: 40 }).then(unwrap),
      ]);
      return {
        items: rows.map(toStoryItem),
        mostRead: read.filter((r) => r.section_name === sectionName).slice(0, 5).map(mostReadToStory),
      };
    },
  });
}

/** Hands out stories in order without repeating any: `next(3)`, `nextWhere(isPoetry, 1)`, `rest()`. */
export function picker(items: StoryItem[]) {
  const used = new Set<string>();
  const free = () => items.filter((s) => !used.has(s.id));
  const take = (list: StoryItem[]) => {
    list.forEach((s) => used.add(s.id));
    return list;
  };
  return {
    next: (n: number) => take(free().slice(0, n)),
    nextWhere: (pred: (s: StoryItem) => boolean, n: number) => take(free().filter(pred).slice(0, n)),
    rest: () => take(free()),
  };
}

export const inCategory =
  (...slugs: string[]) =>
  (s: StoryItem) =>
    Boolean(s.category && slugs.includes(s.category));
