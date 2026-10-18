import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ArticleRow, ArticleStatus, Json, MediaAssetRow } from '@/lib/database.types';
import { slugify } from '@/lib/slug';
import { getSupabase, unwrap, unwrapMaybe, pastLastPage } from '@/lib/supabase';

export const LIST_PAGE_SIZE = 20;

// ---------------------------------------------------------------- list

export type ArticleListFilters = { q: string; status: ArticleStatus | '' | 'review'; section: string; mine: boolean; page: number };

export type ArticleListRow = {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  section: string;
  category: string;
  byline: string | null;
  updatedAt: string;
  publishedAt: string | null;
};

export function useArticleList(filters: ArticleListFilters, userId: string | undefined) {
  return useQuery({
    queryKey: ['cms-articles', filters, userId],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const from = (filters.page - 1) * LIST_PAGE_SIZE;
      let query = getSupabase()
        .from('article_cards')
        .select('id, title, slug, status, section_name, section_slug, category_name, byline, updated_at, published_at, created_by', {
          count: 'exact',
        });
      if (filters.q.trim()) query = query.ilike('title', `%${filters.q.trim().replace(/[%_]/g, '')}%`);
      if (filters.status === 'review') query = query.in('status', ['submitted', 'in_review']);
      else if (filters.status) query = query.eq('status', filters.status);
      if (filters.section) query = query.eq('section_slug', filters.section);
      if (filters.mine && userId) query = query.eq('created_by', userId);
      const { data, error, count } = await query.order('updated_at', { ascending: false }).range(from, from + LIST_PAGE_SIZE - 1);
      if (error && !pastLastPage(error)) throw error;
      return {
        total: count ?? 0,
        rows: (data ?? []).map(
          (r): ArticleListRow => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            status: r.status,
            section: r.section_name,
            category: r.category_name,
            byline: r.byline,
            updatedAt: r.updated_at,
            publishedAt: r.published_at,
          }),
        ),
      };
    },
  });
}

// ---------------------------------------------------------------- lookups

export type CategoryOption = { id: string; name: string; sectionId: string; sectionName: string; sectionSlug: string; assignable: boolean };
export type ContributorOption = { id: string; name: string; profileId: string | null };

export function useCategoryOptions() {
  return useQuery({
    queryKey: ['category-options'],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<CategoryOption[]> => {
      const rows = unwrap(
        await getSupabase()
          .from('categories')
          .select('id, name, is_assignable, sort_order, sections(id, name, slug, nav_order)')
          .eq('is_active', true),
      ) as unknown as {
        id: string;
        name: string;
        is_assignable: boolean;
        sort_order: number;
        sections: { id: string; name: string; slug: string; nav_order: number };
      }[];
      return rows
        .sort((a, b) => a.sections.nav_order - b.sections.nav_order || a.sort_order - b.sort_order)
        .map((r) => ({
          id: r.id,
          name: r.name,
          sectionId: r.sections.id,
          sectionName: r.sections.name,
          sectionSlug: r.sections.slug,
          assignable: r.is_assignable,
        }));
    },
  });
}

