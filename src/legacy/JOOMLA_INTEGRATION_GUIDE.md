# Joomla Database Integration Guide

This guide explains how to integrate your existing Joomla website database with the new Amaranth website.

## 🚀 Quick Setup

### 1. Configure Joomla API Settings

Edit `/services/joomlaApi.ts` and update these values:

```typescript
const JOOMLA_CONFIG: JoomlaConfig = {
  baseUrl: 'https://amaranth.vsu.edu.ph', // Your actual Joomla site URL
  apiKey: 'YOUR_ACTUAL_API_KEY', // Generate this in Joomla Admin
  username: 'admin', // Your admin username
  password: 'your_actual_password' // Your admin password
};
```

### 2. Enable Joomla Web Services API

In your Joomla admin panel:
1. Go to **System → Global Configuration**
2. Navigate to **Web Services** tab
3. Enable **Web Services**
4. Set **CORS** to enabled (if needed)
5. Generate an **API Token** in User Manager

### 3. Files to Update for Full Integration

#### A. Authentication Integration
- **File**: `/components/LoginDialog.tsx`
- **Update Line 35-45**: Replace mock authentication with real Joomla API call

```typescript
// Replace this mock code:
if (credentials.username === "admin" && credentials.password === "admin123") {

// With actual Joomla authentication:
const result = await joomlaApi.authenticate(credentials.username, credentials.password);
if (result.success) {
```

#### B. Article Data Integration
- **File**: `/components/SectionContent.tsx`
- **Update Line 20-60**: Replace mock articles with Joomla data

```typescript
// Add this at the top:
import { useJoomlaApi, JoomlaArticle } from '../services/joomlaApi';

// Replace mock articles with:
const { getArticlesByCategory } = useJoomlaApi();
const [articles, setArticles] = useState<JoomlaArticle[]>([]);

useEffect(() => {
  loadArticles();
}, [section]);

const loadArticles = async () => {
  const categoryMap = {
    'news': 1, // Your Joomla category IDs
    'sports': 2,
    'feature': 3,
    // etc...
  };
  
  const categoryId = categoryMap[section] || 1;
  const data = await getArticlesByCategory(categoryId);
  setArticles(data.map(transformJoomlaArticle));
};
```

#### C. Search Integration
- **File**: `/components/SearchDialog.tsx`
- **Update Line 45-55**: Replace mock search with Joomla search

```typescript
const { searchArticles } = useJoomlaApi();

const handleSearch = async (query: string) => {
  setIsSearching(true);
  const results = await searchArticles(query);
  setSearchResults(results.map(transformJoomlaArticle));
  setIsSearching(false);
};
```

#### D. Dashboard Analytics
- **File**: `/components/Dashboard.tsx`
- **Update Line 25-40**: Connect to real analytics

```typescript
const { getAnalytics } = useJoomlaApi();

useEffect(() => {
  loadAnalytics();
}, []);

const loadAnalytics = async () => {
  const data = await getAnalytics();
  setAnalyticsData(data);
};
```

#### E. Article Creation
- **File**: `/components/ArticleSubmissionForm.tsx`
- **Update Line 85-95**: Submit to Joomla

```typescript
const { createArticle } = useJoomlaApi();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  const result = await createArticle({
    title: formData.title,
    content: formData.content,
    excerpt: formData.excerpt,
    author: formData.author,
    categoryId: getCategoryId(formData.category)
  });
  
  if (result.success) {
    toast.success("Article published successfully!");
  } else {
    toast.error("Failed to publish article");
  }
  
  setIsSubmitting(false);
};
```

## 🔧 Joomla Extensions Needed

### 1. Enable Web Services Components
Ensure these components have Web Services enabled:
- **com_content** (Articles)
- **com_categories** (Categories)
- **com_users** (Users)

### 2. Custom Analytics Extension (Optional)
Create a simple Joomla plugin for analytics:

```php
// /plugins/webservices/analytics/analytics.php
<?php
defined('_JEXEC') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Router\ApiRouter;

class PlgWebservicesAnalytics extends CMSPlugin
{
    public function onBeforeApiRoute(&$router)
    {
        $router->createCRUDRoutes(
            'v1/analytics',
            'analytics',
            ['component' => 'com_analytics']
        );
    }
}
```

## 📊 Database Table Mapping

### Articles Table Mapping
```sql
-- Joomla #__content table maps to our NewsCard component
SELECT 
    id,
    title,
    alias,
    introtext as excerpt,
    fulltext as content,
    created,
    created_by_alias as author,
    catid,
    state,
    featured,
    hits
FROM #__content 
WHERE state = 1 -- Published only
ORDER BY created DESC;
```

### Categories Table Mapping
```sql
-- Joomla #__categories table maps to our navigation sections
SELECT 
    id,
    title,
    alias,
    description
FROM #__categories 
WHERE extension = 'com_content' 
AND published = 1;
```

## 🔐 Security Considerations

### 1. API Key Security
- Store API keys in environment variables
- Use HTTPS only
- Implement rate limiting

### 2. User Authentication
- Validate tokens on each request
- Implement session timeout
- Use secure password policies

### 3. Content Validation
- Sanitize all input data
- Validate file uploads
- Check user permissions

## 🚦 Testing Integration

### 1. Test Authentication
```javascript
// Test in browser console:
import { joomlaApi } from './services/joomlaApi';
const result = await joomlaApi.authenticate('admin', 'password');
console.log(result);
```

### 2. Test Article Retrieval
```javascript
const articles = await joomlaApi.getArticles(5);
console.log('Articles:', articles);
```

### 3. Test Article Creation
```javascript
const newArticle = await joomlaApi.createArticle({
  title: 'Test Article',
  content: 'Test content',
  excerpt: 'Test excerpt'
});
console.log('Created:', newArticle);
```

## 📝 Migration Steps

### Phase 1: Setup API Connection
1. Configure Joomla Web Services
2. Update `/services/joomlaApi.ts` with real credentials
3. Test basic connectivity

### Phase 2: Replace Mock Data
1. Update authentication in `LoginDialog.tsx`
2. Replace article data in `SectionContent.tsx`
3. Connect search functionality

### Phase 3: Enable Publishing
1. Update article submission form
2. Connect dashboard analytics
3. Test full workflow

### Phase 4: Go Live
1. Update DNS/hosting
2. Test all functionality
3. Train content editors

## 🆘 Troubleshooting

### Common Issues:

**CORS Errors**: Enable CORS in Joomla Global Configuration
**Authentication Failed**: Check API token and user permissions
**No Articles Returned**: Verify category IDs and publication status
**Slow Loading**: Implement caching and pagination

### Debug Mode:
Add this to enable debug logging:
```typescript
// In joomlaApi.ts
console.log('API Request:', url, options);
console.log('API Response:', data);
```

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify Joomla API endpoints are working
3. Test with Postman/curl first
4. Check server logs for PHP errors

This integration will seamlessly connect your new modern website with your existing Joomla database while providing enhanced functionality and better user experience.