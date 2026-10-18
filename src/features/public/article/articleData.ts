import { useMutation, useQuery } from '@tanstack/react-query';
import { toStoryItem, type StoryItem } from '@/components/story/types';
import type { ArticleCardRow, ArticleStatus, MediaVariant } from '@/lib/database.types';
import type { ImageSource } from '@/lib/media';
import { sendForm } from '@/lib/sendForm';
import { getSupabase, unwrap, unwrapMaybe } from '@/lib/supabase';
import { liveCards } from '../articles';

export type ArticleAuthor = {
  id: string;
  name: string;
  slug: string;
  credit: string;
  position: string | null;
  bio: string | null;
  avatar: ImageSource | null;
};

export type ArticleComment = {
  id: string;
  parentId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
};

export type ArticleDetail = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  excerpt: string;
  label: string;
  sectionSlug: string;
  sectionName: string;
  status: ArticleStatus;
  isLive: boolean;
  publishedAt: string | null;
  updatedAt: string;
  readingMinutes: number;
  byline: string | null;
  bodyHtml: string;
  cover: ImageSource | null;
  coverCaption: string | null;
  allowComments: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  authors: ArticleAuthor[];
  tags: { slug: string; name: string }[];
};

type AvatarRow = { bucket: string; path: string; width: number | null; height: number | null; alt_text: string; variants: MediaVariant[] } | null;

const isLive = (row: Pick<ArticleCardRow, 'status' | 'published_at'>) =>
  (row.status === 'published' || row.status === 'scheduled') &&
  Boolean(row.published_at) &&
  new Date(row.published_at!).getTime() <= Date.now();

export async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = getSupabase();
  // RLS: readers only get live rows; signed-in staff also get the drafts they may see (preview).
  const card = unwrapMaybe(await supabase.from('article_cards').select('*').eq('slug', slug).maybeSingle());
  if (!card) return null;

  const [body, authors, tags] = await Promise.all([
    supabase
      .from('articles')
      .select('body_html, cover_caption, allow_comments, seo_title, seo_description')
      .eq('id', card.id)
      .single()
      .then(unwrap),
    supabase
      .from('article_authors')
      .select('credit_label, position, contributors(id, name, slug, position, bio, media_assets(bucket, path, width, height, alt_text, variants))')
      .eq('article_id', card.id)
      .order('position')
      .then(unwrap),
    supabase.from('article_tags').select('tags(slug, name)').eq('article_id', card.id).then(unwrap),
  ]);

  const story = toStoryItem(card);
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    dek: card.dek,
    excerpt: card.excerpt,
    label: story.label,
    sectionSlug: card.section_slug,
    sectionName: card.section_name,
    status: card.status,
    isLive: isLive(card),
    publishedAt: card.published_at,
    updatedAt: card.updated_at,
    readingMinutes: card.reading_minutes,
    byline: card.byline,
    bodyHtml: body.body_html,
    cover: story.image ?? null,
    coverCaption: body.cover_caption,
    allowComments: body.allow_comments,
    seoTitle: body.seo_title,
    seoDescription: body.seo_description,
    authors: (authors as unknown as {
      credit_label: string;
      contributors: { id: string; name: string; slug: string; position: string | null; bio: string | null; media_assets: AvatarRow } | null;
    }[])
      .filter((a) => a.contributors)
      .map((a) => {
        const c = a.contributors!;
        const m = c.media_assets;
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          credit: a.credit_label,
          position: c.position,
          bio: c.bio,
          avatar: m ? { bucket: m.bucket, path: m.path, width: m.width, height: m.height, alt: m.alt_text, variants: m.variants } : null,
        };
      }),
    tags: (tags as unknown as { tags: { slug: string; name: string } | null }[]).flatMap((t) => (t.tags ? [t.tags] : [])),
  };
}

export function useArticle(slug: string, enabled = true) {
  return useQuery({ queryKey: ['article', slug], queryFn: () => fetchArticle(slug), enabled });
}

export function useRelated(article: Pick<ArticleDetail, 'id' | 'sectionSlug'> | null | undefined) {
  return useQuery({
    queryKey: ['related', article?.id],
    enabled: Boolean(article),
    queryFn: async (): Promise<StoryItem[]> =>
      unwrap(
        await liveCards()
          .eq('section_slug', article!.sectionSlug)
          .neq('id', article!.id)
          .order('published_at', { ascending: false })
          .limit(3),
      ).map(toStoryItem),
  });
}

export function useComments(articleId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['comments', articleId],
    enabled: Boolean(articleId) && enabled,
    queryFn: async (): Promise<ArticleComment[]> =>
      unwrap(
        await getSupabase()
          .from('article_comments')
          .select('id, parent_id, author_name, body, created_at')
          .eq('article_id', articleId!)
          .eq('status', 'approved')
          .order('created_at'),
      ).map((c) => ({ id: c.id, parentId: c.parent_id, authorName: c.author_name, body: c.body, createdAt: c.created_at })),
  });
}

export type CommentInput = { name: string; email: string; body: string; parentId?: string | null; website?: string };

export function useSubmitComment(articleId: string) {
  return useMutation({
    mutationFn: async (input: CommentInput) =>
      sendForm('comment', {
        p_article_id: articleId,
        p_name: input.name,
        p_email: input.email,
        p_body: input.body,
        p_parent_id: input.parentId ?? null,
        p_website: input.website || null,
      }),
  });
}
