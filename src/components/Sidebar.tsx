import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { TrendingUp, Calendar, Users, BookOpen, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ArticleSubmissionForm } from "./ArticleSubmissionForm";
import { EventReportForm } from "./EventReportForm";

export function Sidebar() {
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const trendingStories = [
    {
      title: "To Protect the Press is to Protect Democracy",
      category: "Editorial",
      date: "Sep 20, 2024",
    },
    {
      title: "The Algorithm Ate My Homework (and My Job, Too)",
      category: "Opinion",
      date: "Sep 18, 2024",
    },
    {
      title: "From the Courts to the Clicks: Why Reality Wins in the Information Wars",
      category: "Feature",
      date: "Sep 15, 2024",
    },
    {
      title: "HIV Surge: Progress or Crisis?",
      category: "Health",
      date: "Sep 12, 2024",
    },
  ];

  const quickLinks = [
    { label: "Academic Calendar", icon: Calendar },
    { label: "Student Portal", icon: Users },
    { label: "Library", icon: BookOpen },
    { label: "VSU Website", icon: ExternalLink },
  ];

  return (
    <div className="space-y-6">
      {/* Submit Article */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Contribute</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full bg-emerald-700 hover:bg-emerald-800"
            onClick={() => setIsArticleFormOpen(true)}
          >
            Submit an Article
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => setIsEventFormOpen(true)}
          >
            Report an Event
          </Button>
        </CardContent>
      </Card>

      {/* Trending Stories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            More Stories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendingStories.map((story, index) => (
            <div key={index} className="pb-4 border-b border-border last:border-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm leading-tight mb-2 hover:text-emerald-700 cursor-pointer transition-colors">
                    {story.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                      {story.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{story.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>



      {/* Social Media */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Follow Amaranth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
              Facebook
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
              Twitter
            </Button>
            <Button variant="outline" size="sm" className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100">
              Instagram
            </Button>
            <Button variant="outline" size="sm" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
              YouTube
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <ArticleSubmissionForm 
        isOpen={isArticleFormOpen} 
        onClose={() => setIsArticleFormOpen(false)} 
      />
      <EventReportForm 
        isOpen={isEventFormOpen} 
        onClose={() => setIsEventFormOpen(false)} 
      />
    </div>
  );
}