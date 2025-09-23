import { useState } from "react";
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
  Globe
} from "lucide-react";
import { ArticleSubmissionForm } from "./ArticleSubmissionForm";

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);

  const analyticsData = {
    totalViews: 15420,
    totalArticles: 342,
    totalUsers: 1250,
    activeUsers: 89,
    weeklyGrowth: 12.5,
    monthlyViews: 8760,
    topCategories: [
      { name: "News", count: 124, percentage: 36 },
      { name: "Sports", count: 89, percentage: 26 },
      { name: "Feature", count: 67, percentage: 20 },
      { name: "Literature", count: 45, percentage: 13 },
      { name: "Views", count: 17, percentage: 5 }
    ],
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
                <h1 className="text-2xl font-bold text-gray-900">Amaranth Dashboard</h1>
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analyticsData.weeklyGrowth}% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published Articles</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalArticles}</div>
                  <p className="text-xs text-muted-foreground">
                    12 articles this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsData.activeUsers} active now
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Views</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.monthlyViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +20% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Content Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" style={{
                            backgroundColor: `hsl(${120 + index * 30}, 60%, 50%)`
                          }} />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{category.count} articles</span>
                          <Badge variant="secondary">{category.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{activity.time}</span>
                            <span>•</span>
                            <span>{activity.author}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">User Analytics</h3>
                  <p className="text-muted-foreground">
                    Track user engagement and manage user accounts
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Page Views Today</span>
                      <span className="font-bold">2,341</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Unique Visitors</span>
                      <span className="font-bold">1,892</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bounce Rate</span>
                      <span className="font-bold">23.4%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Avg. Session Duration</span>
                      <span className="font-bold">4m 32s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { title: "Tarsier Sightings in VSU", views: 1250 },
                      { title: "New Research Facility", views: 890 },
                      { title: "Basketball Season Opens", views: 756 },
                      { title: "Student Achievement Awards", views: 634 },
                      { title: "Campus Sustainability", views: 567 }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm truncate">{item.title}</span>
                        <span className="text-sm font-medium">{item.views} views</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full justify-start bg-emerald-700 hover:bg-emerald-800">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Article
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Manage Drafts
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Posts
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Media Library</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-sm text-muted-foreground">Upload images and files</p>
                      </div>
                      <Button variant="outline" className="w-full">
                        Browse Media
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {["News", "Sports", "Features", "Literature", "Opinion", "Blogs"].map((cat, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{cat}</span>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: "Campus Events Update", author: "Maria Santos", status: "Pending Review", date: "2 hours ago" },
                      { title: "Sports Championship Coverage", author: "John Cruz", status: "Published", date: "1 day ago" },
                      { title: "Student Interview Feature", author: "Sarah Chen", status: "Draft", date: "3 days ago" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">by {item.author} • {item.date}</p>
                        </div>
                        <Badge variant={item.status === "Published" ? "default" : item.status === "Pending Review" ? "secondary" : "outline"}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                    <div>
                      <label className="text-sm font-medium">Contact Email</label>
                      <input className="w-full mt-1 p-2 border rounded-md" defaultValue="amaranth@vsu.edu.ph" />
                    </div>
                    <Button className="bg-emerald-700 hover:bg-emerald-800">
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Users</span>
                      <span className="font-bold">1,250</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active Writers</span>
                      <span className="font-bold">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Approvals</span>
                      <span className="font-bold">5</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      Manage User Roles
                    </Button>
                    <Button variant="outline" className="w-full">
                      View Access Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Joomla Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Database Connection</span>
                      <Badge className="bg-green-100 text-green-700">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>API Status</span>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Sync</span>
                      <span className="text-sm text-muted-foreground">2 minutes ago</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      Sync with Joomla
                    </Button>
                    <Button variant="outline" className="w-full">
                      View Integration Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Last Backup</span>
                      <span className="text-sm text-muted-foreground">Today, 3:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Security Status</span>
                      <Badge className="bg-green-100 text-green-700">Secure</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                      Create Backup
                    </Button>
                    <Button variant="outline" className="w-full">
                      Security Settings
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