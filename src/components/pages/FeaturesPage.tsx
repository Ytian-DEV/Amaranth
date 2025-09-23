import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { NewsCard } from "../NewsCard";
import { Star, Award, Users, BookOpen } from "lucide-react";

export function FeaturesPage() {
  const featuredStories = [
    {
      title: "The Digital Transformation of VSU: Leading Innovation in Education",
      excerpt: "An in-depth look at how Visayas State University is embracing digital technologies to enhance learning experiences and prepare students for the future.",
      author: "Tech Innovation Team",
      date: "Sep 20, 2024",
      category: "Innovation",
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwZWR1Y2F0aW9ufGVufDF8fHx8MTc1ODU1NzY1MXww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Sustainability Champions: VSU's Green Campus Initiative",
      excerpt: "Discover how our university community is working together to create a more sustainable campus through innovative environmental programs.",
      author: "Environmental Committee",
      date: "Sep 18, 2024",
      category: "Environment",
      imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGNhbXB1c3xlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "From Classroom to Community: VSU's Outreach Programs Making a Difference",
      excerpt: "Exploring the impact of university outreach programs on local communities and how students are becoming agents of positive change.",
      author: "Community Relations",
      date: "Sep 15, 2024",
      category: "Community",
      imageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBvdXRyZWFjaHxlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Innovation Hub: Student Entrepreneurs Building Tomorrow's Solutions",
      excerpt: "Meet the young innovators at VSU who are turning their ideas into successful startups and creating solutions for real-world problems.",
      author: "Entrepreneurship Center",
      date: "Sep 12, 2024",
      category: "Innovation",
      imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwaW5ub3ZhdGlvbnxlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
    }
  ];

  const featureCategories = [
    {
      title: "Student Spotlights",
      description: "Celebrating outstanding student achievements",
      icon: Star,
      count: 15,
      color: "bg-yellow-100 text-yellow-700"
    },
    {
      title: "Faculty Excellence",
      description: "Recognizing exceptional faculty contributions",
      icon: Award,
      count: 12,
      color: "bg-blue-100 text-blue-700"
    },
    {
      title: "Campus Life",
      description: "Stories from the heart of university life",
      icon: Users,
      count: 20,
      color: "bg-purple-100 text-purple-700"
    },
    {
      title: "Research Features",
      description: "In-depth coverage of groundbreaking research",
      icon: BookOpen,
      count: 18,
      color: "bg-emerald-100 text-emerald-700"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Star className="w-6 h-6 text-emerald-700" />
          <h1 className="text-3xl font-bold text-foreground">Featured Stories</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          In-depth stories, profiles, and features that showcase the vibrant community and achievements at Visayas State University
        </p>
      </div>

      {/* Featured Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featureCategories.map((category, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-4`}>
                <category.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">{category.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
              <Badge variant="secondary">{category.count} stories</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Featured Story */}
      <Card className="border-emerald-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-700 text-white">FEATURED</Badge>
            <CardTitle>Editor's Pick</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <NewsCard {...featuredStories[0]} featured />
        </CardContent>
      </Card>

      {/* Featured Stories Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Latest Features</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {featuredStories.slice(1).map((story, index) => (
            <NewsCard key={index} {...story} />
          ))}
        </div>
      </div>

      {/* Upcoming Features */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              <span className="text-emerald-700">VSU Alumni Success Stories: Where Are They Now?</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              <span className="text-emerald-700">The Future of Agriculture: VSU's Research Impact</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              <span className="text-emerald-700">Campus Architecture: A Journey Through VSU's Buildings</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center space-y-4 bg-gradient-to-r from-emerald-50 to-emerald-100 p-8 rounded-lg">
        <h3 className="text-xl font-bold text-emerald-800">Have a Story to Share?</h3>
        <p className="text-emerald-700 max-w-md mx-auto">
          We're always looking for compelling stories from our university community
        </p>
        <Button className="bg-emerald-700 hover:bg-emerald-800">
          Submit Your Story
        </Button>
      </div>
    </div>
  );
}