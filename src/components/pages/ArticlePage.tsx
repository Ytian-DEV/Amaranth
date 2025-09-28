import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar, ArrowLeft, Share2, Loader } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Article, ArticleWithCategory } from "../../types/database";

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

    async function fetchArticle(articleId: string) {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('articles')
          .select(`
            *,
            categories (title, slug, description)
          `)
          .eq('id', articleId)
          .single();

        if (error) {
          setError(error.message);
          return;
        }

        setArticle(data);
      } catch (err) {
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    }

  // Format plain text content with proper paragraphs
  const formatArticleContent = (content: string) => {
    if (!content) return null;
    
    // Split by double newlines for paragraphs
    const paragraphs = content.split('\n\n');
    
    return paragraphs
      .filter(paragraph => paragraph.trim().length > 0)
      .map((paragraph, index) => (
        <p key={index} className="mb-6 leading-relaxed text-gray-700 text-justify">
          {paragraph.trim()}
        </p>
      ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2">Loading article...</span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-0">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 ml-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Button>

        {/* Article Content */}
        <Card>
          <CardContent className="p-3">
          <Badge variant="secondary" className="mb-2 self-start">
            {article.categories?.title}
          </Badge>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

            {/* Meta Information */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-8 pb-6 border-b">
              <div className="flex items-center gap-4">
                <span>By {article.author_name}</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(article.published_date)}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Article Image */}
            {article.image_url && (
              <div className="mb-8">
                <img 
                  src={article.image_url} 
                  alt={article.title}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Article Content with proper formatting */}
            <div className="text-base leading-relaxed space-y-4 mt-6">
              {formatArticleContent(article.contents)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}