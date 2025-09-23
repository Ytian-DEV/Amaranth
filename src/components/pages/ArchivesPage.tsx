import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Search, Calendar, Download, Eye, Filter } from "lucide-react";

export function ArchivesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const archiveYears = ["2024", "2023", "2022", "2021", "2020"];
  const categories = ["News", "Features", "Sports", "Literature", "Opinion", "Editorial"];

  const archiveItems = [
    {
      title: "Amaranth Special Edition: Campus Sustainability",
      date: "December 2024",
      category: "Special Issue",
      description: "A comprehensive look at VSU's sustainability initiatives and environmental programs.",
      downloadUrl: "#",
      viewUrl: "#"
    },
    {
      title: "November 2024 Issue",
      date: "November 2024",
      category: "Monthly Issue",
      description: "Featuring the university's academic achievements and upcoming events.",
      downloadUrl: "#",
      viewUrl: "#"
    },
    {
      title: "October 2024 Issue",
      date: "October 2024",
      category: "Monthly Issue",
      description: "Sports spotlight and student achievement stories.",
      downloadUrl: "#",
      viewUrl: "#"
    },
    {
      title: "September 2024 Issue",
      date: "September 2024",
      category: "Monthly Issue",
      description: "Welcome back to school and new faculty introductions.",
      downloadUrl: "#",
      viewUrl: "#"
    },
    {
      title: "Graduation Special 2024",
      date: "August 2024",
      category: "Special Issue",
      description: "Celebrating the Class of 2024 and their achievements.",
      downloadUrl: "#",
      viewUrl: "#"
    },
    {
      title: "July 2024 Issue",
      date: "July 2024",
      category: "Monthly Issue",
      description: "Summer programs and research highlights.",
      downloadUrl: "#",
      viewUrl: "#"
    },
    {
      title: "June 2024 Issue",
      date: "June 2024",
      category: "Monthly Issue",
      description: "End of semester wrap-up and summer activities preview.",
      downloadUrl: "#",
      viewUrl: "#"
    },
    {
      title: "May 2024 Issue",
      date: "May 2024",
      category: "Monthly Issue",
      description: "Academic excellence awards and student recognition.",
      downloadUrl: "#",
      viewUrl: "#"
    }
  ];

  const filteredItems = archiveItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === "all" || item.date.includes(selectedYear);
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesYear && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Archives</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore our collection of past issues, special publications, and historical content 
          from the Amaranth archives.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-700" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search archives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {archiveYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Monthly Issue">Monthly Issues</SelectItem>
                <SelectItem value="Special Issue">Special Issues</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-emerald-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-emerald-700">150+</div>
            <p className="text-sm text-muted-foreground">Total Issues</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-emerald-700">25</div>
            <p className="text-sm text-muted-foreground">Special Editions</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-emerald-700">5</div>
            <p className="text-sm text-muted-foreground">Years Archived</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-emerald-700">1000+</div>
            <p className="text-sm text-muted-foreground">Articles</p>
          </CardContent>
        </Card>
      </div>

      {/* Archive Results */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-emerald-700">
            Archive Results ({filteredItems.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item, index) => (
            <Card key={index} className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={item.category === "Special Issue" ? "default" : "outline"}
                    className={item.category === "Special Issue" ? "bg-emerald-700" : "border-emerald-200 text-emerald-700"}
                  >
                    {item.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-emerald-700 hover:bg-emerald-800"
                    onClick={() => window.open(item.viewUrl, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Online
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => window.open(item.downloadUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* No Results */}
      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No Archives Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact for More */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-700">Need Older Archives?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Looking for issues older than what's available online? Contact our archives team 
            for assistance in accessing historical publications.
          </p>
          <Button className="bg-emerald-700 hover:bg-emerald-800">
            Contact Archives Team
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}