import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Search, Clock, TrendingUp } from "lucide-react";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const mockResults = [
    {
      title: "Bright Eyes in Deep Guise: Tarsier Sightings in VSU",
      category: "Environment",
      date: "Sep 23, 2024",
      excerpt: "Tarsier sightings within the VSU campus have been noted..."
    },
    {
      title: "University President Inaugurates New Research Facility",
      category: "News",
      date: "Sep 22, 2024",
      excerpt: "VSU opens state-of-the-art research facility..."
    },
    {
      title: "Student Achievement: VSU Team Wins National Competition",
      category: "Achievement",
      date: "Sep 21, 2024",
      excerpt: "Our engineering students brought home the gold..."
    }
  ];

  const recentSearches = [
    "tarsier wildlife",
    "research facility",
    "student competition",
    "graduation ceremony"
  ];

  const handleSearch = (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    
    // Simulate search delay
    setTimeout(() => {
      if (query.length > 0) {
        const filtered = mockResults.filter(result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.category.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-700" />
            Search Amaranth
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles, authors, categories..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Recent Searches */}
          {searchQuery.length === 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Searches
              </h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(search)}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Search Results
                {!isSearching && <span className="text-sm text-muted-foreground">({searchResults.length} found)</span>}
              </h4>
              
              {isSearching ? (
                <div className="text-center py-8 text-muted-foreground">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground hover:text-emerald-700 mb-1">
                            {result.title}
                          </h5>
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.excerpt}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                              {result.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{result.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}