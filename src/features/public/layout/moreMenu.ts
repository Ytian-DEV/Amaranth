import { useQuery } from '@tanstack/react-query';
import { CircleHelp, FlaskConical, Megaphone, Newspaper, Search, Smartphone, type LucideIcon } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/env';
import { unwrap } from '@/lib/supabase';
import { liveCards } from '../articles';

type MenuMeta = { icon: LucideIcon; label?: string; blurb: string };

/** Icon, short label and one-line pitch for each "More" section (Figma 42:1077). */
export const moreMeta: Record<string, MenuMeta> = {
  'science-technology': { icon: FlaskConical, label: 'S&T', blurb: 'Research from VSU labs and the tech shaping campus life.' },
  investigative: { icon: Search, blurb: 'Months-long reporting, backed by documents.' },
  explainer: { icon: CircleHelp, blurb: 'Campus policies, explained simply.' },
  bulletin: { icon: Megaphone, blurb: 'Official notices, deadlines and advisories.' },
  stories: { icon: Smartphone, blurb: 'Tap-through visual stories for your phone.' },
};

export const menuMeta = (slug: string, description?: string | null): MenuMeta =>
  moreMeta[slug] ?? { icon: Newspaper, blurb: description ?? '' };

export const alsoLinks = [
  { to: '/salingkusog', label: 'Salingkusog 2026' },
  { to: '/literary', label: 'The Literary Folio' },
  { to: '/archives', label: 'Archives' },
  { to: '/editorial-board', label: 'Editorial Board' },
  { to: '/submit', label: 'Submit a Story' },
];

export type MenuLatest = Record<string, { title: string; slug: string }>;

/** Newest live story in each section, fetched the first time the menu opens. */
export function useMenuLatest(slugs: string[], enabled: boolean) {
  return useQuery({
    queryKey: ['menu-latest', slugs],
    enabled: enabled && isSupabaseConfigured && slugs.length > 0,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<MenuLatest> => {
      const rows = await Promise.all(
        slugs.map((s) =>
          liveCards()
            .eq('section_slug', s)
            .order('published_at', { ascending: false })
            .limit(1)
            .then(unwrap),
        ),
      );
      const out: MenuLatest = {};
      rows.forEach((r, i) => {
        if (r[0]) out[slugs[i]] = { title: r[0].title, slug: r[0].slug };
      });
      return out;
    },
  });
}
