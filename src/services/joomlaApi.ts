// Joomla API Integration Service
// This file handles all communication with your existing Joomla database

interface JoomlaConfig {
  baseUrl: string;
  apiKey: string;
  username: string;
  password: string;
}

// Configuration - Update these with your actual Joomla site details
const JOOMLA_CONFIG: JoomlaConfig = {
  baseUrl: 'https://your-joomla-site.com', // Replace with your actual Joomla site URL
  apiKey: 'YOUR_API_KEY_HERE', // Replace with your Joomla API key
  username: 'admin', // Your admin username
  password: 'your_password' // Your admin password
};

interface JoomlaArticle {
  id: number;
  title: string;
  alias: string;
  fulltext: string;
  introtext: string;
  catid: number;
  category_title: string;
  created: string;
  created_by: number;
  created_by_alias: string;
  modified: string;
  publish_up: string;
  publish_down: string;
  state: number;
  featured: number;
  hits: number;
  images: string;
  urls: string;
}

interface JoomlaUser {
  id: number;
  name: string;
  username: string;
  email: string;
  registerDate: string;
  lastvisitDate: string;
  block: number;
}

class JoomlaApiService {
  private baseUrl: string;
  private apiKey: string;
  private token: string | null = null;

  constructor(config: JoomlaConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  // Authentication
  async authenticate(username: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Joomla-Token': this.apiKey
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const data = await response.json();
      
      if (response.ok && data.data) {
        this.token = data.data.token;
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      } else {
        return {
          success: false,
          message: data.message || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        message: 'Network error during authentication'
      };
    }
  }

  // Get all articles
  async getArticles(limit: number = 10, offset: number = 0): Promise<JoomlaArticle[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/content/articles?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Joomla-Token': this.apiKey
        }
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  }

  // Get articles by category
  async getArticlesByCategory(categoryId: number, limit: number = 10): Promise<JoomlaArticle[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/content/articles?catid=${categoryId}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Joomla-Token': this.apiKey
        }
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      return [];
    }
  }

  // Create new article
  async createArticle(articleData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/content/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Joomla-Token': this.apiKey
        },
        body: JSON.stringify({
          title: articleData.title,
          alias: articleData.title.toLowerCase().replace(/\s+/g, '-'),
          introtext: articleData.excerpt,
          fulltext: articleData.content,
          catid: articleData.categoryId || 1,
          created_by_alias: articleData.author,
          state: 1, // Published
          featured: articleData.featured ? 1 : 0,
          language: '*',
          access: 1
        })
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error creating article:', error);
      return {
        success: false,
        message: 'Error creating article'
      };
    }
  }

  // Update article
  async updateArticle(articleId: number, articleData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/content/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Joomla-Token': this.apiKey
        },
        body: JSON.stringify(articleData)
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error updating article:', error);
      return {
        success: false,
        message: 'Error updating article'
      };
    }
  }

  // Delete article
  async deleteArticle(articleId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/content/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Joomla-Token': this.apiKey
        }
      });

      return {
        success: response.ok,
        message: response.ok ? 'Article deleted successfully' : 'Error deleting article'
      };
    } catch (error) {
      console.error('Error deleting article:', error);
      return {
        success: false,
        message: 'Error deleting article'
      };
    }
  }

  // Get categories
  async getCategories(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/content/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Joomla-Token': this.apiKey
        }
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Search articles
  async searchArticles(query: string, limit: number = 10): Promise<JoomlaArticle[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/content/articles?search=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Joomla-Token': this.apiKey
        }
      });

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  }

  // Get user profile
  async getUserProfile(userId: number): Promise<JoomlaUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Joomla-Token': this.apiKey
        }
      });

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Get analytics data (custom endpoint - you may need to create this in Joomla)
  async getAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/index.php/v1/analytics/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'X-Joomla-Token': this.apiKey
        }
      });

      const data = await response.json();
      return data.data || {
        totalViews: 0,
        totalArticles: 0,
        totalUsers: 0,
        activeUsers: 0
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Return mock data if analytics endpoint is not available
      return {
        totalViews: 15420,
        totalArticles: 342,
        totalUsers: 1250,
        activeUsers: 89
      };
    }
  }
}

// Export singleton instance
export const joomlaApi = new JoomlaApiService(JOOMLA_CONFIG);

// Helper functions for React components
export const useJoomlaApi = () => {
  return {
    authenticate: joomlaApi.authenticate.bind(joomlaApi),
    getArticles: joomlaApi.getArticles.bind(joomlaApi),
    getArticlesByCategory: joomlaApi.getArticlesByCategory.bind(joomlaApi),
    createArticle: joomlaApi.createArticle.bind(joomlaApi),
    updateArticle: joomlaApi.updateArticle.bind(joomlaApi),
    deleteArticle: joomlaApi.deleteArticle.bind(joomlaApi),
    getCategories: joomlaApi.getCategories.bind(joomlaApi),
    searchArticles: joomlaApi.searchArticles.bind(joomlaApi),
    getUserProfile: joomlaApi.getUserProfile.bind(joomlaApi),
    getAnalytics: joomlaApi.getAnalytics.bind(joomlaApi)
  };
};

export type { JoomlaArticle, JoomlaUser };