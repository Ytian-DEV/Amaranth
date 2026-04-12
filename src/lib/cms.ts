import type {
  CmsArticleAuthorLink,
  CmsArticleEditorState,
  CmsArticleRecord,
  CmsCategory,
  CmsContributor,
  CmsSection,
} from "../types/database";

export function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function htmlToPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function textToHtml(text: string) {
  if (!text.trim()) return "";

  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

export function pickSingleRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function getCategorySection(category: CmsCategory | null) {
  return pickSingleRelation<CmsSection>(category?.sections);
}

export function getPrimaryAuthorLink(article: CmsArticleRecord) {
  const links = article.article_authors ?? [];
  if (!links.length) return null;

  return (
    links.find((link) => link.is_primary) ??
    [...links].sort((a, b) => a.display_order - b.display_order)[0]
  );
}

export function getContributorFromLink(link: CmsArticleAuthorLink | null) {
  return pickSingleRelation<CmsContributor>(link?.contributors);
}

export function createEmptyEditorState(
  categories: CmsCategory[] = [],
  contributors: CmsContributor[] = [],
): CmsArticleEditorState {
  const defaultCategory = categories[0]?.id ?? "";
  const defaultAuthor = contributors[0]?.id ?? "";

  return {
    id: null,
    title: "",
    slug: "",
    subtitle: "",
    excerpt: "",
    bodyHtml: "",
    categoryId: defaultCategory,
    authorId: defaultAuthor,
    status: "draft",
    publishedAt: "",
    scheduledFor: "",
    editorialPriority: 50,
    allowComments: false,
    imageAlt: "",
    imageUrl: "",
    coverAssetId: null,
    selectedImageFile: null,
  };
}

export function articleToEditorState(
  article: CmsArticleRecord,
  categories: CmsCategory[],
  contributors: CmsContributor[],
) {
  const defaultState = createEmptyEditorState(categories, contributors);
  const primaryAuthor = getContributorFromLink(getPrimaryAuthorLink(article));

  return {
    ...defaultState,
    id: article.id,
    title: article.title,
    slug: article.slug,
    subtitle: article.subtitle ?? "",
    excerpt: article.excerpt,
    bodyHtml: article.body_html ?? textToHtml(article.body_text),
    categoryId: article.category_id,
    authorId: primaryAuthor?.id ?? defaultState.authorId,
    status: article.status,
    publishedAt: toDateTimeLocal(article.published_at),
    scheduledFor: toDateTimeLocal(article.scheduled_for),
    editorialPriority: article.editorial_priority ?? 50,
    allowComments: article.allow_comments,
    imageAlt: article.featured_image_alt ?? "",
    imageUrl: article.image_url ?? "",
    coverAssetId: article.cover_asset_id,
    selectedImageFile: null,
  };
}

export function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function statusBadgeVariant(status: string) {
  switch (status) {
    case "published":
      return "default" as const;
    case "scheduled":
      return "secondary" as const;
    case "draft":
      return "outline" as const;
    case "archived":
      return "muted" as const;
    case "rejected":
      return "destructive" as const;
    default:
      return "accent" as const;
  }
}

export function categoryDisplayName(category: CmsCategory | null) {
  if (!category) return "Uncategorized";
  const section = getCategorySection(category);
  if (!section || section.name === category.title) return category.title;
  return `${section.name} - ${category.title}`;
}

export function articleWordCount(html: string) {
  const plainText = htmlToPlainText(html);
  if (!plainText) return 0;
  return plainText.split(/\s+/).length;
}
