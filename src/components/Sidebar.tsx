import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { TrendingUp, Calendar, Users, BookOpen, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ArticleSubmissionForm } from "./ArticleSubmissionForm";
import { EventReportForm } from "./EventReportForm";
import { url } from "inspector";

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

  const socialMediaLinks = [
    { 
      platform: "facebook" as const, 
      label: "Facebook", 
      icon: "/facebook-logo.svg",
      borderColor: "border-facebook-700",
      url: "https://www.facebook.com/amaranthvsu"
    },
    { 
      platform: "tiktok" as const, 
      label: "TikTok", 
      icon: "/tiktok-logo.svg",
      borderColor: "border-tiktok-700",
      url: "https://www.tiktok.com/@amaranthvsu"
    },
    { 
      platform: "instagram" as const, 
      label: "Instagram", 
      icon: "/instagram-logo.svg",
      borderColor: "border-instagram-700",
      url: "https://www.instagram.com/amaranthvsu"
    },
    { 
      platform: "youtube" as const, 
      label: "YouTube", 
      icon: "/youtube-logo-1.svg",
      borderColor: "border-youtube-700",
      url: "https://www.youtube.com/@amaranthvsu"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submit Article */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-lg">Contribute</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="cursor-pointer w-full bg-emerald-700 hover:bg-emerald-800"
            onClick={() => setIsArticleFormOpen(true)}
          >
            Submit an Article
          </Button>
          <Button 
            variant="outline" 
            className="cursor-pointer w-full border-emerald-200 text-emerald-900 hover:bg-emerald-50 hover:text-emerald-500"
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
        <CardHeader className="pb-1">
          <CardTitle className="text-lg">Follow Amaranth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {socialMediaLinks.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex" // This ensures the link doesn't break flex layout
              >
                <Button
                  variant={social.platform}
                  size="sm"
                  className="w-full"
                  asChild // This makes the Button render as a child of the anchor
                >
                  <span> {/* Additional wrapper span for proper styling */}
                    <img 
                      src={social.icon} 
                      alt={social.label} 
                      className="w-4 h-4" 
                    />
                    {social.label}
                  </span>
                </Button>
              </a>
            ))}
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