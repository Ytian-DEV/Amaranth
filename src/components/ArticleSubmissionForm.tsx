import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ArticleSubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleSubmissionForm({ isOpen, onClose }: ArticleSubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    email: "",
    category: "",
    content: "",
    excerpt: ""
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "News",
    "Feature",
    "Opinion",
    "Sports", 
    "Literature",
    "Editorial",
    "Science & Technology",
    "Environment",
    "Health",
    "Arts & Culture"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      toast.success("Article submitted successfully! We'll review it and get back to you.");
      setIsSubmitting(false);
      onClose();
      // Reset form
      setFormData({
        title: "",
        author: "",
        email: "",
        category: "",
        content: "",
        excerpt: ""
      });
      setAttachments([]);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            Submit an Article
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author Name *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleInputChange("author", e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your.email@vsu.edu.ph"
                required
              />
            </div>
          </div>

          {/* Article Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Article Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter article title"
                required
              />
            </div>

            <div className="space-y-2">
<label htmlFor="category">Category *</label>
<Select 
  value={formData.category} 
  onValueChange={(value) => handleInputChange("category", value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Select article category" />
  </SelectTrigger>
  <SelectContent>
    {categories.map((category) => (
      <SelectItem key={category} value={category.toLowerCase()}>
        {category}
      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Article Excerpt *</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
                placeholder="Brief summary of your article (2-3 sentences)"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Article Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Write your article content here..."
                rows={8}
                required
              />
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-4">
            <Label>Attachments (Optional)</Label>
            <div className="border-2 border-dashed border-emerald-200 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload images, documents, or other supporting files
              </p>
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Choose Files
              </Button>
            </div>

            {/* Show uploaded files */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Submission Guidelines */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-emerald-800 mb-2">Submission Guidelines</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Articles should be original and not published elsewhere</li>
                <li>• Follow AP Style Guide for writing</li>
                <li>• Include proper citations for sources</li>
                <li>• Review will take 3-5 business days</li>
              </ul>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800"
            >
              {isSubmitting ? "Submitting..." : "Submit Article"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}