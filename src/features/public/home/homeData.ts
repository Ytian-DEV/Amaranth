import { useQuery } from '@tanstack/react-query';
import { toStoryItem, type StoryItem } from '@/components/story/types';
import type { HomeSlotRow } from '@/lib/database.types';
import { getSupabase, unwrap, unwrapMaybe } from '@/lib/supabase';
import { liveCards, mostReadToStory } from '../articles';
import type { TickerSetting } from '../settings';

export type TickerItem = { text: string; href?: string };

export type HomeData = {
  ticker: TickerItem[];
  lead: StoryItem | null;
  latest: StoryItem[];
  mostRead: StoryItem[];
  folio: {
    quote: string | null;
    attribution: string | null;
    href: string;
    items: StoryItem[];
  } | null;
  sports: StoryItem[];
  views: StoryItem[];
};

const newest = { ascending: false } as const;

export async function fetchHome(): Promise<HomeData> {
  const supabase = getSupabase();
  const [latestRows, slots, mostReadRows, sportsRows, viewsRows, literaryRows, tickerSetting] = await Promise.all([
    liveCards().order('published_at', newest).limit(10).then(unwrap),
    supabase.from('home_slots').select('*').then(unwrap),
    supabase.rpc('most_read_articles', { p_days: 7, p_limit: 4 }, { get: true }).then(unwrap),
    liveCards().eq('section_slug', 'sports').order('published_at', newest).limit(3).then(unwrap),
    liveCards().eq('section_slug', 'views').order('published_at', newest).limit(3).then(unwrap),
    liveCards().eq('section_slug', 'literary').order('published_at', newest).limit(3).then(unwrap),
    supabase.from('site_settings').select('value').eq('key', 'ticker').maybeSingle().then(unwrapMaybe),
  ]);

  const slot = (name: HomeSlotRow['slot']) => (slots as HomeSlotRow[]).find((s) => s.slot === name);
  const leadId = slot('lead')?.article_id;
  let leadRow = latestRows.find((r) => r.id === leadId);
  if (leadId && !leadRow) {
    leadRow = (await liveCards().eq('id', leadId).maybeSingle().then(unwrapMaybe)) ?? undefined;
  }
  leadRow ??= latestRows.find((r) => r.is_featured) ?? latestRows[0];

  const latest = latestRows.filter((r) => r.id !== leadRow?.id).map(toStoryItem);

  let mostRead = mostReadRows.map(mostReadToStory);
  if (mostRead.length === 0) mostRead = latest.slice(3, 7);

  const ticker = tickerSetting?.value as TickerSetting | undefined;
  const tickerItems: TickerItem[] =
    ticker?.mode === 'manual' && ticker.items?.length
      ? ticker.items
      : latestRows.slice(0, ticker?.count ?? 3).map((r) => ({ text: r.title, href: `/article/${r.slug}` }));

  const folioSlot = slot('folio');
  const folioItems = literaryRows.map(toStoryItem);
  const folio =
    folioItems.length || folioSlot?.pull_quote
      ? {
          quote: folioSlot?.pull_quote ?? null,
          attribution: folioSlot?.attribution ?? null,
          href: '/literary',
          items: folioItems,
        }
      : null;

  return {
    ticker: tickerItems,
    lead: leadRow ? toStoryItem(leadRow) : null,
    latest: latest.slice(0, 3),
    mostRead,
    folio,
    sports: sportsRows.map(toStoryItem),
    views: viewsRows.map(toStoryItem),
  };
}

export function useHomeData() {
  return useQuery({ queryKey: ['home'], queryFn: fetchHome });
}
