import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { NewsCard } from "./components/NewsCard";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { SectionContent } from "./components/SectionContent";
import { Dashboard } from "./components/Dashboard";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { ArrowRight, Clock, TrendingUp } from "lucide-react";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [activeSection, setActiveSection] = useState("news");
  const [user, setUser] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Check for existing login on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem("amaranth_user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem("amaranth_user");
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setShowDashboard(true);
  };

  const handleLogout = () => {
    setUser(null);
    setShowDashboard(false);
    localStorage.removeItem("amaranth_user");
  };

  const featuredNews = {
    title: "Bright Eyes in Deep Guise: Tarsier Sightings in VSU",
    excerpt: "Tarsier sightings within the VSU campus have been noted, which is a reminder of the biodiversity that exists within and around the campus. As VSUnians and advocates for environmental conservation, students are encouraged to be aware of their presence but also to value their significance.",
    author: "Angela Santos",
    date: "Sep 23, 2024",
    category: "Environment",
    imageUrl: "https://images.unsplash.com/photo-1757949640645-32b5f36650c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx0YXJzaWVyJTIwd2lsZGxpZmUlMjBwaGlsaXBwaW5lc3xlbnwxfHx8fDE3NTg1OTk2ODR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  };

  const recentNews = [
    {
      title: "University President Inaugurates New Research Facility",
      excerpt: "VSU opens state-of-the-art research facility to advance scientific studies and innovation in the region.",
      author: "Maria Rodriguez",
      date: "Sep 22, 2024",
      category: "News",
      imageUrl: "https://images.unsplash.com/photo-1618053238059-cc7761222f2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2llbmNlJTIwbGFib3JhdG9yeSUyMHJlc2VhcmNofGVufDF8fHx8MTc1ODUwMDg1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      title: "Student Achievement: VSU Team Wins National Competition",
      excerpt: "Our engineering students brought home the gold in the national robotics competition, showcasing VSU's academic excellence.",
      author: "John Cruz",
      date: "Sep 21, 2024",
      category: "Achievement",
      imageUrl: "https://images.unsplash.com/photo-1693011142814-aa33d7d1535c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwc3R1ZGVudHN8ZW58MXx8fHwxNzU4NTU3NjUxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      title: "Graduation Ceremony: A New Chapter Begins",
      excerpt: "Hundreds of VSU graduates celebrated their academic achievements in a memorable ceremony filled with pride and hope.",
      author: "Sarah Villanueva",
      date: "Sep 20, 2024",
      category: "Events",
      imageUrl: "https://images.unsplash.com/photo-1738949538943-e54722a44ffc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwY2VyZW1vbnklMjB1bml2ZXJzaXR5fGVufDF8fHx8MTc1ODU3NDE1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ];

  // Show dashboard if user is logged in and wants dashboard view
  if (user && showDashboard) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      {/* Dashboard Access Button for Logged Users */}
      {user && !showDashboard && (
        <div className="bg-emerald-50 border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700">
                Welcome back, {user.name}! You have admin access.
              </span>
              <Button 
                size="sm" 
                onClick={() => setShowDashboard(true)}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Breaking News Banner */}
      <div className="bg-emerald-700 text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-yellow-400 text-emerald-900 font-semibold">
              BREAKING
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>Latest: VSU receives recognition for sustainable campus initiatives</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {activeSection === "news" ? (
              <>
                {/* Featured Story */}
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                    <h2 className="text-2xl font-bold text-foreground">Featured Story</h2>
                  </div>
                  <NewsCard {...featuredNews} featured />
                </section>

                {/* Recent News */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Recent News</h2>
                    <Button 
                      variant="outline" 
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => setActiveSection("news")}
                    >
                      View All News
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recentNews.map((news, index) => (
                      <NewsCard key={index} {...news} />
                    ))}
                  </div>
                </section>

                {/* Load More */}
                <div className="text-center pt-8">
                  <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800">
                    Load More Stories
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <SectionContent section={activeSection} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>

      <Footer onSectionChange={setActiveSection} />
      <Toaster />
    </div>
  );
}