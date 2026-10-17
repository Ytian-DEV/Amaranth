import { useQuery } from '@tanstack/react-query';
import type { NavPlacement } from '@/lib/database.types';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabase, unwrap } from '@/lib/supabase';

export type NavSection = { slug: string; name: string; nav_placement: NavPlacement; nav_order: number };

/** Mirrors supabase/v2/seed.sql so navigation renders before (or without) the database. */
export const defaultSections: NavSection[] = [
  { slug: 'news', name: 'News', nav_placement: 'primary', nav_order: 1 },
  { slug: 'sports', name: 'Sports', nav_placement: 'primary', nav_order: 2 },
  { slug: 'feature', name: 'Feature', nav_placement: 'primary', nav_order: 3 },
  { slug: 'literary', name: 'Literary', nav_placement: 'primary', nav_order: 4 },
  { slug: 'blogs', name: 'Blogs', nav_placement: 'primary', nav_order: 5 },
  { slug: 'specials', name: 'Specials', nav_placement: 'primary', nav_order: 6 },
  { slug: 'views', name: 'Views', nav_placement: 'primary', nav_order: 7 },
  { slug: 'science-technology', name: 'Science & Technology', nav_placement: 'more', nav_order: 8 },
  { slug: 'investigative', name: 'Investigative', nav_placement: 'more', nav_order: 9 },
  { slug: 'explainer', name: 'Explainer', nav_placement: 'more', nav_order: 10 },
  { slug: 'bulletin', name: 'Bulletin', nav_placement: 'more', nav_order: 11 },
  { slug: 'stories', name: 'Stories', nav_placement: 'more', nav_order: 12 },
];

export const sectionPath = (slug: string) => `/${slug}`;

export const publicationLinks = [
  { to: '/about', label: 'About Us', short: 'About' },
  { to: '/editorial-board', label: 'Editorial Board', short: 'Editorial Board' },
  { to: '/archives', label: 'Archives', short: 'Archives' },
  { to: '/submit#guidelines', label: 'Submission Guidelines', short: 'Guidelines' },
  { to: '/contact', label: 'Contact Us', short: 'Contact' },
];

export function useNavSections() {
  const query = useQuery({
    queryKey: ['nav-sections'],
    enabled: isSupabaseConfigured,
    staleTime: 30 * 60_000,
    queryFn: async () =>
      unwrap(
        await getSupabase()
          .from('sections')
          .select('slug, name, nav_placement, nav_order')
          .neq('nav_placement', 'hidden')
          .order('nav_order'),
      ),
  });
  const sections = query.data && query.data.length > 0 ? query.data : defaultSections;
  return {
    primary: sections.filter((s) => s.nav_placement === 'primary'),
    more: sections.filter((s) => s.nav_placement === 'more'),
    all: sections,
  };
}
