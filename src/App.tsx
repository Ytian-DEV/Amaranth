import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { SectionContent } from "./components/SectionContent";
import { Dashboard } from "./components/Dashboard";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { ArticlePage } from "./components/pages/ArticlePage";
// Remove this import: import { MainLayout } from "./components/MainLayout";

// Main Layout Component (for non-article pages)
function MainLayout() {
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <SectionContent section={activeSection} />
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

// App Component with Routing
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Article detail page */}
        <Route path="/article/:id" element={<ArticlePage />} />
        
        {/* All other pages use the main layout */}
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}