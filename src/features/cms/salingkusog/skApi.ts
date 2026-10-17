import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { canManageSkTeam } from '@/features/auth/permissions';
import type { ProfileRow, SkTeamRow } from '@/lib/database.types';
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
