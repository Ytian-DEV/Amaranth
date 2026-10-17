import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { canManageSkTeam } from '@/features/auth/permissions';
import type { Database, ProfileRow, SkMatchRow, SkPlacementInput, SkTeamRow } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { safeFileName } from '@/lib/images';
import { getSupabase, unwrap, unwrapMaybe } from '@/lib/supabase';

const sb = () => getSupabase();

export type SkStaff = Pick<ProfileRow, 'id' | 'display_name' | 'email' | 'role' | 'is_active' | 'avatar_url'>;
export type SkTeamMember = SkStaff & Pick<SkTeamRow, 'added_by' | 'created_at'> & { addedByName: string | null };

/** Is the signed-in user on the Salingkusog team? (false while loading, or before salingkusog.sql is applied) */
export function useOnSkTeam() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['sk-team', 'me', profile?.id],
    enabled: !!profile,
    retry: false,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await sb().from('sk_team').select('profile_id').eq('profile_id', profile!.id).maybeSingle();
      if (res.error) return false;
      return !!unwrapMaybe(res);
    },
  });
}

export type SkTeamData = {
  members: SkTeamMember[];
  /** active staff who always have access through their role */
  managers: SkStaff[];
  /** active staff who could be added */
  candidates: SkStaff[];
};

/** Splits staff into team members, the managing roles and everyone else who could be added. */
export function buildTeam(staff: SkStaff[], team: SkTeamRow[]): SkTeamData {
  const byId = new Map(staff.map((s) => [s.id, s]));
  const onTeam = new Set(team.map((t) => t.profile_id));
  const members = team
    .flatMap((t) => {
      const p = byId.get(t.profile_id);
      return p ? [{ ...p, added_by: t.added_by, created_at: t.created_at, addedByName: t.added_by ? (byId.get(t.added_by)?.display_name ?? null) : null }] : [];
    })
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
  const managers = staff.filter((s) => s.is_active && canManageSkTeam(s.role));
  const candidates = staff.filter((s) => s.is_active && !canManageSkTeam(s.role) && !onTeam.has(s.id));
  return { members, managers, candidates };
}

export function useSkTeam() {
  return useQuery({
    queryKey: ['sk-team', 'all'],
    queryFn: async (): Promise<SkTeamData> => {
      const [staff, team] = await Promise.all([
        sb().from('profiles').select('id, display_name, email, role, is_active, avatar_url').order('display_name').then(unwrap),
        sb().from('sk_team').select('*').then(unwrap),
      ]);
      return buildTeam(staff, team);
    },
  });
}

export function useAddSkTeamMember() {
  const client = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (profileId: string) => unwrap(await sb().from('sk_team').insert({ profile_id: profileId, added_by: profile?.id ?? null })),
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk-team'] }),
  });
}

export function useRemoveSkTeamMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => unwrap(await sb().from('sk_team').delete().eq('profile_id', profileId)),
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk-team'] }),
  });
}

// ---------------------------------------------------------------- setup (A3)

/** Friendlier messages for the constraint errors staff can hit while setting up. */
export function skErrorText(err: unknown): string {
  const e = err as { code?: string; message?: string; details?: string } | null;
  if (e?.code === '23505') {
    if (e.message?.includes('sk_editions_one_current')) return 'Another edition is already current; it will be switched off first. Try again.';
    if (e.message?.includes('year')) return 'There is already an edition for that year.';
    if (e.message?.includes('sk_awards_one_per_day')) return 'That award has already been given for this day. Edit the existing one instead.';
    if (e.message?.includes('sk_placements_unique')) return 'The same faction or athlete is listed twice for one place.';
    return 'That short web name (slug) is already used in this edition. Change it and try again.';
  }
  if (e?.code === '23514') return 'Some values are out of range. Check the dates, colour (#RRGGBB) and map position (0–100).';
  return errorText(err) ?? 'Couldn’t save.';
}

export function useSkEditions() {
  return useQuery({
    queryKey: ['sk', 'sk_editions'],
    queryFn: async () => unwrap(await sb().from('sk_editions').select('*').order('year', { ascending: false })),
  });
}

