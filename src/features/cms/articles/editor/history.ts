import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ArticleStatus, Json, RevisionKind } from '@/lib/database.types';
import { getSupabase, unwrap, unwrapMaybe } from '@/lib/supabase';

export type ActivityItem = {
  id: number;
  action: 'created' | 'status' | 'note';
  from: ArticleStatus | null;
  to: ArticleStatus | null;
  note: string | null;
  actor: string | null;
  createdAt: string;
};

export type RevisionItem = { id: number; kind: RevisionKind; title: string; savedBy: string | null; createdAt: string };

async function namesFor(ids: (string | null)[]) {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  if (!unique.length) return new Map<string, string>();
  const rows = unwrap(await getSupabase().from('profiles').select('id, display_name').in('id', unique));
  return new Map(rows.map((r) => [r.id, r.display_name]));
}

export function useActivity(articleId: string | undefined) {
  return useQuery({
    queryKey: ['article-activity', articleId],
    enabled: Boolean(articleId),
    queryFn: async (): Promise<ActivityItem[]> => {
      const rows = unwrap(
        await getSupabase()
          .from('article_activity')
          .select('id, action, from_status, to_status, note, actor_id, created_at')
          .eq('article_id', articleId!)
          .order('created_at', { ascending: false })
          .limit(50),
      );
      const names = await namesFor(rows.map((r) => r.actor_id));
      return rows.map((r) => ({
        id: r.id,
        action: r.action,
        from: r.from_status,
        to: r.to_status,
        note: r.note,
        actor: r.actor_id ? (names.get(r.actor_id) ?? 'A staff member') : 'System',
        createdAt: r.created_at,
      }));
    },
  });
}

export function useAddNote(articleId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (note: string) => unwrap(await getSupabase().rpc('add_article_note', { p_article_id: articleId, p_note: note })),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['article-activity', articleId] }),
  });
}

export function useRevisions(articleId: string | undefined) {
  return useQuery({
    queryKey: ['article-revisions', articleId],
    enabled: Boolean(articleId),
    queryFn: async (): Promise<RevisionItem[]> => {
      const rows = unwrap(
        await getSupabase()
          .from('article_revisions')
          .select('id, kind, title, saved_by, created_at')
          .eq('article_id', articleId!)
          .order('created_at', { ascending: false })
          .limit(30),
      );
      const names = await namesFor(rows.map((r) => r.saved_by));
      return rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        title: r.title,
        savedBy: r.saved_by ? (names.get(r.saved_by) ?? null) : null,
        createdAt: r.created_at,
      }));
    },
  });
}

export async function loadRevision(id: number): Promise<{ title: string; bodyJson: Json | null; bodyHtml: string } | null> {
  const row = unwrapMaybe(await getSupabase().from('article_revisions').select('title, body_json, body_html').eq('id', id).maybeSingle());
  return row ? { title: row.title, bodyJson: row.body_json, bodyHtml: row.body_html } : null;
}
