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
                <h3 className="font-bold text-lg font-trajan">AMARANTH</h3>
                <p className="text-sm opacity-80">Visayas State University</p>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              The Official Student Media Organization of the Visayas State University.
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
              <li><button onClick={() => handleLinkClick('feature')} className="hover:text-yellow-400 transition-colors text-left">Features</button></li>
              <li><button onClick={() => handleLinkClick('sports')} className="hover:text-yellow-400 transition-colors text-left">Sports</button></li>
              <li><button onClick={() => handleLinkClick('literary')} className="hover:text-yellow-400 transition-colors text-left">Literary</button></li>
              <li><button onClick={() => handleLinkClick('stories')} className="hover:text-yellow-400 transition-colors text-left">Stories</button></li>
              <li><button onClick={() => handleLinkClick('specials')} className="hover:text-yellow-400 transition-colors text-left">Specials</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3 text-sm opacity-80">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="https://maps.app.goo.gl/RkTiVWu3LPgkGawA8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-100 hover:text-emerald-800 underline hover:no-underline hover:underline-offset-2 transition-all duration-200">
                  ADE Building, Amaranth Newsroom<br />
                  Visayas State University<br />
                  Baybay City, Leyte, Philippines<br />
                  6521
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=amaranth@vsu.edu.ph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-100 hover:text-emerald-800 underline hover:underline-offset-2 transition-colors">
                  amaranth@vsu.edu.ph
                </a>
              </div>
            </div>
            
            {/* Social Media */}
            <div className="mt-6">
              <h5 className="font-medium mb-3">Follow Us</h5>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/amaranthvsu" 
                  target="_blank" 
                  rel="noopener noreferrer">
                  <img src="/facebook-logo.svg" alt="Facebook" className="w-6 h-6" />
                </a>
                <a href="https://www.tiktok.com/@amaranthvsu" 
                  target="_blank" 
                  rel="noopener noreferrer">
                  <img src="/tiktok-logo.svg" alt="TikTok" className="w-6 h-6" />
                </a>
                <a href="https://www.instagram.com/amaranthvsu" 
                  target="_blank" 
                  rel="noopener noreferrer">
                  <img src="/instagram-logo.svg" alt="Instagram" className="w-6 h-6" />
                </a>
                <a href="https://www.youtube.com/@amaranthvsu" 
                  target="_blank" 
                  rel="noopener noreferrer">
                  <img src="/youtube-logo-1.svg" alt="YouTube" className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-800 mt-8 pt-8 text-center text-sm opacity-60">
          <p>&copy; 2024 Amaranth - Visayas State University. All rights reserved.</p>
          <p>-powered by Lily🌸</p>
        </div>
      </div>
    </footer>
  );
}