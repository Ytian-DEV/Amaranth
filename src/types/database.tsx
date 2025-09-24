export interface Article {
  id: string
  title: string
  slug: string
  contents: string
  excerpt: string
  category: string
  author_name: string
  published_date: string
  image_url: string | null
  publish: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  title: string
  slug: string
  description: string | null
  position: number
  active: boolean
}

export interface Author {
  id: string
  name: string
  email: string
  username: string
  position: string | null
  bio: string | null
  active: boolean
}

export interface ArticleWithCategory extends Article {
  categories?: {
    title: string;
    slug: string;
    description: string;
  };
}