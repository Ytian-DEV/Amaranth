import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { CalendarDays, User, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface NewsCardProps {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  imageUrl: string;
  featured?: boolean;
}

export function NewsCard({ 
  title, 
  excerpt, 
  author, 
  date, 
  category, 
  imageUrl, 
  featured = false 
}: NewsCardProps) {
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden ${
      featured ? 'lg:col-span-2' : ''
    }`}>
      <div className={`${featured ? 'lg:flex' : ''}`}>
        <div className={`${featured ? 'lg:w-1/2' : ''} relative overflow-hidden`}>
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              featured ? 'h-64 lg:h-full' : 'h-48'
            }`}
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-emerald-800 text-white hover:bg-emerald-700">
              {category}
            </Badge>
          </div>
        </div>
        
        <CardContent className={`p-6 ${featured ? 'lg:w-1/2 lg:flex lg:flex-col lg:justify-center' : ''}`}>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {author}
            </div>
            <div className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              {date}
            </div>
          </div>
          
          <h3 className={`font-semibold text-foreground mb-3 group-hover:text-emerald-700 transition-colors ${
            featured ? 'text-xl lg:text-2xl' : 'text-lg'
          }`}>
            {title}
          </h3>
          
          <p className="text-muted-foreground mb-4 leading-relaxed">
            {excerpt}
          </p>
          
          <div className="flex items-center text-emerald-700 font-medium text-sm group-hover:text-emerald-600 transition-colors">
            Read more
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}