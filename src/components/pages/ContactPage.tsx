import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner@2.0.3";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: ""
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Office Address",
      details: [
        "Amaranth Publication Office",
        "Student Center Building",
        "Visayas State University",
        "Baybay City, Leyte 6521-A",
        "Philippines"
      ]
    },
    {
      icon: Phone,
      title: "Phone",
      details: [
        "+63 53 335 2601",
        "+63 53 335 2602 (Fax)"
      ]
    },
    {
      icon: Mail,
      title: "Email",
      details: [
        "amaranth@vsu.edu.ph",
        "editor@amaranth.vsu.edu.ph",
        "news@amaranth.vsu.edu.ph"
      ]
    },
    {
      icon: Clock,
      title: "Office Hours",
      details: [
        "Monday - Friday: 8:00 AM - 5:00 PM",
        "Saturday: 8:00 AM - 12:00 PM",
        "Sunday: Closed"
      ]
    }
  ];

  const departments = [
    { name: "Editorial Team", email: "editor@amaranth.vsu.edu.ph" },
    { name: "News Department", email: "news@amaranth.vsu.edu.ph" },
    { name: "Sports Department", email: "sports@amaranth.vsu.edu.ph" },
    { name: "Features Department", email: "features@amaranth.vsu.edu.ph" },
    { name: "Opinion Department", email: "opinion@amaranth.vsu.edu.ph" },
    { name: "Technical Support", email: "tech@amaranth.vsu.edu.ph" }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Contact Us</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Get in touch with the Amaranth team. We'd love to hear from you!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <MessageSquare className="w-5 h-5" />
              Send us a Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="editorial">Editorial</SelectItem>
                      <SelectItem value="submission">Article Submission</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="advertising">Advertising</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief subject of your message"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Write your message here..."
                  rows={6}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800"
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="space-y-6">
          {contactInfo.map((info, index) => (
            <Card key={index} className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <info.icon className="w-5 h-5" />
                  {info.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">{detail}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Department Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-emerald-700">Department Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept, index) => (
              <div key={index} className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-700 mb-2">{dept.name}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {dept.email}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map and Additional Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-emerald-700">Visit Our Office</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Location Details</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Our publication office is located in the Student Center Building at the heart 
                of the VSU campus. We're easily accessible from all major campus buildings.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>2nd Floor, Student Center Building</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Open during regular office hours</span>
                </div>
              </div>
            </div>
            <div className="bg-emerald-100 rounded-lg p-6 text-center">
              <MapPin className="w-12 h-12 text-emerald-700 mx-auto mb-3" />
              <h4 className="font-semibold text-emerald-700 mb-2">Interactive Map</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Campus map integration would be placed here
              </p>
              <Button variant="outline" className="border-emerald-200 text-emerald-700">
                View Campus Map
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Quick Links */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-700">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Quick Answers</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Q:</strong> How can I submit an article?</p>
                <p className="text-muted-foreground">Use our online submission form or email news@amaranth.vsu.edu.ph</p>
                
                <p><strong>Q:</strong> When do you publish new issues?</p>
                <p className="text-muted-foreground">We publish monthly issues and special editions throughout the academic year.</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Need More Help?</h4>
              <p className="text-sm text-muted-foreground">
                Check out our comprehensive FAQ section or contact us directly for specific questions.
              </p>
              <Button variant="outline" className="border-emerald-200 text-emerald-700">
                View Full FAQ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}