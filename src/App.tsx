import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { SectionContent } from "./components/SectionContent";
import { Dashboard } from "./components/Dashboard";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { ArticlePage } from "./components/pages/ArticlePage";
import { HomePage } from "./components/pages/HomePage";

// Main Layout Component (for all pages including articles)
function MainLayout() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isArticlePage = location.pathname.startsWith("/article/");
  const isDashboardPage = location.pathname === "/dashboard";

  // Get active section from URL path
  const getActiveSectionFromPath = () => {
    const path = location.pathname;
    if (path === "/" || path === "/home") return "home";
    if (isArticlePage) return "article";
    return path.substring(1);
  };

  const activeSection = getActiveSectionFromPath();

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
    navigate("/dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("amaranth_user");
    navigate("/");
  };

  const handleSectionChange = (section: string) => {
    if (section === "home") {
      navigate("/");
    } else {
      navigate(`/${section}`);
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  // Show dashboard if on dashboard route
  if (isDashboardPage && user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onLogoClick={handleLogoClick}
      />

      {/* Dashboard Access Button for Logged Users (hide on article and dashboard pages) */}
      {user && !isArticlePage && !isDashboardPage && (
        <div className="bg-emerald-50 border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700">
                Welcome back, {user.name}! You have admin access.
              </span>
              <Button 
                size="sm" 
                onClick={() => navigate("/dashboard")}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className={`grid gap-8 ${isArticlePage ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Main Content - full width for articles, with sidebar for other pages */}
          <div className={isArticlePage ? '' : 'lg:col-span-2'}>
            {activeSection === "home" ? (
              <HomePage />
            ) : isArticlePage ? (
              <ArticlePage />
            ) : (
              <SectionContent section={activeSection} />
            )}
          </div>

          {/* Sidebar - hidden on article pages */}
          {!isArticlePage && (
            <div className="lg:col-span-1">
              <Sidebar />
            </div>
          )}
        </div>
      </main>

      <Footer onSectionChange={handleSectionChange} />
      <Toaster />
    </div>
  );
}

// App Component with Routing
export default function App() {
  return (
    <Router>
      <Routes>
        {/* All routes use MainLayout */}
        <Route path="/article/:id" element={<MainLayout />} />
        <Route path="/news" element={<MainLayout />} />
        <Route path="/sports" element={<MainLayout />} />
        <Route path="/features" element={<MainLayout />} />
        <Route path="/literary" element={<MainLayout />} />
        <Route path="/blog" element={<MainLayout />} />
        <Route path="/specials" element={<MainLayout />} />
        <Route path="/views" element={<MainLayout />} />
        <Route path="/dashboard" element={<MainLayout />} />
        <Route path="/" element={<MainLayout />} />
        <Route path="/home" element={<MainLayout />} />
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}