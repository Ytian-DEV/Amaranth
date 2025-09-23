import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Calendar, Upload, X, FileText, Image } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface EventReportFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventReportForm({ isOpen, onClose }: EventReportFormProps) {
  const [formData, setFormData] = useState({
    eventName: "",
    reporterName: "",
    email: "",
    eventDate: "",
    location: "",
    eventType: "",
    description: "",
    attendees: "",
    keyHighlights: ""
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventTypes = [
    "Academic Conference",
    "Workshop/Seminar",
    "Cultural Event",
    "Sports Competition",
    "Community Service",
    "Research Presentation",
    "Graduation Ceremony",
    "Award Ceremony",
    "Student Organization Activity",
    "Other"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setDocuments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setPhotos(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      toast.success("Event report submitted successfully! Thank you for keeping our community informed.");
      setIsSubmitting(false);
      onClose();
      // Reset form
      setFormData({
        eventName: "",
        reporterName: "",
        email: "",
        eventDate: "",
        location: "",
        eventType: "",
        description: "",
        attendees: "",
        keyHighlights: ""
      });
      setDocuments([]);
      setPhotos([]);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            Report an Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporter Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reporterName">Reporter Name *</Label>
              <Input
                id="reporterName"
                value={formData.reporterName}
                onChange={(e) => handleInputChange("reporterName", e.target.value)}
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

          {/* Event Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                value={formData.eventName}
                onChange={(e) => handleInputChange("eventName", e.target.value)}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange("eventDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Event venue/location"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '-')}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendees">Estimated Attendees</Label>
                <Input
                  id="attendees"
                  value={formData.attendees}
                  onChange={(e) => handleInputChange("attendees", e.target.value)}
                  placeholder="e.g., 150 students, 20 faculty"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Event Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe what happened during the event, its purpose, and significance..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyHighlights">Key Highlights & Outcomes</Label>
              <Textarea
                id="keyHighlights"
                value={formData.keyHighlights}
                onChange={(e) => handleInputChange("keyHighlights", e.target.value)}
                placeholder="Notable moments, achievements, awards, speaker quotes, etc."
                rows={4}
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event Documents (Optional)</Label>
              <div className="border-2 border-dashed border-emerald-200 rounded-lg p-4 text-center">
                <FileText className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload programs, certificates, press releases, etc.
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="document-upload"
                  accept=".pdf,.doc,.docx,.txt"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("document-upload")?.click()}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Upload Documents
                </Button>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((file, index) => (
                    <Card key={index}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Event Photos (Optional)</Label>
              <div className="border-2 border-dashed border-emerald-200 rounded-lg p-4 text-center">
                <Image className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload high-quality photos from the event
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  accept=".jpg,.jpeg,.png"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Upload Photos
                </Button>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {photos.map((file, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-2">
                        <div className="aspect-square bg-emerald-50 rounded flex items-center justify-center relative">
                          <Image className="w-8 h-8 text-emerald-600" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 w-6 h-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-emerald-800 mb-2">Reporting Guidelines</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Report events within 48 hours when possible</li>
                <li>• Include relevant quotes from speakers or participants</li>
                <li>• Ensure all photos have proper permissions</li>
                <li>• Focus on factual, objective reporting</li>
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
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}