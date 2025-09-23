import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { NewsCard } from "./NewsCard";
import { FileText, Calendar, Users, BookOpen } from "lucide-react";
import { AboutPage } from "./pages/AboutPage";
import { EditorialBoardPage } from "./pages/EditorialBoardPage";
import { ArchivesPage } from "./pages/ArchivesPage";
import { ContactPage } from "./pages/ContactPage";
import { NewsPage } from "./pages/NewsPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { SportsPage } from "./pages/SportsPage";
import { LiteraturePage } from "./pages/LiteraturePage";
import { OpinionPage } from "./pages/OpinionPage";
import { ArticleSubmissionForm } from "./ArticleSubmissionForm";
import { useState } from "react";

interface SectionContentProps {
  section: string;
}

export function SectionContent({ section }: SectionContentProps) {
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);

  // Handle specific pages
  if (section === 'about') return <AboutPage />;
  if (section === 'editorial-board') return <EditorialBoardPage />;
  if (section === 'archives') return <ArchivesPage />;
  if (section === 'contact') return <ContactPage />;
  if (section === 'news') return <NewsPage />;
  if (section === 'features') return <FeaturesPage />;
  if (section === 'sports') return <SportsPage />;
  if (section === 'literature') return <LiteraturePage />;
  if (section === 'opinion') return <OpinionPage />;
  
  if (section === 'submit-article') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Submit an Article</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Share your stories, insights, and perspectives with the VSU community. We welcome submissions from students, faculty, and staff.
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-emerald-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Ready to Share Your Story?</h3>
              <p className="text-muted-foreground mb-6">
                Click the button below to open our article submission form and get your work published in Amaranth.
              </p>
              <Button 
                onClick={() => setIsArticleFormOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800"
                size="lg"
              >
                Open Submission Form
              </Button>
            </CardContent>
          </Card>
        </div>
        <ArticleSubmissionForm 
          isOpen={isArticleFormOpen} 
          onClose={() => setIsArticleFormOpen(false)} 
        />
      </div>
    );
  }

  // Legacy content for remaining sections
  const getSectionData = (section: string) => {
    const sectionData = {
      views: {
        title: "Views & Editorial",
        icon: FileText,
        description: "Editorial perspectives and opinion pieces from our editorial board and contributors",
        articles: [
          {
            title: "The Future of Student Journalism in the Digital Age",
            excerpt: "Exploring how student publications are adapting to digital platforms and maintaining relevance in the modern media landscape.",
            author: "Editorial Board",
            date: "Sep 20, 2024",
            category: "Editorial",
            imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqb3VybmFsaXNtJTIwZGlnaXRhbHxlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
          },
          {
            title: "Campus Sustainability: A Call to Action",
            excerpt: "Why every student has a role to play in making our university more environmentally sustainable.",
            author: "Environmental Committee",
            date: "Sep 18, 2024",
            category: "Opinion",
            imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGNhbXB1c3xlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
          }
        ]
      },
      sai: {
        title: "Student Affairs & Involvement",
        icon: Users,
        description: "Student government updates, campus organizations, and student life activities",
        articles: [
          {
            title: "Student Council Elections: Meet Your Candidates",
            excerpt: "Get to know the students running for student council positions this academic year.",
            author: "Student Affairs",
            date: "Sep 19, 2024",
            category: "Student Government",
            imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwZWxlY3Rpb25zfGVufDF8fHx8MTc1ODU1NzY1MXww&ixlib=rb-4.1.0&q=80&w=1080"
          },
          {
            title: "New Student Organizations Recognized",
            excerpt: "Five new student organizations have been officially recognized by the university this semester.",
            author: "SAI Office",
            date: "Sep 16, 2024",
            category: "Organizations",
            imageUrl: "https://images.unsplash.com/photo-1529390079861-591de354faf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwb3JnYW5pemF0aW9uc3xlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
          }
        ]
      },
      specials: {
        title: "Special Reports",
        icon: BookOpen,
        description: "In-depth investigative reports and special coverage of important university issues",
        articles: [
          {
            title: "Investigation: Campus Safety Measures Under Review",
            excerpt: "A comprehensive look at current campus security protocols and proposed improvements.",
            author: "Investigative Team",
            date: "Sep 17, 2024",
            category: "Investigation",
            imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wdXMlMjBzZWN1cml0eXxlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
          },
          {
            title: "Mental Health Resources: Are They Adequate?",
            excerpt: "Examining the availability and effectiveness of mental health support services on campus.",
            author: "Health Reporter",
            date: "Sep 14, 2024",
            category: "Health",
            imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW50YWwlMjBoZWFsdGglMjBzdXBwb3J0fGVufDF8fHx8MTc1ODU1NzY1MXww&ixlib=rb-4.1.0&q=80&w=1080"
          }
        ]
      },
      blogs: {
        title: "Blogs & Personal Stories",
        icon: Users,
        description: "Personal narratives, student blogs, and lifestyle content from the VSU community",
        articles: [
          {
            title: "A Day in the Life: Medical Student Edition",
            excerpt: "Follow along as we document a typical day for a third-year medical student at VSU.",
            author: "Maria Santos",
            date: "Sep 15, 2024",
            category: "Lifestyle",
            imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3R1ZGVudHxlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
          },
          {
            title: "Study Abroad Diary: Lessons from Exchange",
            excerpt: "Reflections on a semester abroad and how it changed my perspective on education and culture.",
            author: "Carlos Rivera",
            date: "Sep 12, 2024",
            category: "Travel",
            imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkeSUyMGFicm9hZHxlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
          }
        ]
      },
      bulletin: {
        title: "University Bulletin",
        icon: Calendar,
        description: "Official announcements, academic calendar updates, and administrative notices",
        articles: [
          {
            title: "Academic Calendar Update: Important Dates to Remember",
            excerpt: "Key dates for the remainder of the academic year including finals, holidays, and graduation.",
            author: "Registrar's Office",
            date: "Sep 21, 2024",
            category: "Academic",
            imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2FkZW1pYyUyMGNhbGVuZGFyfGVufDF8fHx8MTc1ODU1NzY1MXww&ixlib=rb-4.1.0&q=80&w=1080"
          },
          {
            title: "New Library Hours and Services",
            excerpt: "The university library announces extended hours and new digital services for students.",
            author: "Library Administration",
            date: "Sep 19, 2024",
            category: "Services",
            imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwc2VydmljZXN8ZW58MXx8fHwxNzU4NTU3NjUxfDA&ixlib=rb-4.1.0&q=80&w=1080"
          }
        ]
      }
    };

    return sectionData[section] || sectionData.views;
  };

  const data = getSectionData(section);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <data.icon className="w-6 h-6 text-emerald-700" />
          <h1 className="text-3xl font-bold text-foreground">{data.title}</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {data.description}
        </p>
      </div>

      {/* Articles */}
      <div className="space-y-6">
        {data.articles.map((article, index) => (
          <NewsCard key={index} {...article} />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-8">
        <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800">
          Load More Articles
        </Button>
      </div>
    </div>
  );
}