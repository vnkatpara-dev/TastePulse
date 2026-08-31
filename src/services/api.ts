import { auth } from "../lib/firebase";
import { getIdToken } from "firebase/auth";

// Use relative URL - Vite proxy will forward to backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface Review {
  id: string;
  restaurantId?: string;
  restaurantName: string;
  authorUid?: string;
  customerName: string;
  rating: number;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  confidence?: number;
  date: string;
  category: string;
  ownerReply?: string;
  ownerReplyDate?: string;
  ownerUid?: string;
  createdAt?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  averageRating: number;
  totalReviews: number;
  ownerUid?: string;
  ownerEmail?: string;
  createdAt?: string;
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
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
    const err = await response.json().catch(() => ({ error: 'Failed to predict sentiment' }));
    throw new Error(err.error || 'Failed to predict sentiment');
  }

  return response.json();
};

// Delete a review (requires authentication; IDOR protected)
export const deleteReview = async (reviewId: string): Promise<void> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete review' }));
    throw new Error(error.error || 'Failed to delete review');
  }
};

// Get reviews with optional pagination and filters (Phase 4)
export const getReviews = async (params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  startAfter?: string;
  restaurantId?: string;
  restaurantName?: string;
}): Promise<Review[]> => {
  const headers = await getAuthHeaders();
  
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.startAfter) queryParams.append('startAfter', params.startAfter);
  if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId);
  if (params?.restaurantName) queryParams.append('restaurantName', params.restaurantName);
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/reviews${queryString ? '?' + queryString : ''}`;
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }

  return response.json();
};

// Get reviews by restaurant
export const getReviewsByRestaurant = async (restaurantName: string, startDate?: string, endDate?: string): Promise<Review[]> => {
  return getReviews({ restaurantName, startDate, endDate });
};

// Add a new review (requires authentication)
export const addReview = async (review: {
  restaurantId?: string;
  restaurantName: string;
  rating: number;
  text: string;
  category: string;
  customerName?: string;
}): Promise<Review> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to add review' }));
    throw new Error(err.error || 'Failed to add review');
  }

  return response.json();
};

// Get all restaurants
export const getRestaurants = async (myRestaurants = false): Promise<Restaurant[]> => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/restaurants${myRestaurants ? '?myRestaurants=true' : ''}`;
  
  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch restaurants');
  }

  return response.json();
};

// Get analytics
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
    const err = await response.json().catch(() => ({ error: 'Failed to add restaurant' }));
    throw new Error(err.error || 'Failed to add restaurant');
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
    const err = await response.json().catch(() => ({ error: 'Failed to delete restaurant' }));
    throw new Error(err.error || 'Failed to delete restaurant');
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
    const err = await response.json().catch(() => ({ error: 'Failed to update restaurant' }));
    throw new Error(err.error || 'Failed to update restaurant');
  }
};

// Add reply to a review (requires owner authentication)
export const addReplyToReview = async (reviewId: string, reply: string): Promise<void> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reply }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to add reply' }));
    throw new Error(err.error || 'Failed to add reply');
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

// Get dish insights
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

// ─── Churn Risk ───────────────────────────────────────────────────────────────

export interface ChurnRisk {
  customerName: string;
  lastVisit: string;
  lastRating: number;
  lastSentiment: 'positive' | 'negative' | 'neutral';
  lastReviewText: string;
  churnScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  daysSinceVisit: number;
  totalReviews: number;
  priorPositives: number;
}

export const getChurnRisks = async (restaurant?: string): Promise<ChurnRisk[]> => {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (restaurant) params.append('restaurant', restaurant);
  const queryString = params.toString();
  const url = `${API_BASE_URL}/churn-risk${queryString ? '?' + queryString : ''}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch churn risks');
  return response.json();
};

// ─── Menu Lifecycle ───────────────────────────────────────────────────────────

export interface MenuLifecycleWeek {
  week: string;
  positiveRatio: number;
  mentions: number;
  positive: number;
  negative: number;
  neutral: number;
}

export interface MenuLifecycleItem {
  name: string;
  weeks: MenuLifecycleWeek[];
  trend: 'rising' | 'stable' | 'declining';
  momentum: number;
  currentPositiveRatio: number;
  totalMentions: number;
}

export const getMenuLifecycle = async (restaurant?: string): Promise<MenuLifecycleItem[]> => {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (restaurant) params.append('restaurant', restaurant);
  const queryString = params.toString();
  const url = `${API_BASE_URL}/menu-lifecycle${queryString ? '?' + queryString : ''}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch menu lifecycle');
  return response.json();
};

// ─── Competitor Benchmark ─────────────────────────────────────────────────────

export interface BenchmarkDimensions {
  foodQuality: number;
  service: number;
  hygiene: number;
  value: number;
  ambiance: number;
}

export interface CompetitorBenchmarkItem {
  name: string;
  cuisine: string;
  totalReviews: number;
  dimensions: BenchmarkDimensions;
  overallScore: number;
  averageRating: number;
}

export const getCompetitorBenchmark = async (): Promise<CompetitorBenchmarkItem[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/competitor-benchmark`, { headers });
  if (!response.ok) throw new Error('Failed to fetch competitor benchmark');
  return response.json();
};