export type SkSetupTable = 'sk_editions' | 'sk_factions' | 'sk_venues' | 'sk_sports' | 'sk_events' | 'sk_athletes' | 'sk_awards';
type Tables = Database['public']['Tables'];
export type SkRowOf<T extends SkSetupTable> = Tables[T]['Row'];
export type SkInsertOf<T extends SkSetupTable> = Tables[T]['Insert'];

/** All rows of one setup table for an edition, ordered for the CMS lists. */
export function useSkRows<T extends Exclude<SkSetupTable, 'sk_editions' | 'sk_awards'>>(table: T, editionId: string | undefined) {
  return useQuery({
    queryKey: ['sk', table, editionId],
    enabled: !!editionId,
    queryFn: async () => {
      // athletes have no sort_order: alphabetical
      const q = sb().from(table as 'sk_venues').select('*').eq('edition_id', editionId!);
      return unwrap(await (table === 'sk_athletes' ? q.order('name') : q.order('sort_order').order('name'))) as unknown as SkRowOf<T>[];
    },
  });
}

/** Insert (no id) or update (id) one setup row. */
export function useSaveSkRow<T extends SkSetupTable>(table: T) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: SkInsertOf<T> & { id?: string }) => {
      const q = sb().from(table as 'sk_venues');
      return id
        ? unwrap(await q.update(values as never).eq('id', id).select('id').single())
        : unwrap(await q.insert(values as never).select('id').single());
    },
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk'] }),
  });
}

export function useDeleteSkRow(table: SkSetupTable) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await sb().from(table as 'sk_venues').delete().eq('id', id)),
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk'] }),
  });
}

/** Media assets by id (logos, venue map). */
export function useMediaByIds(ids: (string | null | undefined)[]) {
  const list = [...new Set(ids.filter((x): x is string => !!x))].sort();
  return useQuery({
    queryKey: ['media-by-id', list],
    enabled: list.length > 0,
    queryFn: async () => unwrap(await sb().from('media_assets').select('*').in('id', list)),
  });
}

/** Existing games of an edition (to skip duplicates when importing). */
export function useSkMatchKeys(editionId: string | undefined) {
  return useQuery({
    queryKey: ['sk', 'sk_matches', editionId, 'keys'],
    enabled: !!editionId,
    queryFn: async () => unwrap(await sb().from('sk_matches').select('event_id, scheduled_at, side_a_id, side_b_id').eq('edition_id', editionId!)),
  });
}

export function useImportMatches() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Tables['sk_matches']['Insert'][]) => unwrap(await sb().from('sk_matches').insert(rows).select('id')),
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk'] }),
  });
}

// ---------------------------------------------------------------- scorekeeping (A4)

export function useSkMatches(editionId: string | undefined) {
  return useQuery({
    queryKey: ['sk', 'sk_matches', editionId],
    enabled: !!editionId,
    queryFn: async () => unwrap(await sb().from('sk_matches').select('*').eq('edition_id', editionId!).order('scheduled_at')),
  });
}

export function useSkMatch(id: string | undefined) {
  return useQuery({
    queryKey: ['sk', 'sk_matches', 'one', id],
    enabled: !!id,
    queryFn: async () => unwrapMaybe(await sb().from('sk_matches').select('*').eq('id', id!).maybeSingle()),
  });
}

type MatchPatch = Tables['sk_matches']['Update'];

/** Patch one game; the cached row is updated right away so taps feel instant. */
export function useUpdateMatch(id: string) {
  const client = useQueryClient();
  const key = ['sk', 'sk_matches', 'one', id];
  return useMutation({
    mutationFn: async (patch: MatchPatch) => unwrap(await sb().from('sk_matches').update(patch).eq('id', id).select('*').single()),
    onMutate: (patch) => {
      const prev = client.getQueryData<SkMatchRow | null>(key);
      if (prev) client.setQueryData(key, { ...prev, ...patch });
      return { prev };
    },
    onError: (_e, _p, ctx) => ctx?.prev && client.setQueryData(key, ctx.prev),
    onSuccess: (row) => client.setQueryData(key, row),
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk', 'sk_matches'], exact: false, refetchType: 'none' }),
  });
}

