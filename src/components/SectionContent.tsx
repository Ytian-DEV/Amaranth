import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
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
import { useNavigate } from "react-router-dom"; // Add this import

interface SectionContentProps {
  section: string;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  imageUrl: string;
  featured?: boolean;
}

interface SectionData {
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  articles: Article[];
}

export function SectionContent({ section }: SectionContentProps) {
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const navigate = useNavigate(); // Add this hook

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

  // Function to handle article click
  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
  };

  // Legacy content for remaining sections
  const getSectionData = (section: string): SectionData => {
    const sectionData = {
      views: {
        title: "Views & Editorial",
        icon: FileText,
        description: "Editorial perspectives and opinion pieces from our editorial board and contributors",
        articles: [
          {
            id: "view-1",
            title: "The Future of Student Journalism in the Digital Age",
            excerpt: "Exploring how student publications are adapting to digital platforms and maintaining relevance in the modern media landscape.",
            author: "Editorial Board",
            date: "Sep 20, 2024",
            category: "Editorial",
            imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqb3VybmFsaXNtJTIwZGlnaXRhbHxlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
          },
          {
            id: "view-2",
            title: "Campus Sustainability: A Call to Action",
            excerpt: "Why every student has a role to play in making our university more environmentally sustainable.",
            author: "Environmental Committee",
            date: "Sep 18, 2024",
            category: "Opinion",
            imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGNhbXB1c3xlbnwxfHx8fDE3NTg1NTc2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
          }
        ]
      },
      // ... your other sections (sai, specials, blogs, bulletin)
    };

    return sectionData[section as keyof typeof sectionData] || sectionData.views;
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
          <ArticleCard 
            key={index} 
            article={article} 
            onClick={() => handleArticleClick(article.id)}
          />
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

// Individual Article Card Component with click functionality
interface ArticleCardProps {
  article: Article;
  onClick: () => void;
}

function ArticleCard({ article, onClick }: ArticleCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Article Image */}
        {article.imageUrl && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        
        <div className="p-4">
          {/* Category Badge */}
          <Badge variant="secondary" className="mb-2">
            {article.category}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-emerald-700 transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {article.excerpt}
          </p>

          {/* Author and Date */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
            <span>By {article.author}</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{article.date}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}