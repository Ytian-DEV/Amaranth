import type {
  CoverCredit,
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
  const links = getSortedAuthorLinks(article);
  if (!links.length) return null;

  return links.find((link) => link.is_primary) ?? links[0];
}

export function getContributorFromLink(link: CmsArticleAuthorLink | null) {
  return pickSingleRelation<CmsContributor>(link?.contributors);
}

export function getSortedAuthorLinks(article: CmsArticleRecord) {
  return [...(article.article_authors ?? [])].sort(
    (left, right) => left.display_order - right.display_order,
  );
}

export function joinDisplayNames(names: string[]) {
  const cleanNames = names.map((name) => name.trim()).filter(Boolean);
  if (!cleanNames.length) return "";
  if (cleanNames.length === 1) return cleanNames[0];
  if (cleanNames.length === 2) return `${cleanNames[0]} and ${cleanNames[1]}`;
  return `${cleanNames.slice(0, -1).join(", ")}, and ${cleanNames.at(-1)}`;
}

export function getArticleAuthorNames(article: CmsArticleRecord) {
  const names = getSortedAuthorLinks(article)
    .map((link) => getContributorFromLink(link)?.display_name ?? "")
    .filter(Boolean);

  return joinDisplayNames(names) || article.author_name;
}

export function normalizeCoverCredits(value: unknown): CoverCredit[] {
  const credits = Array.isArray((value as Record<string, unknown> | null)?.coverCredits)
    ? ((value as Record<string, unknown>).coverCredits as unknown[])
    : Array.isArray(value)
      ? (value as unknown[])
      : [];

  return credits
    .map((entry) => {
      if (typeof entry === "string") {
        return { name: entry.trim(), role: "" };
      }

      if (!entry || typeof entry !== "object") return null;

      const name = String((entry as Record<string, unknown>).name ?? "").trim();
      const role = String((entry as Record<string, unknown>).role ?? "").trim();
      if (!name) return null;

      return { name, role };
    })
    .filter((entry): entry is CoverCredit => Boolean(entry));
}

export function formatCoverCredits(credits: CoverCredit[]) {
  return credits
    .filter((credit) => credit.name.trim())
    .map((credit) => (credit.role.trim() ? `${credit.role.trim()}: ${credit.name.trim()}` : credit.name.trim()))
    .join(" / ");
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
    authorIds: defaultAuthor ? [defaultAuthor] : [],
    status: "draft",
    publishedAt: "",
    scheduledFor: "",
    editorialPriority: 50,
    allowComments: false,
    imageAlt: "",
    imageUrl: "",
    coverAssetId: null,
    coverCredits: [],
    meta: {},
    selectedImageFile: null,
  };
}

export function articleToEditorState(
  article: CmsArticleRecord,
  categories: CmsCategory[],
  contributors: CmsContributor[],
) {
  const defaultState = createEmptyEditorState(categories, contributors);
  const sortedAuthorLinks = getSortedAuthorLinks(article);
  const primaryAuthor = getContributorFromLink(getPrimaryAuthorLink(article));
  const authorIds = sortedAuthorLinks.map((link) => link.contributor_id);

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
    authorIds: authorIds.length ? authorIds : defaultState.authorIds,
    status: article.status,
    publishedAt: toDateTimeLocal(article.published_at),
    scheduledFor: toDateTimeLocal(article.scheduled_for),
    editorialPriority: article.editorial_priority ?? 50,
    allowComments: article.allow_comments,
    imageAlt: article.featured_image_alt ?? "",
    imageUrl: article.image_url ?? "",
    coverAssetId: article.cover_asset_id,
    coverCredits: normalizeCoverCredits(article.meta),
    meta: article.meta ?? {},
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
