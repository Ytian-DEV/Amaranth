import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Trophy, Medal, Users, Calendar, Loader, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import type { ArticleWithCategory } from "../../types/database";

export function SportsPage() {
  const [sportsNews, setSportsNews] = useState<ArticleWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define sports categories similar to NewsPage
  const sportsTypes = [
    { key: 'latest-sports', title: 'Latest Sports News', category: null },
    { key: 'salingkusog', title: 'Salingkusog', category: 'Sports - Salingkusog' },
    { key: 'scuaa', title: 'SCUAA', category: 'Sports - SCUAA' },
    { key: 'nat-sports', title: 'National Sports News', category: 'Sports - National Sports News' },
    { key: 'sports-feature', title: 'Sports Feature', category: 'Sports - Sports Feature' },
    { key: 'world-sports', title: 'World Sports News', category: 'Sports - World Sports News' }
  ] as const;

  const sportsTeams = [
    { name: "Basketball", season: "Active", record: "12-3", status: "Winning Streak" },
    { name: "Volleyball", season: "Active", record: "15-1", status: "Champions" },
    { name: "Swimming", season: "Active", record: "8-2", status: "Strong Performance" },
    { name: "Track & Field", season: "Active", record: "6-1", status: "Nationals Bound" },
    { name: "Football", season: "Off-Season", record: "10-4", status: "Training" },
    { name: "Tennis", season: "Active", record: "7-3", status: "Competitive" }
  ];

  const upcomingEvents = [
    { event: "Basketball vs. Central University", date: "Sep 25, 2024", venue: "VSU Gymnasium" },
    { event: "Swimming Championships", date: "Sep 28, 2024", venue: "Aquatic Center" },
    { event: "Volleyball Finals", date: "Oct 2, 2024", venue: "Sports Complex" },
    { event: "Track & Field Nationals", date: "Oct 8, 2024", venue: "National Stadium" }
  ];

  // Fetch sports articles from Supabase
  useEffect(() => {
    const fetchSportsArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch articles WITH category information (join categories table)
        const { data, error } = await supabase
          .from('articles')
          .select(`
            *,
            categories!inner (
              title,
              slug,
              description
            )
          `)
          .eq('publish', true)
          .order('published_date', { ascending: false });

        if (error) {
          console.error('Error fetching articles:', error);
          setError(error.message);
          return;
        }
        
        // Define sports categories based on TITLES from your CSV
        const sportsCategoryTitles = [
          'Sports - Salingkusog',
          'Sports - SCUAA', 
          'Sports - National Sports News',
          'Sports - Sports Feature',
          'Sports - World Sports News'
        ];
        
        // Filter for sports articles using category TITLES
        const filteredData = (data || []).filter((article) => {
          const categoryTitle = article.categories?.title || '';
          return sportsCategoryTitles.includes(categoryTitle);
        });
        
        // Sort by date
        const sortedData = filteredData.sort((a, b) => 
          new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
        );
        
        setSportsNews(sortedData as ArticleWithCategory[]);
      } catch (error) {
        console.error('Error fetching sports articles:', error);
        setError('Failed to load sports articles');
        setSportsNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSportsArticles();
  }, []);

  // Filter articles for each sports type
  const getArticlesForType = (sportsType: typeof sportsTypes[number]) => {
    if (sportsType.key === 'latest-sports') {
      // Latest Sports: Show latest 3 articles from all sports types
      return sportsNews.slice(0, 3);
    }
    
    return sportsNews.filter(article => 
      article.categories?.title === sportsType.category
    );
  };

  const handleArticleClick = (articleId: string) => {
    window.location.href = `/article/${articleId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2">Loading sports articles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Sports News Categories - Similar to NewsPage layout */}
      {sportsTypes.map((sportsType) => {
        const typeArticles = getArticlesForType(sportsType);
        
        if (typeArticles.length === 0) return null;

        return (
          <section key={sportsType.key} className="space-y-6">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">{sportsType.title}</h2>
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

      {/* Show message if no sports articles found */}
      {sportsNews.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sports articles found</h3>
            <p className="text-gray-600">
              No sports articles have been published yet
            </p>
          </CardContent>
        </Card>
      )}

      {/* Teams Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Teams Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sportsTeams.map((team, index) => (
              <div key={index} className="p-4 border border-emerald-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-emerald-700">{team.name}</h3>
                  <Badge variant={team.season === "Active" ? "default" : "secondary"}>
                    {team.season}
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Record:</span>
                    <span className="font-medium">{team.record}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-emerald-600">{team.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-white rounded-lg border border-emerald-200">
                <div>
                  <h4 className="font-medium text-emerald-700">{event.event}</h4>
                  <p className="text-sm text-muted-foreground">{event.venue}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    {event.date}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center space-y-4 bg-gradient-to-r from-emerald-50 to-emerald-100 p-8 rounded-lg">
        <h3 className="text-xl font-bold text-emerald-800">Join VSU Sports</h3>
        <p className="text-emerald-700 max-w-md mx-auto">
          Interested in representing VSU in athletics? Learn about tryouts and team opportunities
        </p>
        <div className="flex gap-3 justify-center">
          <Button className="bg-emerald-700 hover:bg-emerald-800">
            Tryout Information
          </Button>
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            View Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}

// Individual Article Card Component (Same as NewsPage)
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

          <h3 className="font-semibold text-emerald-600 text-lg mb-2 line-clamp-2 group-hover:text-light-gray transition-colors flex-1">
            {article.title}
          </h3>

          <p className="text-light-gray text-sm mb-3 line-clamp-3">
            {article.excerpt || (article.contents ? article.contents.substring(0, 150) + '...' : 'No content available')}
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