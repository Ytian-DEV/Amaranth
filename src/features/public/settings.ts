import { useQuery } from '@tanstack/react-query';
import type { Json } from '@/lib/database.types';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabase, unwrap } from '@/lib/supabase';

export type SocialLink = { platform: string; label: string; url: string };
export type TickerSetting = { mode: 'latest' | 'manual'; count: number; items: { text: string; href?: string }[] };

export const defaultSocial: SocialLink[] = [
  { platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/amaranthvsu' },
  { platform: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@amaranthvsu' },
  { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/amaranthvsu' },
  { platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@amaranthvsu' },
];

/** All public site settings as a key → value map (cached for the session). */
export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    enabled: isSupabaseConfigured,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const rows = unwrap(await getSupabase().from('site_settings').select('key, value').eq('is_public', true));
      return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, Json>;
    },
  });
}

export function useSocialLinks(): SocialLink[] {
  const { data } = useSiteSettings();
  const value = data?.social_links;
  // only web links (a javascript: or data: URL saved in Settings would run on click)
  const links = Array.isArray(value) ? (value as unknown as SocialLink[]).filter((l) => typeof l?.url === 'string' && /^https?:\/\//i.test(l.url)) : [];
  return links.length ? links : defaultSocial;
}
