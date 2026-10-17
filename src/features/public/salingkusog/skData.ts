import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { MediaAssetRow, SkEditionRow, SkEventRow, SkFactionRow, SkMatchRow, SkMedalTableRow, SkPointsByDayRow, SkSportRow, SkVenueRow } from '@/lib/database.types';
import { getSupabase, unwrap, unwrapMaybe } from '@/lib/supabase';

const sb = () => getSupabase();
const LIVE_REFRESH = 60_000;

/** The edition the site shows (readers only see it once it is published). */
export function useCurrentEdition() {
  return useQuery({
    queryKey: ['sk-public', 'edition'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SkEditionRow | null> =>
      unwrapMaybe(await sb().from('sk_editions').select('*').eq('is_current', true).maybeSingle()) ??
      unwrapMaybe(await sb().from('sk_editions').select('*').order('year', { ascending: false }).limit(1).maybeSingle()),
  });
}

export type HubData = {
  factions: SkFactionRow[];
  sports: SkSportRow[];
  events: SkEventRow[];
  venues: SkVenueRow[];
  logos: MediaAssetRow[];
  matches: SkMatchRow[];
};

/** Names, colours and games every Salingkusog page needs. */
export function useHubData(editionId: string | undefined) {
  return useQuery({
    queryKey: ['sk-public', 'hub', editionId],
    enabled: !!editionId,
    refetchInterval: LIVE_REFRESH,
    queryFn: async (): Promise<HubData> => {
      const id = editionId!;
      const [factions, sports, events, venues, matches] = await Promise.all([
        sb().from('sk_factions').select('*').eq('edition_id', id).order('sort_order').then(unwrap),
        sb().from('sk_sports').select('*').eq('edition_id', id).order('sort_order').then(unwrap),
        sb().from('sk_events').select('*').eq('edition_id', id).order('sort_order').then(unwrap),
        sb().from('sk_venues').select('*').eq('edition_id', id).order('sort_order').then(unwrap),
        sb().from('sk_matches').select('*').eq('edition_id', id).order('scheduled_at').then(unwrap),
      ]);
      const logoIds = factions.map((f) => f.logo_asset_id).filter((x): x is string => !!x);
      const logos = logoIds.length ? unwrap(await sb().from('media_assets').select('*').in('id', logoIds)) : [];
      return { factions, sports, events, venues, logos, matches };
    },
  });
}

export function useStandings(editionId: string | undefined) {
  return useQuery({
    queryKey: ['sk-public', 'standings', editionId],
    enabled: !!editionId,
    refetchInterval: LIVE_REFRESH,
    queryFn: async (): Promise<{ table: SkMedalTableRow[]; race: SkPointsByDayRow[] }> => {
      const [table, race] = await Promise.all([
        sb().from('sk_medal_table').select('*').eq('edition_id', editionId!).order('rank').then(unwrap),
        sb().from('sk_points_by_day').select('*').eq('edition_id', editionId!).order('day').then(unwrap),
      ]);
      return { table, race };
    },
  });
}

/** Live scores: refresh the hub when any game of the edition changes (Supabase Realtime). */
export function useLiveGames(editionId: string | undefined) {
  const client = useQueryClient();
  useEffect(() => {
    if (!editionId) return;
    let channel: ReturnType<ReturnType<typeof sb>['channel']> | null = null;
    try {
      channel = sb()
        .channel(`sk-public-${editionId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sk_matches', filter: `edition_id=eq.${editionId}` }, () => {
          void client.invalidateQueries({ queryKey: ['sk-public', 'hub', editionId] });
        })
        .subscribe();
    } catch {
      /* not configured (fixtures) */
    }
    return () => {
      if (channel) void sb().removeChannel(channel);
    };
  }, [editionId, client]);
}
