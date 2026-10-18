import { useQuery } from '@tanstack/react-query';
import type { IssueType, MediaVariant } from '@/lib/database.types';
import { publicUrl, type ImageSource } from '@/lib/media';
import { getSupabase, unwrap } from '@/lib/supabase';

export type Issue = {
  id: string;
  title: string;
  slug: string;
  volume: number | null;
  issueNumber: number | null;
  type: IssueType;
  date: string;
  description: string | null;
  cover: ImageSource | null;
  pdfUrl: string | null;
};

export type ArchiveMonth = { month: string; articles: number };

type AssetRow = { bucket: string; path: string; width: number | null; height: number | null; alt_text: string; variants: MediaVariant[] } | null;

export function useIssues() {
  return useQuery({
    queryKey: ['issues'],
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<Issue[]> => {
      const rows = unwrap(
        await getSupabase()
          .from('publication_issues')
          .select(
            'id, title, slug, volume, issue_number, issue_type, issue_date, description, ' +
              'cover:media_assets!publication_issues_cover_asset_id_fkey(bucket, path, width, height, alt_text, variants), ' +
              'pdf:media_assets!publication_issues_pdf_asset_id_fkey(bucket, path)',
          )
          .eq('is_published', true)
          .order('issue_date', { ascending: false }),
      ) as unknown as {
        id: string;
        title: string;
        slug: string;
        volume: number | null;
        issue_number: number | null;
        issue_type: IssueType;
        issue_date: string;
        description: string | null;
        cover: AssetRow;
        pdf: AssetRow;
      }[];
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        volume: r.volume,
        issueNumber: r.issue_number,
        type: r.issue_type,
        date: r.issue_date,
        description: r.description,
        cover: r.cover
          ? { bucket: r.cover.bucket, path: r.cover.path, width: r.cover.width, height: r.cover.height, alt: r.cover.alt_text, variants: r.cover.variants }
          : null,
        pdfUrl: r.pdf ? (publicUrl(r.pdf.bucket, r.pdf.path) ?? null) : null,
      }));
    },
  });
}

export function useArchiveMonths() {
  return useQuery({
    queryKey: ['archive-months'],
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<ArchiveMonth[]> => unwrap(await getSupabase().rpc('archive_months', {}, { get: true })),
  });
}

/** "2026-10" → [start, end) ISO strings in Manila time. */
export function monthRange(month: string): [string, string] | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mon = Number(m[2]);
  if (mon < 1 || mon > 12) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  const next = mon === 12 ? `${year + 1}-01` : `${year}-${pad(mon + 1)}`;
  return [`${year}-${pad(mon)}-01T00:00:00+08:00`, `${next}-01T00:00:00+08:00`];
}

export function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
