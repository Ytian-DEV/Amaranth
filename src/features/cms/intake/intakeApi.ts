import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IntakeStatus } from '@/lib/database.types';
import { getSupabase, unwrap, unwrapMaybe, pastLastPage } from '@/lib/supabase';

export type IntakeKind = 'submission' | 'event';

export type IntakeItem = {
  id: string;
  kind: IntakeKind;
  title: string;
  from: string;
  email: string;
  affiliation: string | null;
  section: string | null;
  summary: string | null;
  body: string | null;
  eventDate: string | null;
  venue: string | null;
  status: IntakeStatus;
  reviewNote: string | null;
  convertedArticleId: string | null;
  createdAt: string;
};

export type IntakeFile = { id: string; name: string; mime: string | null; size: number | null; path: string };

const table = (kind: IntakeKind) => (kind === 'submission' ? 'article_submissions' : 'event_reports');

type SubmissionRow = {
  id: string; title: string; submitter_name: string; submitter_email: string; submitter_affiliation: string | null;
  summary: string | null; body: string | null; status: IntakeStatus; review_note: string | null;
  converted_article_id: string | null; created_at: string; sections: { name: string } | null;
};
type EventRow = {
  id: string; event_title: string; organization: string; contact_name: string; contact_email: string; event_date: string | null;
  venue: string | null; summary: string; status: IntakeStatus; review_note: string | null; converted_article_id: string | null; created_at: string;
};

function fromSubmission(r: SubmissionRow): IntakeItem {
  return {
    id: r.id, kind: 'submission', title: r.title, from: r.submitter_name, email: r.submitter_email, affiliation: r.submitter_affiliation,
    section: r.sections?.name ?? null, summary: r.summary, body: r.body, eventDate: null, venue: null, status: r.status,
    reviewNote: r.review_note, convertedArticleId: r.converted_article_id, createdAt: r.created_at,
  };
}
function fromEvent(r: EventRow): IntakeItem {
  return {
    id: r.id, kind: 'event', title: r.event_title, from: `${r.contact_name}, ${r.organization}`, email: r.contact_email,
    affiliation: r.organization, section: null, summary: null, body: r.summary, eventDate: r.event_date, venue: r.venue,
    status: r.status, reviewNote: r.review_note, convertedArticleId: r.converted_article_id, createdAt: r.created_at,
  };
}

export const INTAKE_PAGE_SIZE = 20;

export function useIntakeList(kind: IntakeKind, status: IntakeStatus | 'open', page: number) {
  return useQuery({
    queryKey: ['intake', kind, status, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const from = (page - 1) * INTAKE_PAGE_SIZE;
      const columns = kind === 'submission' ? '*, sections(name)' : '*';
      let q = getSupabase().from(table(kind)).select(columns, { count: 'exact' });
      q = status === 'open' ? q.in('status', ['submitted', 'reviewing']) : q.eq('status', status);
      const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, from + INTAKE_PAGE_SIZE - 1);
      if (error && !pastLastPage(error)) throw error;
      const rows = (data ?? []) as unknown[];
      return {
        total: count ?? 0,
        items: kind === 'submission' ? (rows as SubmissionRow[]).map(fromSubmission) : (rows as EventRow[]).map(fromEvent),
      };
    },
  });
}

export function useIntakeItem(kind: IntakeKind, id: string | undefined) {
  return useQuery({
    queryKey: ['intake-item', kind, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const supabase = getSupabase();
      const columns = kind === 'submission' ? '*, sections(name)' : '*';
      const row = unwrapMaybe(await supabase.from(table(kind)).select(columns).eq('id', id!).maybeSingle()) as unknown;
      if (!row) return null;
      const files = unwrap(
        await supabase
          .from('intake_files')
          .select('id, file_name, mime_type, size_bytes, path')
          .eq(kind === 'submission' ? 'submission_id' : 'event_report_id', id!),
      );
      return {
        item: kind === 'submission' ? fromSubmission(row as SubmissionRow) : fromEvent(row as EventRow),
        files: files.map((f): IntakeFile => ({ id: f.id, name: f.file_name, mime: f.mime_type, size: f.size_bytes, path: f.path })),
      };
    },
  });
}

/** Short-lived download link for a private intake file. */
export async function signedIntakeUrl(path: string) {
  const { data, error } = await getSupabase().storage.from('intake').createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export function useSetIntakeStatus(kind: IntakeKind) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; status: IntakeStatus; note?: string | null; reviewerId: string }) =>
      unwrap(
        await getSupabase()
          .from(table(kind))
          .update({ status: p.status, review_note: p.note ?? null, reviewer_id: p.reviewerId, reviewed_at: new Date().toISOString() })
          .eq('id', p.id),
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['intake'] });
      void client.invalidateQueries({ queryKey: ['intake-item'] });
      void client.invalidateQueries({ queryKey: ['pending-intake'] });
      void client.invalidateQueries({ queryKey: ['submission-queue'] });
    },
  });
}

export function useConvertIntake(kind: IntakeKind) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; categoryId: string }) =>
      unwrap(await getSupabase().rpc('convert_intake_to_article', { p_kind: kind, p_intake_id: p.id, p_category_id: p.categoryId })),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['intake'] });
      void client.invalidateQueries({ queryKey: ['pending-intake'] });
      void client.invalidateQueries({ queryKey: ['cms-articles'] });
    },
  });
}
