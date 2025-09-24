import { Button } from "./ui/button";
import { Menu, Search, User, Globe, ChevronDown } from "lucide-react";
import { useState } from "react";
import { SearchDialog } from "./SearchDialog";
import { LoginDialog } from "./LoginDialog";

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: any;
  onLogin: (userData: any) => void;
  onLogout: () => void;
  onLogoClick?: () => void; // Add this
}

export function Header({ activeSection, onSectionChange, user, onLogin, onLogout, onLogoClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const navItems = [
    { label: "NEWS", value: "news" },
    { label: "SPORTS", value: "sports" },
    { label: "FEATURE", value: "feature" },
    { label: "LITERARY", value: "literary" },
    { label: "BLOGS", value: "blogs" },
    { label: "SPECIALS", value: "specials" },
    { label: "VIEWS", value: "views" },
  ];

  const moreItems = [
    { label: "S&T", value: "s&t" },
    { label: "INVESTIGATIVE", value: "investigative" },
    { label: "EXPLAINER", value: "explainer" },
    { label: "BULLETIN", value: "bulletin" },
    { label: "STORIES", value: "stories" }
  ];

  return (
    <header className="bg-emerald-800 text-white sticky top-0 z-50 shadow-lg">
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" 
          onClick={onLogoClick}
          style={{ cursor: 'pointer' }}>
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/amaranth-logo.svg" 
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
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => onSectionChange(item.value)}
                className={`text-sm font-medium transition-colors py-2 px-3 ${
                  activeSection === item.value 
                    ? "text-yellow-400" 
                    : "text-white hover:text-yellow-400"
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* More dropdown menu */}
            <div className="relative">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`text-sm font-medium transition-colors py-2 px-3 flex items-center gap-1 ${
                  isMoreMenuOpen || moreItems.some(item => item.value === activeSection)
                    ? "text-yellow-400" 
                    : "text-white hover:text-yellow-400"
                }`}
              >
                MORE <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* Dropdown menu */}
              {isMoreMenuOpen && (
                <div className="absolute top-full left-0 mt-1 bg-emerald-800 border border-emerald-700 rounded-lg shadow-lg py-2 min-w-[180px] z-50">
                  {moreItems.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        onSectionChange(item.value);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        activeSection === item.value
                          ? "text-yellow-400 bg-emerald-700"
                          : "text-white hover:text-yellow-400 hover:bg-emerald-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Search, Login, and Mobile Menu */}
          <div className="flex items-center gap-2">
              {/* Search */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-emerald-700 h-8 w-8 p-0"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-4 h-4" />
            </Button>
            
            {/* Mobile Menu */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden text-white hover:bg-emerald-700 h-8 w-8 p-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>


            {/* Login/User Info - Now visible on desktop */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-100 hidden md:inline">Welcome, {user.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLogout}
                  className="text-emerald-100 hover:bg-emerald-700 h-8 px-3 flex items-center gap-1"
                >
                  <User className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsLoginOpen(true)}
                className="text-emerald-100 hover:bg-emerald-700 h-8 px-3 flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                <span>Log In</span>
              </Button>
            )}
            
            {/* Language - Desktop */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex text-emerald-100 hover:bg-emerald-700 h-8 px-3"
            >
              <Globe className="w-4 h-4 mr-2" />
              EN
            </Button>

            
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-emerald-700 pt-4">
            <div className="grid grid-cols-2 gap-2">
              {/* Main nav items */}
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
              
              {/* More items */}
              {moreItems.map((item) => (
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
              
              {/* Mobile login/logout and language */}
              <div className="col-span-2 border-t border-emerald-700 pt-3 mt-2 space-y-2">
                {/* Language */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-emerald-100 hover:bg-emerald-700"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  English (EN)
                </Button>
                
                {/* Login/Logout */}
                {user ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Welcome, {user.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className="text-emerald-100 hover:bg-emerald-700"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsLoginOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start text-emerald-100 hover:bg-emerald-700"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Log In
                  </Button>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
      
      {/* Close dropdown when clicking outside */}
      {isMoreMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsMoreMenuOpen(false)}
        />
      )}
      
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <LoginDialog 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={onLogin}
      />
    </header>
  );
}