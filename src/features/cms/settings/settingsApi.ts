import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CategoryRow,
  CommentStatus,
  ContactMessageRow,
  ContactStatus,
  DepartmentContactRow,
  HomeSlotRow,
  Json,
  NavPlacement,
  SectionRow,
} from '@/lib/database.types';
import { slugify } from '@/lib/slug';
import { getSupabase, unwrap, unwrapMaybe } from '@/lib/supabase';

const sb = () => getSupabase();

// ---------------------------------------------------------------- site settings (key/value)

export function useSetting<T extends Json>(key: string) {
  return useQuery({
    queryKey: ['setting', key],
    queryFn: async () => (unwrapMaybe(await sb().from('site_settings').select('value').eq('key', key).maybeSingle())?.value ?? null) as T | null,
  });
}

export function useSaveSetting(key: string, isPublic = true) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (value: Json) => unwrap(await sb().from('site_settings').upsert({ key, value, is_public: isPublic })),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['setting', key] });
      void client.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
}

// ---------------------------------------------------------------- home page slots

export type SlotWithTitle = HomeSlotRow & { title: string | null };

export function useHomeSlots() {
  return useQuery({
    queryKey: ['home-slots'],
    queryFn: async (): Promise<SlotWithTitle[]> => {
      const slots = unwrap(await sb().from('home_slots').select('*'));
      const ids = slots.map((s) => s.article_id).filter(Boolean) as string[];
      const titles = ids.length ? unwrap(await sb().from('article_cards').select('id, title').in('id', ids)) : [];
      return slots.map((s) => ({ ...s, title: titles.find((t) => t.id === s.article_id)?.title ?? null }));
    },
  });
}

export function useSaveSlot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (s: Pick<HomeSlotRow, 'slot' | 'article_id' | 'pull_quote' | 'attribution'>) => unwrap(await sb().from('home_slots').upsert(s)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['home-slots'] });
      void client.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

/** Live articles matching a title, for slot pickers. */
export async function searchLiveArticles(q: string, section?: string) {
  let query = sb()
    .from('article_cards')
    .select('id, title, section_name, published_at')
    .in('status', ['published', 'scheduled'])
    .order('published_at', { ascending: false })
    .limit(8);
  if (q.trim()) query = query.ilike('title', `%${q.trim().replace(/[%_]/g, '')}%`);
  if (section) query = query.eq('section_slug', section);
  return unwrap(await query);
}

// ---------------------------------------------------------------- comments

export type PendingComment = { id: string; body: string; author: string; email: string | null; createdAt: string; status: CommentStatus; articleTitle: string; articleSlug: string };

export function useComments(status: CommentStatus) {
  return useQuery({
    queryKey: ['moderation', status],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<PendingComment[]> => {
      const rows = unwrap(
        await sb()
          .from('article_comments')
          .select('id, body, author_name, created_at, status, articles(title, slug)')
          .eq('status', status)
          .order('created_at', { ascending: status === 'pending' })
          .limit(50),
      ) as unknown as { id: string; body: string; author_name: string; created_at: string; status: CommentStatus; articles: { title: string; slug: string } | null }[];
      const emails = rows.length ? unwrap(await sb().from('article_comment_private').select('comment_id, author_email').in('comment_id', rows.map((r) => r.id))) : [];
      return rows.map((r) => ({
        id: r.id,
        body: r.body,
        author: r.author_name,
        email: emails.find((e) => e.comment_id === r.id)?.author_email ?? null,
        createdAt: r.created_at,
        status: r.status,
        articleTitle: r.articles?.title ?? '(deleted article)',
        articleSlug: r.articles?.slug ?? '',
      }));
    },
  });
}

export function useModerate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; status: CommentStatus; userId: string }) =>
      unwrap(await sb().from('article_comments').update({ status: p.status, moderated_by: p.userId, moderated_at: new Date().toISOString() }).eq('id', p.id)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['moderation'] });
      void client.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// ---------------------------------------------------------------- contact inbox

export function useInbox(status: ContactStatus | 'open') {
  return useQuery({
    queryKey: ['inbox', status],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ContactMessageRow[]> => {
      let q = sb().from('contact_messages').select('*');
      q = status === 'open' ? q.in('status', ['unread', 'in_progress']) : q.eq('status', status);
      return unwrap(await q.order('created_at', { ascending: false }).limit(100));
    },
  });
}

export function useSetMessageStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; status: ContactStatus; userId: string }) =>
      unwrap(await sb().from('contact_messages').update({ status: p.status, handled_by: p.userId, handled_at: new Date().toISOString() }).eq('id', p.id)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['inbox'] });
      void client.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// ---------------------------------------------------------------- sections & categories

export type SectionWithCategories = SectionRow & { categories: CategoryRow[] };

export function useSectionsAdmin() {
  return useQuery({
    queryKey: ['sections-admin'],
    queryFn: async (): Promise<SectionWithCategories[]> => {
      const [sections, categories] = await Promise.all([
        sb().from('sections').select('*').order('nav_order').then(unwrap),
        sb().from('categories').select('*').order('sort_order').then(unwrap),
      ]);
      return sections.map((s) => ({ ...s, categories: categories.filter((c) => c.section_id === s.id) }));
    },
  });
}

const invalidateTaxonomy = (client: ReturnType<typeof useQueryClient>) => {
  for (const key of ['sections-admin', 'nav-sections', 'category-options', 'section', 'sections-list', 'submission-sections']) {
    void client.invalidateQueries({ queryKey: [key] });
  }
};

export function useSaveSection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (s: { id?: string; name: string; slug?: string; description: string; nav_placement: NavPlacement; nav_order: number; accepts_submissions: boolean }) => {
      const row = {
        name: s.name.trim(),
        slug: slugify(s.slug || s.name),
        description: s.description.trim() || null,
        nav_placement: s.nav_placement,
        nav_order: s.nav_order,
        accepts_submissions: s.accepts_submissions,
      };
      return s.id ? unwrap(await sb().from('sections').update(row).eq('id', s.id)) : unwrap(await sb().from('sections').insert(row));
    },
    onSuccess: () => invalidateTaxonomy(client),
  });
}

export function useSaveCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (c: { id?: string; section_id: string; name: string; slug?: string; sort_order: number; is_active: boolean; is_assignable: boolean }) => {
      const row = { section_id: c.section_id, name: c.name.trim(), slug: slugify(c.slug || c.name), sort_order: c.sort_order, is_active: c.is_active, is_assignable: c.is_assignable };
      return c.id ? unwrap(await sb().from('categories').update(row).eq('id', c.id)) : unwrap(await sb().from('categories').insert(row));
    },
    onSuccess: () => invalidateTaxonomy(client),
  });
}

// ---------------------------------------------------------------- department contacts

export function useDepartments() {
  return useQuery({
    queryKey: ['departments-admin'],
    queryFn: async (): Promise<DepartmentContactRow[]> => unwrap(await sb().from('department_contacts').select('*').order('sort_order')),
  });
}

export function useSaveDepartment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (d: { id?: string; name: string; email: string; phone: string; sort_order: number }) => {
      const row = { name: d.name.trim(), email: d.email.trim() || null, phone: d.phone.trim() || null, sort_order: d.sort_order };
      return d.id ? unwrap(await sb().from('department_contacts').update(row).eq('id', d.id)) : unwrap(await sb().from('department_contacts').insert(row));
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['departments-admin'] });
      void client.invalidateQueries({ queryKey: ['department-contacts'] });
    },
  });
}

export function useDeleteDepartment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await sb().from('department_contacts').delete().eq('id', id)),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['departments-admin'] }),
  });
}
