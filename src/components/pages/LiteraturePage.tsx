import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { BookOpen, PenTool, Heart, Quote } from "lucide-react";

export function LiteraturePage() {
  const literaryWorks = [
    {
      title: "Whispers of the Visayan Sea",
      author: "Maria Elena Santos",
      category: "Poetry",
      excerpt: "A collection of verses inspired by the beauty and mystery of the seas surrounding the Visayan islands...",
      date: "Sep 20, 2024",
      readTime: "5 min read"
    },
    {
      title: "The Last Harvest",
      author: "Carlos Miguel Rodriguez",
      category: "Short Story",
      excerpt: "A poignant tale of a farming family facing the challenges of modernization while preserving tradition...",
      date: "Sep 18, 2024",
      readTime: "12 min read"
    },
    {
      title: "Fragments of Memory",
      author: "Ana Lucia Villanueva",
      category: "Essay",
      excerpt: "Reflections on childhood memories and the passage of time in a small university town...",
      date: "Sep 15, 2024",
      readTime: "8 min read"
    },
    {
      title: "Moonlit Conversations",
      author: "Joshua Rafael Cruz",
      category: "Poetry",
      excerpt: "An exploration of late-night thoughts and dreams through lyrical expression...",
      date: "Sep 12, 2024",
      readTime: "4 min read"
    }
  ];

  const featuredQuote = {
    text: "Literature is the most agreeable way of ignoring life.",
    author: "Fernando Pessoa",
    context: "This month's featured quote reminds us of literature's power to transport us beyond the ordinary."
  };

  const literaryEvents = [
    {
      title: "Poetry Reading Night",
      date: "Oct 5, 2024",
      venue: "VSU Library Auditorium",
      description: "Join us for an evening of poetry readings by students and faculty"
    },
    {
      title: "Creative Writing Workshop",
      date: "Oct 12, 2024",
      venue: "Arts Building Room 204",
      description: "Learn techniques for crafting compelling short stories"
    },
    {
      title: "Book Club Meeting",
      date: "Oct 18, 2024",
      venue: "Student Center",
      description: "Discussion of this month's selected contemporary Filipino literature"
    }
  ];

  const categories = [
    { name: "Poetry", count: 24, icon: Heart, color: "bg-pink-100 text-pink-700" },
    { name: "Short Stories", count: 18, icon: BookOpen, color: "bg-blue-100 text-blue-700" },
    { name: "Essays", count: 15, icon: PenTool, color: "bg-purple-100 text-purple-700" },
    { name: "Reviews", count: 12, icon: Quote, color: "bg-emerald-100 text-emerald-700" }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-700" />
          <h1 className="text-3xl font-bold text-foreground">Literature</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore the creative expressions of the VSU community through poetry, prose, essays, and literary criticism
        </p>
      </div>

      {/* Featured Quote */}
      <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
        <CardContent className="p-8 text-center">
          <Quote className="w-8 h-8 text-emerald-600 mx-auto mb-4" />
          <blockquote className="text-xl italic text-emerald-800 mb-4">
            "{featuredQuote.text}"
          </blockquote>
          <cite className="text-emerald-700 font-medium">— {featuredQuote.author}</cite>
          <p className="text-sm text-emerald-600 mt-2">{featuredQuote.context}</p>
        </CardContent>
      </Card>

      {/* Literary Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-4`}>
                <category.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">{category.name}</h3>
              <Badge variant="secondary">{category.count} pieces</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Literary Works */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Recent Publications</h2>
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            View All Works
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {literaryWorks.map((work, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-emerald-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg hover:text-emerald-700 cursor-pointer transition-colors">
                      {work.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">by {work.author}</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    {work.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{work.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{work.date}</span>
                  <span>{work.readTime}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Literary Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Literary Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {literaryEvents.map((event, index) => (
              <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border border-emerald-200 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-emerald-700">{event.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.venue}</p>
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

      {/* Submission Guidelines */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800">Submit Your Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-emerald-700">
              We welcome original literary works from students, faculty, and staff. Share your creativity with the VSU community.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Accepted Formats:</h4>
                <ul className="text-sm text-emerald-600 space-y-1">
                  <li>• Poetry (any style or form)</li>
                  <li>• Short stories (up to 5,000 words)</li>
                  <li>• Personal essays</li>
                  <li>• Literary criticism and reviews</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-2">Submission Guidelines:</h4>
                <ul className="text-sm text-emerald-600 space-y-1">
                  <li>• Original, unpublished works only</li>
                  <li>• Include author bio (50 words max)</li>
                  <li>• Format: .doc or .docx files</li>
                  <li>• Review period: 2-4 weeks</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-emerald-700 hover:bg-emerald-800">
                Submit Your Work
              </Button>
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                Submission Guidelines
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}