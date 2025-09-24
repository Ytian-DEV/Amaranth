import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

interface FooterProps {
  onSectionChange: (section: string) => void;
}

export function Footer({ onSectionChange }: FooterProps) {
  const handleLinkClick = (section: string) => {
    onSectionChange(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-emerald-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="/amaranth-logo.svg"
                  alt="Amaranth Logo"
                  className="w-10 h-10"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg">AMARANTH</h3>
                <p className="text-sm opacity-80">VSU Student Publication</p>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              The official student publication of Visayas State University, 
              committed to delivering quality journalism and fostering 
              intellectual discourse within the university community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><button onClick={() => handleLinkClick('about')} className="hover:text-yellow-400 transition-colors text-left">About Us</button></li>
              <li><button onClick={() => handleLinkClick('editorial-board')} className="hover:text-yellow-400 transition-colors text-left">Editorial Board</button></li>
              <li><button onClick={() => handleLinkClick('submit-article')} className="hover:text-yellow-400 transition-colors text-left">Submit Article</button></li>
              <li><button onClick={() => handleLinkClick('archives')} className="hover:text-yellow-400 transition-colors text-left">Archives</button></li>
              <li><button onClick={() => handleLinkClick('contact')} className="hover:text-yellow-400 transition-colors text-left">Contact</button></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><button onClick={() => handleLinkClick('news')} className="hover:text-yellow-400 transition-colors text-left">News</button></li>
              <li><button onClick={() => handleLinkClick('features')} className="hover:text-yellow-400 transition-colors text-left">Features</button></li>
              <li><button onClick={() => handleLinkClick('sports')} className="hover:text-yellow-400 transition-colors text-left">Sports</button></li>
              <li><button onClick={() => handleLinkClick('literature')} className="hover:text-yellow-400 transition-colors text-left">Literature</button></li>
              <li><button onClick={() => handleLinkClick('opinion')} className="hover:text-yellow-400 transition-colors text-left">Opinion</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3 text-sm opacity-80">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Visayas State University<br />Baybay City, Leyte, Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>amaranth@vsu.edu.ph</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+63 53 335 2601</span>
              </div>
            </div>
            
            {/* Social Media */}
            <div className="mt-6">
              <h5 className="font-medium mb-3">Follow Us</h5>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-300 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-800 mt-8 pt-8 text-center text-sm opacity-60">
          <p>&copy; 2024 Amaranth - Visayas State University. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}