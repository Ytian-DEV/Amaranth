export interface DashboardUser {
  id: string;
  email: string | null;
  name: string;
  username: string | null;
  role: string | null;
  avatarUrl?: string | null;
  lastLogin?: string | null;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  contents: string;
  excerpt: string;
  category: string;
  author_name: string;
  published_date: string | null;
  image_url: string | null;
  publish: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  position: number;
  active: boolean;
}

export interface Author {
  id: string;
  name: string;
  email: string;
  username: string;
  position: string | null;
  bio: string | null;
  active: boolean;
}

export interface ArticleWithCategory extends Article {
  categories?: {
    title: string;
    slug: string;
    description: string;
  };
}

export type CmsArticleStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived"
  | "rejected";

export interface CmsSection {
  id: string;
  key: string;
  name: string;
}

export interface CmsCategory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sort_order: number;
  section_id: string;
  sections?: CmsSection | CmsSection[] | null;
}

export interface CmsContributor {
  id: string;
  display_name: string;
  slug: string;
  email: string | null;
  contributor_type: string;
  is_active: boolean;
}

export interface CmsArticleAuthorLink {
  contributor_id: string;
  display_order: number;
  is_primary: boolean;
  contributors?: CmsContributor | CmsContributor[] | null;
}

export interface CmsArticleRecord {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string;
  body_html: string | null;
  body_text: string;
  author_name: string;
  image_url: string | null;
  featured_image_alt: string | null;
  status: CmsArticleStatus;
  published_at: string | null;
  scheduled_for: string | null;
  updated_at: string;
  created_at: string;
  category_id: string;
  cover_asset_id: string | null;
  editorial_priority: number;
  allow_comments: boolean;
  categories?: CmsCategory | CmsCategory[] | null;
  article_authors?: CmsArticleAuthorLink[] | null;
}

export interface CmsArticleEditorState {
  id: string | null;
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  bodyHtml: string;
  categoryId: string;
  authorId: string;
  status: CmsArticleStatus;
  publishedAt: string;
  scheduledFor: string;
  editorialPriority: number;
  allowComments: boolean;
  imageAlt: string;
  imageUrl: string;
  coverAssetId: string | null;
  selectedImageFile: File | null;
}