export function useContributorOptions() {
  return useQuery({
    queryKey: ['contributor-options'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ContributorOption[]> =>
      unwrap(await getSupabase().from('contributors').select('id, name, profile_id').eq('is_active', true).order('name')).map((c) => ({
        id: c.id,
        name: c.name,
        profileId: c.profile_id,
      })),
  });
}

// ---------------------------------------------------------------- editor

export type DraftAuthor = { contributorId: string; name: string; credit: string };
export type DraftTag = { slug: string; name: string };

export type EditorDraft = {
  id: string | null;
  title: string;
  slug: string;
  kicker: string;
  dek: string;
  excerpt: string;
  bodyJson: Json | null;
  bodyHtml: string;
  bodyText: string;
  categoryId: string;
  coverAssetId: string | null;
  cover: MediaAssetRow | null;
  coverCaption: string;
  bylineOverride: string;
  allowComments: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  authors: DraftAuthor[];
  tags: DraftTag[];
};

export type LoadedArticle = { row: ArticleRow; draft: EditorDraft };

export const emptyDraft = (): EditorDraft => ({
  id: null,
  title: '',
  slug: '',
  kicker: '',
  dek: '',
  excerpt: '',
  bodyJson: null,
  bodyHtml: '',
  bodyText: '',
  categoryId: '',
  coverAssetId: null,
  cover: null,
  coverCaption: '',
  bylineOverride: '',
  allowComments: true,
  isFeatured: false,
  seoTitle: '',
  seoDescription: '',
  authors: [],
  tags: [],
});

export async function loadArticle(id: string): Promise<LoadedArticle | null> {
  const supabase = getSupabase();
  const row = unwrapMaybe(await supabase.from('articles').select('*').eq('id', id).maybeSingle());
  if (!row) return null;
  const [authors, tags, cover] = await Promise.all([
    supabase.from('article_authors').select('credit_label, position, contributors(id, name)').eq('article_id', id).order('position').then(unwrap),
    supabase.from('article_tags').select('tags(slug, name)').eq('article_id', id).then(unwrap),
    row.cover_asset_id
      ? supabase.from('media_assets').select('*').eq('id', row.cover_asset_id).maybeSingle().then(unwrapMaybe)
      : Promise.resolve(null),
  ]);
  return {
    row,
    draft: {
      id: row.id,
      title: row.title,
      slug: row.slug,
      kicker: row.kicker ?? '',
      dek: row.dek ?? '',
      excerpt: row.excerpt,
      bodyJson: row.body_json,
      bodyHtml: row.body_html,
      bodyText: row.body_text,
      categoryId: row.category_id,
      coverAssetId: row.cover_asset_id,
      cover: cover as MediaAssetRow | null,
      coverCaption: row.cover_caption ?? '',
      bylineOverride: row.byline_override ?? '',
      allowComments: row.allow_comments,
      isFeatured: row.is_featured,
      seoTitle: row.seo_title ?? '',
      seoDescription: row.seo_description ?? '',
      authors: (authors as unknown as { credit_label: string; contributors: { id: string; name: string } | null }[])
        .filter((a) => a.contributors)
        .map((a) => ({ contributorId: a.contributors!.id, name: a.contributors!.name, credit: a.credit_label })),
      tags: (tags as unknown as { tags: DraftTag | null }[]).flatMap((t) => (t.tags ? [t.tags] : [])),
    },
  };
}

export function useLoadArticle(id: string | undefined) {
  return useQuery({
    queryKey: ['cms-article', id],
    enabled: Boolean(id),
    staleTime: Infinity,
    gcTime: 0,
    queryFn: () => loadArticle(id!),
  });
}

function articleFields(d: EditorDraft) {
  return {
    title: d.title.trim() || 'Untitled',
    slug: d.slug.trim() ? slugify(d.slug) : '',
    kicker: d.kicker.trim() || null,
    dek: d.dek.trim() || null,
    excerpt: d.excerpt.trim(),
    body_json: d.bodyJson,
    body_html: d.bodyHtml,
    body_text: d.bodyText,
    category_id: d.categoryId,
    cover_asset_id: d.coverAssetId,
    cover_caption: d.coverCaption.trim() || null,
    byline_override: d.bylineOverride.trim() || null,
    allow_comments: d.allowComments,
    seo_title: d.seoTitle.trim() || null,
    seo_description: d.seoDescription.trim() || null,
  };
}

/** Creates or updates the article and syncs its authors and tags. Returns the saved row. */
export async function saveArticle(d: EditorDraft, opts: { canFeature: boolean }): Promise<ArticleRow> {
  const supabase = getSupabase();
  const fields = { ...articleFields(d), ...(opts.canFeature ? { is_featured: d.isFeatured } : {}) };

  const row = d.id
    ? unwrap(await supabase.from('articles').update(fields).eq('id', d.id).select('*').single())
    : unwrap(await supabase.from('articles').insert({ ...fields, status: 'draft' }).select('*').single());

  // authors: replace the set (the DB credits the creator on insert)
  const wantAuthors = d.authors.map((a, i) => ({ article_id: row.id, contributor_id: a.contributorId, credit_label: a.credit || 'Author', position: i + 1 }));
  if (d.id || wantAuthors.length) {
    const existing = unwrap(await supabase.from('article_authors').select('contributor_id').eq('article_id', row.id));
    const keep = new Set(wantAuthors.map((a) => a.contributor_id));
    const remove = existing.map((e) => e.contributor_id).filter((id) => !keep.has(id));
    if (remove.length) {
      unwrap(await supabase.from('article_authors').delete().eq('article_id', row.id).in('contributor_id', remove));
    }
    if (wantAuthors.length) unwrap(await supabase.from('article_authors').upsert(wantAuthors));
  }

  // tags: make sure each exists, then replace links
  const tagIds: string[] = [];
  for (const t of d.tags) {
    const slug = slugify(t.slug || t.name);
    if (!slug) continue;
    let tag = unwrapMaybe(await supabase.from('tags').select('id').eq('slug', slug).maybeSingle());
    tag ??= unwrap(await supabase.from('tags').insert({ slug, name: t.name.trim() }).select('id').single());
    tagIds.push(tag.id);
  }
  unwrap(await supabase.from('article_tags').delete().eq('article_id', row.id));
  if (tagIds.length) unwrap(await supabase.from('article_tags').insert(tagIds.map((tag_id) => ({ article_id: row.id, tag_id }))));

  return row;
}

/** Autosave snapshot for articles that are live or locked (doesn't touch the article). */
export async function saveRevision(articleId: string, d: EditorDraft, userId: string, kind: 'autosave' | 'manual') {
  unwrap(
    await getSupabase().from('article_revisions').insert({
      article_id: articleId,
      kind,
      title: d.title,
      body_json: d.bodyJson,
      body_html: d.bodyHtml,
      saved_by: userId,
    }),
  );
}

export async function deleteArticle(id: string) {
  unwrap(await getSupabase().from('articles').delete().eq('id', id));
}
