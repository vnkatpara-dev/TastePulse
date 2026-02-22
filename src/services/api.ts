import { auth } from "../lib/firebase";
import { getIdToken } from "firebase/auth";

// Use relative URL - Vite proxy will forward to backend
// In production, set VITE_API_URL to your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface Review {
  id: string;
  customerName: string;
  restaurantName: string;
  rating: number;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  date: string;
  category: string;
  ownerReply?: string;
  ownerReplyDate?: string;
  ownerEmail?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  averageRating: number;
  totalReviews: number;
  sentimentSummary: {
    positive: number;
    negative: number;
    neutral: number;
    total: number;
    averageRating: number;
  };
}

export interface Analytics {
  totalReviews: number;
  positive: number;
  negative: number;
  neutral: number;
  positivePercent: number;
  negativePercent: number;
  averageRating: number;
}

export interface SentimentTrend {
  month: string;
  positive: number;
  negative: number;
  neutral: number;
}

export interface CategoryBreakdown {
  name: string;
  positive: number;
  negative: number;
}

export interface SentimentPrediction {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  confidence: number;
}

// Helper function to get auth headers
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // If user is authenticated, add the Firebase token
  if (auth.currentUser) {
    try {
      const token = await getIdToken(auth.currentUser);
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
  }
  
  return headers;
};

// Predict sentiment for a text
export const predictSentiment = async (text: string): Promise<SentimentPrediction> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Failed to predict sentiment');
  }

  return response.json();
};

// Delete a review (no auth required - for both customers and owners)
export const deleteReview = async (reviewId: string): Promise<void> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete review');
  }
};

// Get all reviews with optional date filtering
export const getReviews = async (startDate?: string, endDate?: string): Promise<Review[]> => {
  const headers = await getAuthHeaders();
  
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/reviews${queryString ? '?' + queryString : ''}`;
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }

  return response.json();
};

// Get reviews by restaurant
export const getReviewsByRestaurant = async (restaurantName: string, startDate?: string, endDate?: string): Promise<Review[]> => {
  const headers = await getAuthHeaders();
  
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/reviews/${encodeURIComponent(restaurantName)}${queryString ? '?' + queryString : ''}`;
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }

  return response.json();
};

// Add a new review (requires authentication)
export const addReview = async (review: Omit<Review, 'id' | 'sentiment' | 'sentimentScore' | 'date'>): Promise<Review> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    throw new Error('Failed to add review');
  }

  return response.json();
};

// Get all restaurants
export const getRestaurants = async (): Promise<Restaurant[]> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/restaurants`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch restaurants');
  }

  return response.json();
};

// Get analytics (requires authentication for detailed data)
export const getAnalytics = async (): Promise<Analytics> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/analytics`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  return response.json();
};

// Get sentiment trend
export const getSentimentTrend = async (): Promise<SentimentTrend[]> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/sentiment-trend`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sentiment trend');
  }

  return response.json();
};

// Get category breakdown
export const getCategoryBreakdown = async (): Promise<CategoryBreakdown[]> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/category-breakdown`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch category breakdown');
  }

  return response.json();
};

// Add a new restaurant (requires owner authentication)
export const addRestaurant = async (restaurant: { name: string; cuisine: string }): Promise<Restaurant> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/restaurants`, {
    method: 'POST',
    headers,
    body: JSON.stringify(restaurant),
  });

  if (!response.ok) {
    throw new Error('Failed to add restaurant');
  }

  return response.json();
};

// Delete a restaurant (requires owner authentication)
export const deleteRestaurant = async (restaurantId: string): Promise<void> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete restaurant');
  }
};

// Update a restaurant (requires owner authentication)
export const updateRestaurant = async (restaurantId: string, restaurant: { name?: string; cuisine?: string }): Promise<void> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(restaurant),
  });

  if (!response.ok) {
    throw new Error('Failed to update restaurant');
  }
};

// Add reply to a review (requires authentication)
export const addReplyToReview = async (reviewId: string, reply: string): Promise<void> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reply }),
  });

  if (!response.ok) {
    throw new Error('Failed to add reply to review');
  }
};

// Dish insight interface
export interface DishInsight {
  name: string;
  count: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

// Get dish insights (requires owner authentication)
export const getDishInsights = async (restaurant?: string, startDate?: string, endDate?: string): Promise<DishInsight[]> => {
  const headers = await getAuthHeaders();
  
  const params = new URLSearchParams();
  if (restaurant) params.append('restaurant', restaurant);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/dish-insights${queryString ? '?' + queryString : ''}`;
  
  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dish insights');
  }

  return response.json();
};
