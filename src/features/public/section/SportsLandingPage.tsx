import { hubPhase } from '@/features/public/salingkusog/hub';
import { useCurrentEdition, useHubData, useLiveGames, useSpotlight, useStandings } from '@/features/public/salingkusog/skData';
import type { StoryItem } from '@/components/story/types';
import { SportsLanding, type SportsSalingkusog } from './SportsLanding';

/** /sports, first page, all categories: the sports front with the Salingkusog block (when an edition is visible). */
export function SportsLandingPage({ categories, items, hasMore }: { categories: { slug: string; name: string }[]; items: StoryItem[]; hasMore: boolean }) {
  const edition = useCurrentEdition();
  const ed = edition.data ?? undefined;
  const hub = useHubData(ed?.id);
  const standings = useStandings(ed?.id);
  const spotlight = useSpotlight(ed?.id);
  useLiveGames(ed?.id);
  // Salingkusog is extra: if it fails or is still loading, the stories still show
  const sk: SportsSalingkusog | null =
    ed && hub.data && standings.data ? { edition: ed, hub: hub.data, table: standings.data.table, phase: hubPhase(ed), spotlight: spotlight.data ?? null } : null;
  return <SportsLanding categories={categories} items={items} hasMore={hasMore} sk={sk} />;
}
