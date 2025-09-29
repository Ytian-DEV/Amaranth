import { AboutPage } from "./pages/AboutPage";
import { EditorialBoardPage } from "./pages/EditorialBoardPage";
import { ArchivesPage } from "./pages/ArchivesPage";
import { ContactPage } from "./pages/ContactPage";
import { NewsPage } from "./pages/NewsPage";
import { SportsPage } from "./pages/SportsPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { LiteraryPage } from "./pages/LiteraryPage";
import { SpecialsPage } from "./pages/SpecialsPage";
import { BlogPage } from "./pages/BlogPage";
import { ViewsPage } from "./pages/ViewsPage";
import { ScienceTechnologyPage } from "./pages/ScienceTechnologyPage";
import { InvestigativePage } from "./pages/InvestigativePage";
import { ExplainerPage } from "./pages/ExplainerPage";
import { BulletinPage } from "./pages/BulletinPage";
import { StoriesPage } from "./pages/StoriesPage";
import { ArticleSubmissionForm } from "./ArticleSubmissionForm";
import { useState } from "react";

interface SectionContentProps {
  section: string;
}

export function SectionContent({ section }: SectionContentProps) {
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(true);

  switch (section) {
    case 'about':
      return <AboutPage />;
    case 'editorial-board':
      return <EditorialBoardPage />;
    case 'archives':
      return <ArchivesPage />;
    case 'contact':
      return <ContactPage />;
    case 'news':
      return <NewsPage />;
    case 'feature':
      return <FeaturesPage />;
    case 'sports':
      return <SportsPage />;
    case 'literary':
      return <LiteraryPage />;
    case 'blogs':
      return <BlogPage />;
    case 'specials':
      return <SpecialsPage />;
    case 'views':
      return <ViewsPage />;
    case 's&t':
      return <ScienceTechnologyPage />;
    case 'investigative':
      return <InvestigativePage />;
    case 'explainer':
      return <ExplainerPage />;
    case 'bulletin':
      return <BulletinPage />;
    case 'stories':
      return <StoriesPage />;
    case 'submit-article':
      return (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Submit an Article</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Share your stories, insights, and perspectives with the VSU community.
            </p>
          </div>
          <ArticleSubmissionForm 
            isOpen={isArticleFormOpen} 
            onClose={() => setIsArticleFormOpen(false)} 
          />
        </div>
      );
    default:
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Section Not Found</h2>
          <p className="text-gray-600">The section "{section}" is not available.</p>
        </div>
      );
  }
}