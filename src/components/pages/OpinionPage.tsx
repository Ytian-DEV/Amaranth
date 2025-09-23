import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MessageSquare, ThumbsUp, Eye, Share2, TrendingUp } from "lucide-react";

export function OpinionPage() {
  const opinionPieces = [
    {
      title: "The Future of Education: Embracing Technology While Preserving Human Connection",
      author: "Dr. Elena Martinez",
      role: "Professor of Education",
      excerpt: "As we navigate the digital transformation of education, we must ensure that technology enhances rather than replaces the fundamental human elements of learning...",
      date: "Sep 22, 2024",
      readTime: "6 min read",
      views: 1250,
      likes: 89,
      comments: 24,
      category: "Education"
    },
    {
      title: "Climate Action Starts on Campus: A Student's Perspective",
      author: "Miguel Santos",
      role: "Environmental Science Student",
      excerpt: "University campuses are microcosms of society, and the environmental choices we make here can ripple outward to create lasting change...",
      date: "Sep 20, 2024",
      readTime: "4 min read",
      views: 890,
      likes: 156,
      comments: 32,
      category: "Environment"
    },
    {
      title: "Mental Health Matters: Breaking the Stigma in Academic Settings",
      author: "Sarah Chen",
      role: "Psychology Faculty",
      excerpt: "The pressure to excel academically should never come at the cost of mental well-being. It's time to normalize conversations about mental health...",
      date: "Sep 18, 2024",
      readTime: "5 min read",
      views: 2100,
      likes: 203,
      comments: 67,
      category: "Health"
    },
    {
      title: "The Digital Divide: Ensuring Equal Access to Online Learning",
      author: "Roberto Villanueva",
      role: "IT Department Head",
      excerpt: "As we embrace digital learning platforms, we must address the inequalities that prevent some students from fully participating...",
      date: "Sep 15, 2024",
      readTime: "7 min read",
      views: 756,
      likes: 98,
      comments: 18,
      category: "Technology"
    }
  ];

  const trendingTopics = [
    { topic: "Campus Sustainability", discussions: 45 },
    { topic: "Student Mental Health", discussions: 38 },
    { topic: "Online Learning", discussions: 34 },
    { topic: "Research Funding", discussions: 29 },
    { topic: "Campus Safety", discussions: 27 }
  ];

  const opinionCategories = [
    { name: "Education", count: 23, color: "bg-blue-100 text-blue-700" },
    { name: "Environment", count: 18, color: "bg-green-100 text-green-700" },
    { name: "Technology", count: 15, color: "bg-purple-100 text-purple-700" },
    { name: "Health", count: 12, color: "bg-red-100 text-red-700" },
    { name: "Politics", count: 9, color: "bg-orange-100 text-orange-700" },
    { name: "Culture", count: 14, color: "bg-pink-100 text-pink-700" }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-700" />
          <h1 className="text-3xl font-bold text-foreground">Opinion & Commentary</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Diverse perspectives from the VSU community on issues that matter. Join the conversation and share your voice.
        </p>
      </div>

      {/* Trending Topics */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            Trending Discussions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {trendingTopics.map((topic, index) => (
              <div key={index} className="text-center p-3 border border-emerald-200 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors">
                <div className="font-medium text-emerald-700">{topic.topic}</div>
                <div className="text-xs text-muted-foreground">{topic.discussions} discussions</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Opinion Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {opinionCategories.map((category, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200">
            <CardContent className="p-4 text-center">
              <div className={`px-3 py-1 rounded-full ${category.color} text-sm font-medium mb-2`}>
                {category.name}
              </div>
              <div className="text-xs text-muted-foreground">{category.count} pieces</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Opinion */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-700 text-white">FEATURED</Badge>
            <CardTitle>Editor's Choice</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-emerald-800 mb-2">{opinionPieces[0].title}</h3>
              <div className="flex items-center gap-4 text-sm text-emerald-600 mb-3">
                <span>By {opinionPieces[0].author}</span>
                <span>•</span>
                <span>{opinionPieces[0].role}</span>
                <span>•</span>
                <span>{opinionPieces[0].date}</span>
              </div>
              <p className="text-emerald-700">{opinionPieces[0].excerpt}</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-emerald-600">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{opinionPieces[0].views.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                <span>{opinionPieces[0].likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{opinionPieces[0].comments}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Opinion Pieces */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Recent Opinion Pieces</h2>
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            View All Opinions
          </Button>
        </div>
        
        <div className="space-y-6">
          {opinionPieces.slice(1).map((piece, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold hover:text-emerald-700 cursor-pointer transition-colors mb-2">
                      {piece.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>By {piece.author}</span>
                      <span>•</span>
                      <span>{piece.role}</span>
                      <span>•</span>
                      <span>{piece.date}</span>
                      <span>•</span>
                      <span>{piece.readTime}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    {piece.category}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground mb-4">{piece.excerpt}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{piece.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{piece.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{piece.comments}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-emerald-700 hover:bg-emerald-50">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-4 bg-gradient-to-r from-emerald-50 to-emerald-100 p-8 rounded-lg">
        <h3 className="text-xl font-bold text-emerald-800">Share Your Perspective</h3>
        <p className="text-emerald-700 max-w-md mx-auto">
          Have an opinion on current issues? We welcome thoughtful commentary from the VSU community.
        </p>
        <div className="flex gap-3 justify-center">
          <Button className="bg-emerald-700 hover:bg-emerald-800">
            Submit Opinion Piece
          </Button>
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            Writing Guidelines
          </Button>
        </div>
      </div>
    </div>
  );
}