import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Eye, 
  TrendingUp, 
  Calendar, 
  Plus,
  Settings,
  LogOut,
  Activity,
  MessageSquare,
  Globe,
  Database
} from "lucide-react";
import { ArticleSubmissionForm } from "./ArticleSubmissionForm";
import { supabase } from "../lib/supabase";
import type { Article } from "../types/database";

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    totalViews: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch articles count
      const { count: totalArticles, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });

      const { count: publishedArticles, error: publishedError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('publish', true);

      // Fetch recent articles
      const { data: recentArticles, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!countError && !publishedError && !articlesError) {
        setStats({
          totalArticles: totalArticles || 0,
          publishedArticles: publishedArticles || 0,
          totalViews: 0 // You can add view tracking later
        });
        setArticles(recentArticles || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const analyticsData = {
    totalViews: stats.totalViews,
    totalArticles: stats.totalArticles,
    publishedArticles: stats.publishedArticles,
    activeUsers: 89,
    weeklyGrowth: 12.5,
    monthlyViews: 8760,
    recentActivity: [
      { action: "New article published", time: "2 hours ago", author: "Maria Rodriguez" },
      { action: "User registration", time: "4 hours ago", author: "New User" },
      { action: "Comment added", time: "6 hours ago", author: "John Cruz" },
      { action: "Article edited", time: "1 day ago", author: "Sarah Chen" }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Amaranth Website Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsArticleFormOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Article
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalArticles}</div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsData.publishedArticles} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published Articles</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.publishedArticles}</div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsData.totalArticles - analyticsData.publishedArticles} drafts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Database Status</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Connected</div>
                  <p className="text-xs text-muted-foreground">
                    Supabase integration active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Articles */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {articles.map((article) => (
                    <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{article.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {article.category_title} • {new Date(article.published_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={article.publish ? "default" : "outline"}>
                        {article.publish ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  ))}
                  {articles.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No articles found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <CardTitle>Article Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Manage Your Articles</h3>
                  <p className="text-muted-foreground mb-4">
                    Create, edit, and publish articles directly from the dashboard
                  </p>
                  <Button 
                    onClick={() => setIsArticleFormOpen(true)}
                    className="bg-emerald-700 hover:bg-emerald-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Article
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Website Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Site Title</label>
                      <input className="w-full mt-1 p-2 border rounded-md" defaultValue="Amaranth - VSU Student Publication" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Site Description</label>
                      <textarea className="w-full mt-1 p-2 border rounded-md" rows={3} defaultValue="The official student publication of Visayas State University" />
                    </div>
                    <Button className="bg-emerald-700 hover:bg-emerald-800">
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Supabase Connection</span>
                      <Badge className="bg-green-100 text-green-700">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Articles in Database</span>
                      <span className="font-bold">{stats.totalArticles}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Published Articles</span>
                      <span className="font-bold">{stats.publishedArticles}</span>
                    </div>
                    <Button variant="outline" className="w-full" onClick={fetchDashboardData}>
                      Refresh Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ArticleSubmissionForm 
        isOpen={isArticleFormOpen} 
        onClose={() => setIsArticleFormOpen(false)} 
      />
    </div>
  );
}