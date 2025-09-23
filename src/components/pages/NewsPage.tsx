import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar, Filter, Search, Loader, FileText } from "lucide-react";
import { Input } from "../ui/input";
import { supabase } from "../../lib/supabase";
import type { Article } from "../../types/database";

interface NewsPageProps {
  activeCategory?: string;
}

export function NewsPage({ activeCategory }: NewsPageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Map URL categories to database category titles
  const categoryMap: { [key: string]: string } = {
    'news': 'News',
    'views': 'Views',
    'sports': 'Sports',
    'feature': 'Feature',
    's&t': 'S&T',
    'literary': 'Literary',
    'blog': 'Blog',
    'specials': 'Specials',
    'investigative': 'Investigative',
    'explainer': 'Explainer',
    'bulletin': 'Bulletin',
    'stories': 'Stories'
  };

  // Function to handle article click
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
      
      console.log('Fetching articles for category:', activeCategory);
      console.log('Mapped category:', activeCategory ? categoryMap[activeCategory] : 'All');
      
      let query = supabase
        .from('articles')
        .select('*')
        .eq('publish', true)
        .order('published_date', { ascending: false });

      // Filter by category if activeCategory is provided and exists in map
      if (activeCategory && categoryMap[activeCategory]) {
        const dbCategory = categoryMap[activeCategory];
        console.log('Filtering by category:', dbCategory);
        query = query.eq('category_title', dbCategory);
      }

      // Search filter if searchQuery exists
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,contents.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message);
        return;
      }

      console.log('Fetched articles:', data);
      setArticles(data || []);
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }

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
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Category: {activeCategory ? categoryMap[activeCategory] || activeCategory : 'All'}</span>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Found {articles.length} article{articles.length !== 1 ? 's' : ''}
      </div>

      {/* Articles Grid */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard 
            key={article.id} 
            article={article} 
            onClick={() => handleArticleClick(article.id)}
          />
        ))}
      </div>

      {articles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">
              {searchQuery 
                ? `No articles match your search for "${searchQuery}"`
                : activeCategory
                ? `No articles found in the ${categoryMap[activeCategory] || activeCategory} category`
                : 'No articles have been published yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual Article Card Component with click functionality
interface ArticleCardProps {
  article: Article;
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
      className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Article Image */}
        {article.image_url && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={article.image_url} 
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        
        <div className="p-4">
          {/* Category Badge */}
          <Badge variant="secondary" className="mb-2">
            {article.category_title}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-emerald-700 transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {article.excerpt}
          </p>

          {/* Author and Date */}
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