export function useCreateMatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (row: Tables['sk_matches']['Insert']) => unwrap(await sb().from('sk_matches').insert(row).select('id').single()),
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk', 'sk_matches'] }),
  });
}

export function useDeleteMatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await sb().from('sk_matches').delete().eq('id', id)),
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk', 'sk_matches'] }),
  });
}

/**
 * Keeps one game in sync with other scorekeepers (Supabase Realtime).
 * `isEditing` pauses incoming updates while this screen has unsaved taps.
 */
export function useMatchRealtime(id: string | undefined, isEditing: () => boolean) {
  const client = useQueryClient();
  useEffect(() => {
    if (!id) return;
    let channel: ReturnType<ReturnType<typeof sb>['channel']> | null = null;
    try {
      channel = sb()
        .channel(`sk-match-${id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sk_matches', filter: `id=eq.${id}` }, (payload) => {
          if (!isEditing()) client.setQueryData(['sk', 'sk_matches', 'one', id], payload.new as SkMatchRow);
        })
        .subscribe();
    } catch {
      /* Supabase not configured (fixtures) */
    }
    return () => {
      if (channel) void sb().removeChannel(channel);
    };
  }, [id, client, isEditing]);
}

export function useAthleteStats(matchId: string | undefined) {
  return useQuery({
    queryKey: ['sk', 'sk_athlete_stats', matchId],
    enabled: !!matchId,
    queryFn: async () => unwrap(await sb().from('sk_athlete_stats').select('*').eq('match_id', matchId!)),
  });
}

export function useSaveAthleteStats(matchId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: { athlete_id: string; stats: Record<string, number | string> | null }) =>
      p.stats
        ? unwrap(await sb().from('sk_athlete_stats').upsert({ match_id: matchId, athlete_id: p.athlete_id, stats: p.stats }))
        : unwrap(await sb().from('sk_athlete_stats').delete().eq('match_id', matchId).eq('athlete_id', p.athlete_id)),
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk', 'sk_athlete_stats', matchId] }),
  });
}

export function useSkPlacements(editionId: string | undefined) {
  return useQuery({
    queryKey: ['sk', 'sk_placements', editionId],
    enabled: !!editionId,
    queryFn: async () => unwrap(await sb().from('sk_placements').select('*').eq('edition_id', editionId!).order('place')),
  });
}

/** Replace an event's results (one transaction, medals from the place). */
export function useSetPlacements(eventId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (rows: SkPlacementInput[]) => unwrap(await sb().rpc('sk_set_placements', { p_event_id: eventId, p_rows: rows })),
    onSettled: () => void client.invalidateQueries({ queryKey: ['sk'] }),
  });
}

export function useSkAwards(editionId: string | undefined) {
  return useQuery({
    queryKey: ['sk', 'sk_awards', editionId],
    enabled: !!editionId,
    queryFn: async () => unwrap(await sb().from('sk_awards').select('*').eq('edition_id', editionId!).order('day', { ascending: false })),
  });
}

/** Upload the printable schedule to the public "archives" bucket (publishers only, like print issues). */
export async function uploadSchedulePdf(file: File, uploadedBy: string, year: number) {
  if (file.type !== 'application/pdf') throw new Error('Choose a PDF file.');
  if (file.size > 60 * 1024 * 1024) throw new Error('The PDF is larger than 60 MB.');
  const path = `salingkusog/${year}/schedule-${crypto.randomUUID().slice(0, 8)}-${safeFileName(file.name)}`;
  const up = await sb().storage.from('archives').upload(path, file, { contentType: 'application/pdf', cacheControl: '3600' });
  if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
  return unwrap(
    await sb()
      .from('media_assets')
      .insert({ bucket: 'archives', path, kind: 'document', mime_type: 'application/pdf', size_bytes: file.size, alt_text: `Salingkusog ${year} schedule`, caption: file.name, uploaded_by: uploadedBy })
      .select('*')
      .single(),
  );
}
