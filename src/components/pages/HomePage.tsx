import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Calendar, Loader, FileText, Trophy, Star, TrendingUp, Flame, ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Article } from "../../types/database";

export function HomePage() {
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [topArticles, setTopArticles] = useState<Article[]>([]);
  const [hottestArticles, setHottestArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomepageArticles();
  }, []);

  async function fetchHomepageArticles() {
    try {
      setLoading(true);
      
      // Fetch articles WITH category information
      const { data: articlesData } = await supabase
        .from('articles')
        .select(`
          *,
          categories!inner (
            title
          )
        `)
        .eq('publish', true)
        .order('published_date', { ascending: false })
        .limit(12); // Fetch more since we need for all sections

      if (articlesData) {
        // Map the data to include category_title directly
        const mappedArticles = articlesData.map(article => ({
          ...article,
          category_title: article.categories?.title || 'Uncategorized'
        }));

        // Split into sections
        setLatestArticles(mappedArticles.slice(0, 4));
        setTopArticles(mappedArticles.slice(4, 8));
        setHottestArticles(mappedArticles.slice(8, 12));
      }
      
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Component for big article + 3 small articles layout
  const ArticleSection = ({ title, icon, articles, iconColor }: { 
    title: string; 
    icon: React.ReactNode; 
    articles: Article[];
    iconColor: string;
  }) => {
    if (articles.length === 0) return null;

    const bigArticle = articles[0];
    const smallArticles = articles.slice(1, 4);

    return (
      <section className="space-y-4 mb-16">
        <div className="flex items-center gap-3">
          <div className={iconColor}>
            {icon}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <BigArticleCard article={bigArticle} />
          </div>
          
          <div className="lg:col-span-2 space-y-4">
            {smallArticles.map((article, index) => (
              <SmallArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-16">
      <ArticleSection 
        title="Latest Articles" 
        icon={<TrendingUp className="h-6 w-6" />} 
        articles={latestArticles}
        iconColor="text-blue-500"
      />

      <ArticleSection 
        title="Top Articles" 
        icon={<Star className="h-6 w-6" />} 
        articles={topArticles}
        iconColor="text-yellow-500"
      />

      <ArticleSection 
        title="Hottest Articles" 
        icon={<Flame className="h-6 w-6" />} 
        articles={hottestArticles}
        iconColor="text-red-500"
      />

      {/* Quick Links */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
        <Button onClick={() => navigate('/news')} variant="outline" className="h-20">
          <div className="text-center">
            <FileText className="h-6 w-6 mx-auto mb-2" />
            <span>All News</span>
          </div>
        </Button>
        <Button onClick={() => navigate('/sports')} variant="outline" className="h-20">
          <div className="text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2" />
            <span>Sports</span>
          </div>
        </Button>
        <Button onClick={() => navigate('/features')} variant="outline" className="h-20">
          <div className="text-center">
            <Star className="h-6 w-6 mx-auto mb-2" />
            <span>Features</span>
          </div>
        </Button>
        <Button onClick={() => navigate('/literary')} variant="outline" className="h-20">
          <div className="text-center">
            <FileText className="h-6 w-6 mx-auto mb-2" />
            <span>Literary</span>
          </div>
        </Button>
      </section>
    </div>
  );
}

// Big Article Card Component
function BigArticleCard({ article }: { article: any }) {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCardClick = () => {
    navigate(`/article/${article.id}`);
  };

  return (
    <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 h-full" onClick={handleCardClick}>
      {article.image_url && (
        <img 
          src={article.image_url} 
          alt={article.title}
          className="w-full h-64 object-cover rounded-t-lg"
        />
      )}
      <CardContent className="p-6">
        {/* Category below image, above title */}
        {article.category_title && (
          <span className="text-gray-400 text-sm font-medium mb-2 block">{article.category_title}</span>
        )}
        <h3 className="font-bold text-2xl mb-3 line-clamp-3">{article.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
        
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/article/${article.id}`);
          }}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 w-full justify-center bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
        >
          Read More
          <ArrowRight className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
          <span>{formatDate(article.published_date)}</span>
          <span>By {article.author_name}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Small Article Card Component
function SmallArticleCard({ article, index }: { article: any; index: number }) {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCardClick = () => {
    navigate(`/article/${article.id}`);
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-300" onClick={handleCardClick}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {article.image_url && (
            <img 
              src={article.image_url} 
              alt={article.title}
              className="w-16 h-16 object-cover rounded flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            {/* Category above title */}
            {article.category_title && (
              <span className="text-gray-400 text-xs font-medium mb-1 block">{article.category_title}</span>
            )}
            <h4 className="font-semibold text-sm mb-2 line-clamp-2">{article.title}</h4>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>{formatDate(article.published_date)}</span>
              <span>By {article.author_name}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}