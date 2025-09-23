import { Button } from "./ui/button";
import { Menu, Search, User, Globe } from "lucide-react";
import { useState } from "react";
import { SearchDialog } from "./SearchDialog";
import { LoginDialog } from "./LoginDialog";

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: any;
  onLogin: (user: any) => void;
  onLogout: () => void;
}

export function Header({ activeSection, onSectionChange, user, onLogin, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const navItems = [
    { label: "NEWS", value: "news" },
    { label: "VIEWS", value: "views" },
    { label: "SPORTS", value: "sports" },
    { label: "FEATURE", value: "feature" },
    { label: "S&T", value: "s&t" },
    { label: "LITERARY", value: "literary" },
    { label: "BLOGS", value: "blogs" },
    { label: "SPECIALS", value: "specials" },
    { label: "INVESTIGATIVE", value: "investigative" },
    { label: "EXPLAINER", value: "explainer" },
    { label: "BULLETIN", value: "bulletin" },
    { label: "STORIES", value: "stories" }
  ];

  return (
    <header className="bg-emerald-800 text-white sticky top-0 z-50 shadow-lg">
      {/* Top bar */}
      <div className="bg-emerald-900 py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="text-sm opacity-90">in the name of TRUTH and standing by it—we remain.</div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-100">Welcome, {user.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLogout}
                  className="text-emerald-100 hover:bg-emerald-800 text-xs h-6 px-2"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsLoginOpen(true)}
                className="text-emerald-100 hover:bg-emerald-800 text-xs h-6 px-2"
              >
                <User className="w-3 h-3 mr-1" />
                Log In
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-emerald-100 hover:bg-emerald-800 text-xs h-6 px-2"
            >
              <Globe className="w-3 h-3 mr-1" />
              EN
            </Button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/amaranth-logo.png" 
                alt="Amaranth Logo"
                className="w-10 h-10"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">AMARANTH</h1>
              <p className="text-xs opacity-90">Visayas State University</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => onSectionChange(item.value)}
                className={`text-sm font-medium transition-colors py-2 ${
                  activeSection === item.value 
                    ? "text-yellow-400" 
                    : "text-white hover:text-yellow-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Search and Mobile Menu */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-emerald-700"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden text-white hover:bg-emerald-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-emerald-700 pt-4">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    onSectionChange(item.value);
                    setIsMenuOpen(false);
                  }}
                  className={`text-sm font-medium transition-colors py-2 px-2 text-left ${
                    activeSection === item.value 
                      ? "text-yellow-400" 
                      : "text-white hover:text-yellow-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
      
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <LoginDialog 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={onLogin}
      />
    </header>
  );
}