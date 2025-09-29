import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar, Filter, Search, Loader, FileText } from "lucide-react";
import { Input } from "../ui/input";
import { supabase } from "../../lib/supabase";
import type { Article, ArticleWithCategory } from "../../types/database";

interface bulletinPageProps {
  activeCategory?: string;
}

// Define the bulletin types we want to display in columns
const bulletinTypes = [
  { key: 'latest-bulletin', title: 'Latest Bulletin', category: null },
  { key: 'board-passers', title: 'Board Passers', category: 'Bulletin - Board Passers' },
  { key: 'jobs', title: 'Job Posting', category: 'Bulletin - Jobs' },
  { key: 'announcement', title: 'Official Annoucement', category: 'Bulletin - Official Annoncement' },
  { key: 'council', title: 'Student Council', category: 'Bulletin - Student Council' },
  { key: 'organization', title: 'Student Organization', category: 'Bulletin - Student Organization' },
  { key: 'events', title: 'Events', category: 'Bulletin - Events'}
] as const;

export function BulletinPage({ activeCategory }: bulletinPageProps) {
  const [articles, setArticles] = useState<ArticleWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
  };

  useEffect(() => {
    fetchArticles();
  }, [activeCategory, searchQuery]);

  async function fetchArticles() {
    try {
      setLoading(true);
      setError(null);
      
      // Build the base query with JOIN
      let query = supabase
        .from('articles')
        .select(`
          *,
          categories!inner (
            title,
            slug,
            description
          )
        `)
        .eq('publish', true);

      // Apply search filter if needed
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,contents.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      // Add ordering and execute
      const { data, error } = await query.order('published_date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message);
        return;
      }

      // Filter for bulletin categories only using the joined category title
      const bulletinArticles = (data || []).filter(article => 
        article.categories?.title?.includes('Bulletin -')
      );

      setArticles(bulletinArticles as ArticleWithCategory[]);
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }

  // Filter articles for each bulletin type
  const getArticlesForType = (bulletinType: typeof bulletinTypes[number]) => {
    if (bulletinType.key === 'latest-bulletin') {
      // Latest bulletin: Show latest 3 articles from all bulletin types
      return articles.slice(0, 3);
    }
    
    return articles.filter(article => 
      article.categories?.title === bulletinType.category
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2">Loading articles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={fetchArticles} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* bulletin Columns */}
      {bulletinTypes.map((bulletinType) => {
        const typeArticles = getArticlesForType(bulletinType);
        
        if (typeArticles.length === 0) return null;

        return (
          <section key={bulletinType.key} className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">{bulletinType.title}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {typeArticles.map((article) => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  onClick={() => handleArticleClick(article.id)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {articles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bulletin articles found</h3>
            <p className="text-gray-600">
              {searchQuery 
                ? `No bulletin articles match your search for "${searchQuery}"`
                : 'No bulletin articles have been published yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual Article Card Component
interface ArticleCardProps {
  article: ArticleWithCategory;
  onClick: () => void;
}

function ArticleCard({ article, onClick }: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card 
      className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {article.image_url && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={article.image_url} 
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        
        <div className="p-4 flex-1 flex flex-col">
          <Badge variant="secondary" className="mb-2 self-start">
            {article.categories?.title || 'Uncategorized'}
          </Badge>

          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors flex-1">
            {article.title}
          </h3>

          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {article.excerpt}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
            <span>By {article.author_name}</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(article.published_date)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}