import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { NewsCard } from "../NewsCard";
import { Trophy, Medal, Users, Calendar } from "lucide-react";

export function SportsPage() {
  const sportsNews = [
    {
      title: "VSU Volleyball Team Wins Regional Championship",
      excerpt: "The VSU women's volleyball team secured their third consecutive regional championship with a thrilling victory in the finals.",
      author: "Sports Desk",
      date: "Sep 22, 2024",
      category: "Volleyball",
      imageUrl: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2xsZXliYWxsJTIwdGVhbXxlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Swimming Athletes Break University Records",
      excerpt: "Two VSU swimmers shattered long-standing university records at the national collegiate swimming championships.",
      author: "Aquatics Reporter",
      date: "Sep 20, 2024",
      category: "Swimming",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2ltbWluZyUyMGNvbXBldGl0aW9ufGVufDF8fHx8MTc1ODU1NzY1MXww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Basketball Season Opens with Victory",
      excerpt: "The VSU men's basketball team kicked off the new season with an impressive win against their traditional rivals.",
      author: "Basketball Beat",
      date: "Sep 18, 2024",
      category: "Basketball",
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNrZXRiYWxsJTIwZ2FtZXxlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Track and Field Athletes Qualify for Nationals",
      excerpt: "Five VSU track and field athletes have qualified for the national championships after outstanding performances at regionals.",
      author: "Track Reporter",
      date: "Sep 15, 2024",
      category: "Track & Field",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFjayUyMGFuZCUyMGZpZWxkfGVufDF8fHx8MTc1ODU1NzY1MXww&ixlib=rb-4.1.0&q=80&w=1080"
    }
  ];

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-emerald-700" />
          <h1 className="text-3xl font-bold text-foreground">VSU Sports</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Follow the achievements, competitions, and athletic excellence of Visayas State University's sports teams
        </p>
      </div>

      {/* Sports Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center border-emerald-200">
          <CardContent className="p-6">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">23</div>
            <div className="text-sm text-muted-foreground">Championships</div>
          </CardContent>
        </Card>
        <Card className="text-center border-emerald-200">
          <CardContent className="p-6">
            <Medal className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">156</div>
            <div className="text-sm text-muted-foreground">Student Athletes</div>
          </CardContent>
        </Card>
        <Card className="text-center border-emerald-200">
          <CardContent className="p-6">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">12</div>
            <div className="text-sm text-muted-foreground">Sports Teams</div>
          </CardContent>
        </Card>
        <Card className="text-center border-emerald-200">
          <CardContent className="p-6">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">45</div>
            <div className="text-sm text-muted-foreground">Events This Year</div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Sports News */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Latest Sports News</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sportsNews.map((news, index) => (
            <NewsCard key={index} {...news} />
          ))}
        </div>
      </div>

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