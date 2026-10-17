import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MediaAssetRow } from '@/lib/database.types';
import { getSupabase, unwrap } from '@/lib/supabase';

export const MEDIA_PAGE_SIZE = 24;

export type MediaFilters = { q: string; mine: boolean; page: number };

export function useMediaList(filters: MediaFilters, userId: string | undefined) {
  return useQuery({
    queryKey: ['media', filters, userId],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const from = (filters.page - 1) * MEDIA_PAGE_SIZE;
      let query = getSupabase().from('media_assets').select('*', { count: 'exact' }).eq('kind', 'image');
      const q = filters.q.trim().replace(/[%_,()]/g, '');
      if (q) query = query.or(`alt_text.ilike.%${q}%,caption.ilike.%${q}%,credit.ilike.%${q}%,path.ilike.%${q}%`);
      if (filters.mine && userId) query = query.eq('uploaded_by', userId);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + MEDIA_PAGE_SIZE - 1);
      if (error) throw error;
      return { items: (data ?? []) as MediaAssetRow[], total: count ?? 0 };
    },
  });
}

export function useMediaUsage(assetId: string | undefined) {
  return useQuery({
    queryKey: ['media-usage', assetId],
    enabled: Boolean(assetId),
    queryFn: async () => unwrap(await getSupabase().rpc('media_usage', { p_asset_id: assetId! })),
  });
}

export function useUpdateMedia() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: Pick<MediaAssetRow, 'id' | 'alt_text' | 'caption' | 'credit'>) =>
      unwrap(
        await getSupabase()
          .from('media_assets')
          .update({ alt_text: p.alt_text, caption: p.caption, credit: p.credit })
          .eq('id', p.id)
          .select('*')
          .single(),
      ),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['media'] }),
  });
}

/** Deletes the record first (foreign keys refuse if it's in use), then its files. */
export function useDeleteMedia() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (asset: MediaAssetRow) => {
      const supabase = getSupabase();
      unwrap(await supabase.from('media_assets').delete().eq('id', asset.id));
      const paths = [asset.path, ...asset.variants.map((v) => v.path)];
      await supabase.storage.from(asset.bucket).remove(paths);
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['media'] }),
  });
}
