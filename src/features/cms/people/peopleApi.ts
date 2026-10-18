import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AppRole,
  ContributorRow,
  ContributorType,
  MediaAssetRow,
  ProfileRow,
  StaffInviteRow,
  TeamMemberRow,
  TeamRoleGroup,
  TeamTermRow,
} from '@/lib/database.types';
import { slugify } from '@/lib/slug';
import { getSupabase, unwrap } from '@/lib/supabase';

const sb = () => getSupabase();

// ---------------------------------------------------------------- staff

export type StaffMember = ProfileRow & { sectionIds: string[] };

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async (): Promise<StaffMember[]> => {
      const [profiles, links] = await Promise.all([
        sb().from('profiles').select('*').order('display_name').then(unwrap),
        sb().from('profile_sections').select('profile_id, section_id').then(unwrap),
      ]);
      return profiles.map((p) => ({ ...p, sectionIds: links.filter((l) => l.profile_id === p.id).map((l) => l.section_id) }));
    },
  });
}

export function useSectionsList() {
  return useQuery({
    queryKey: ['sections-list'],
    staleTime: 10 * 60_000,
    queryFn: async () => unwrap(await sb().from('sections').select('id, slug, name').order('nav_order')),
  });
}

export function useUpdateStaff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; role?: AppRole; is_active?: boolean; sectionIds?: string[]; canPublish?: boolean }) => {
      const patch: Partial<ProfileRow> = {};
      if (p.role) patch.role = p.role;
      if (p.is_active !== undefined) patch.is_active = p.is_active;
      if (Object.keys(patch).length) unwrap(await sb().from('profiles').update(patch).eq('id', p.id));
      // through an RPC: the Managing editor can't update other profiles directly
      if (p.canPublish !== undefined) unwrap(await sb().rpc('set_publish_access', { p_profile_id: p.id, p_allowed: p.canPublish }));
      if (p.sectionIds) {
        unwrap(await sb().from('profile_sections').delete().eq('profile_id', p.id));
        if (p.sectionIds.length) {
          unwrap(await sb().from('profile_sections').insert(p.sectionIds.map((section_id) => ({ profile_id: p.id, section_id }))));
        }
      }
    },
    onSettled: () => void client.invalidateQueries({ queryKey: ['staff'] }),
  });
}

// ---------------------------------------------------------------- invites

export function useInvites() {
  return useQuery({
    queryKey: ['invites'],
    queryFn: async (): Promise<StaffInviteRow[]> => unwrap(await sb().from('staff_invites').select('*').order('created_at', { ascending: false })),
  });
}

export function useSaveInvite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: { email: string; role: AppRole; section_slugs: string[]; invited_by: string }) =>
      unwrap(await sb().from('staff_invites').upsert({ ...p, email: p.email.trim().toLowerCase() })),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['invites'] }),
  });
}

export function useDeleteInvite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => unwrap(await sb().from('staff_invites').delete().eq('email', email)),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['invites'] }),
  });
}

// ---------------------------------------------------------------- contributors

export type ContributorWithAvatar = ContributorRow & { avatar: MediaAssetRow | null };

export function useContributors() {
  return useQuery({
    queryKey: ['contributors'],
    queryFn: async (): Promise<ContributorWithAvatar[]> => {
      const rows = unwrap(await sb().from('contributors').select('*, avatar:media_assets(*)').order('name')) as unknown as ContributorWithAvatar[];
      return rows;
    },
  });
}

export type ContributorInput = {
  id?: string;
  name: string;
  slug?: string;
  type: ContributorType;
  position: string;
  program: string;
  bio: string;
  avatar_asset_id: string | null;
  is_public: boolean;
  is_active: boolean;
};

export function useSaveContributor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (c: ContributorInput) => {
      const row = {
        name: c.name.trim(),
        slug: slugify(c.slug || c.name),
        type: c.type,
        position: c.position.trim() || null,
        program: c.program.trim() || null,
        bio: c.bio.trim() || null,
        avatar_asset_id: c.avatar_asset_id,
        is_public: c.is_public,
        is_active: c.is_active,
      };
      return c.id
        ? unwrap(await sb().from('contributors').update(row).eq('id', c.id).select('*').single())
        : unwrap(await sb().from('contributors').insert(row).select('*').single());
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['contributors'] });
      void client.invalidateQueries({ queryKey: ['contributor-options'] });
    },
  });
}

// ---------------------------------------------------------------- editorial board

export type BoardMember = TeamMemberRow & { photo: MediaAssetRow | null; contributor: Pick<ContributorRow, 'id' | 'name'> | null };

export function useTerms() {
  return useQuery({
    queryKey: ['terms'],
    queryFn: async (): Promise<TeamTermRow[]> => unwrap(await sb().from('team_terms').select('*').order('starts_on', { ascending: false })),
  });
}

export function useSaveTerm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (t: { id?: string; label: string; starts_on: string; ends_on: string | null; is_current: boolean }) => {
      if (t.is_current) {
        let others = sb().from('team_terms').update({ is_current: false }).eq('is_current', true);
        if (t.id) others = others.neq('id', t.id);
        unwrap(await others);
      }
      const row = { label: t.label.trim(), starts_on: t.starts_on, ends_on: t.ends_on || null, is_current: t.is_current };
      return t.id
        ? unwrap(await sb().from('team_terms').update(row).eq('id', t.id).select('*').single())
        : unwrap(await sb().from('team_terms').insert(row).select('*').single());
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['terms'] }),
  });
}

export function useMembers(termId: string | undefined) {
  return useQuery({
    queryKey: ['members', termId],
    enabled: Boolean(termId),
    queryFn: async (): Promise<BoardMember[]> =>
      unwrap(
        await sb()
          .from('team_members')
          .select('*, photo:media_assets(*), contributor:contributors(id, name)')
          .eq('term_id', termId!)
          .order('role_group')
          .order('sort_order'),
      ) as unknown as BoardMember[],
  });
}

export type MemberInput = {
  id?: string;
  term_id: string;
  role_group: TeamRoleGroup;
  position_title: string;
  contributor_id: string | null;
  display_name: string;
  photo_asset_id: string | null;
  sort_order: number;
};

export function useSaveMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (m: MemberInput) => {
      const row = {
        term_id: m.term_id,
        role_group: m.role_group,
        position_title: m.position_title.trim(),
        contributor_id: m.contributor_id,
        display_name: m.display_name.trim() || null,
        photo_asset_id: m.photo_asset_id,
        sort_order: m.sort_order,
      };
      return m.id
        ? unwrap(await sb().from('team_members').update(row).eq('id', m.id))
        : unwrap(await sb().from('team_members').insert(row));
    },
    onSuccess: (_d, m) => void client.invalidateQueries({ queryKey: ['members', m.term_id] }),
  });
}

export function useDeleteMember(termId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await sb().from('team_members').delete().eq('id', id)),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['members', termId] }),
  });
}
