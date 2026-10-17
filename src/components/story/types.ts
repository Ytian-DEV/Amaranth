import type { ArticleCardRow } from '@/lib/database.types';
import { formatDate, formatReadingTime, joinMeta } from '@/lib/format';
import type { ImageSource } from '@/lib/media';

/** What every story component renders; built from article_cards rows or fixtures. */
export type StoryItem = {
  id: string;
  slug: string;
  title: string;
  /** Label above the headline, e.g. "News" or "News · Environment" */
  label: string;
  excerpt?: string | null;
  byline?: string | null;
  publishedAt?: string | null;
  readingMinutes?: number | null;
  image?: ImageSource | null;
  /** category slug and name, for section layouts */
  category?: string;
  categoryName?: string;
};

export const articlePath = (slug: string) => `/article/${slug}`;

export function storyLabel(row: Pick<ArticleCardRow, 'section_name' | 'category_name' | 'kicker'>) {
  const second = row.kicker ?? (row.category_name !== row.section_name ? row.category_name : null);
  return second ? `${row.section_name} · ${second}` : row.section_name;
}

export function toStoryItem(row: ArticleCardRow): StoryItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    label: storyLabel(row),
    excerpt: row.dek || row.excerpt,
    byline: row.byline,
    publishedAt: row.published_at,
    readingMinutes: row.reading_minutes,
    category: row.category_slug,
    categoryName: row.category_name,
    image: row.cover_path
      ? {
          bucket: row.cover_bucket,
          path: row.cover_path,
          width: row.cover_width,
          height: row.cover_height,
          alt: row.cover_alt,
          variants: row.cover_variants,
        }
      : null,
  };
}

export function storyMeta(story: StoryItem, { byline = true, readTime = true } = {}) {
  return joinMeta(
    byline && story.byline ? `By ${story.byline}` : null,
    formatDate(story.publishedAt),
    readTime && story.readingMinutes ? formatReadingTime(story.readingMinutes) : null,
  );
}
