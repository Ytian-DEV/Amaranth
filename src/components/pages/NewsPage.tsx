import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { NewsCard } from "../NewsCard";
import { Calendar, TrendingUp, Filter, Search } from "lucide-react";
import { Input } from "../ui/input";

export function NewsPage() {
  const newsArticles = [
    {
      title: "University President Inaugurates New Research Facility",
      excerpt: "VSU opens state-of-the-art research facility to advance scientific studies and innovation in the region.",
      author: "Maria Rodriguez",
      date: "Sep 22, 2024",
      category: "News",
      imageUrl: "https://images.unsplash.com/photo-1618053238059-cc7761222f2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2llbmNlJTIwbGFib3JhdG9yeSUyMHJlc2VhcmNofGVufDF8fHx8MTc1ODUwMDg1N3ww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "VSU Receives Recognition for Sustainable Campus Initiatives",
      excerpt: "The university's commitment to environmental sustainability earns national recognition from the Department of Environment.",
      author: "Environmental Team",
      date: "Sep 21, 2024",
      category: "News",
      imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGNhbXB1cyUyMGVudmlyb25tZW50fGVufDF8fHx8MTc1ODU1NzY1MXww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "New Academic Programs Launch for 2024-2025",
      excerpt: "VSU introduces innovative degree programs in data science, renewable energy, and digital marketing to meet industry demands.",
      author: "Academic Affairs",
      date: "Sep 20, 2024",
      category: "News",
      imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2xhc3Nyb29tfGVufDF8fHx8MTc1ODU1NzY1MXww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "International Partnership Agreement Signed",
      excerpt: "VSU forms strategic partnership with leading universities in Southeast Asia to enhance academic collaboration.",
      author: "International Affairs",
      date: "Sep 19, 2024",
      category: "News",
      imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcm5hdGlvbmFsJTIwcGFydG5lcnNoaXB8ZW58MXx8fHwxNzU4NTU3NjUxfDA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Campus Infrastructure Modernization Begins",
      excerpt: "Major renovation project kicks off to upgrade campus facilities and improve student learning environments.",
      author: "Campus Development",
      date: "Sep 18, 2024",
      category: "News",
      imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzU4NTU3NjUxfDA&ixlib=rb-4.1.0&q=80&w=1080"
    }
  ];

  const breakingNews = [
    "VSU receives P50M research grant from DOST",
    "New student dormitory construction approved",
    "VSU alumni wins international research award"
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-700" />
          <h1 className="text-3xl font-bold text-foreground">Latest News</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Stay updated with the latest happenings, announcements, and developments at Visayas State University
        </p>
      </div>

      {/* Breaking News Ticker */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Badge className="bg-red-600 text-white">BREAKING</Badge>
            Breaking News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {breakingNews.map((news, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span className="text-emerald-800">{news}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search news articles..." 
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          <Filter className="w-4 h-4 mr-2" />
          Filter by Date
        </Button>
      </div>

      {/* News Articles Grid */}
      <div className="space-y-6">
        {newsArticles.map((article, index) => (
          <NewsCard key={index} {...article} />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-8">
        <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800">
          Load More Articles
        </Button>
      </div>

      {/* News Categories */}
      <Card>
        <CardHeader>
          <CardTitle>News Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Campus Updates", count: 24 },
              { name: "Academic News", count: 18 },
              { name: "Research", count: 15 },
              { name: "Student Life", count: 12 },
              { name: "Faculty", count: 10 },
              { name: "Alumni", count: 8 },
              { name: "Events", count: 20 },
              { name: "Announcements", count: 16 }
            ].map((category, index) => (
              <div key={index} className="text-center p-4 border border-emerald-200 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors">
                <div className="font-medium text-emerald-700">{category.name}</div>
                <div className="text-sm text-muted-foreground">{category.count} articles</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}