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

// Predict sentiment for a text
export const predictSentiment = async (text: string): Promise<SentimentPrediction> => {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Failed to predict sentiment');
  }

  return response.json();
};

// Get all reviews
export const getReviews = async (): Promise<Review[]> => {
  const response = await fetch(`${API_BASE_URL}/reviews`);

  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }

  return response.json();
};

// Get reviews by restaurant
export const getReviewsByRestaurant = async (restaurantName: string): Promise<Review[]> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${encodeURIComponent(restaurantName)}`);

  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }

  return response.json();
};

// Add a new review
export const addReview = async (review: Omit<Review, 'id' | 'sentiment' | 'sentimentScore' | 'date'>): Promise<Review> => {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    throw new Error('Failed to add review');
  }

  return response.json();
};

// Get all restaurants
export const getRestaurants = async (): Promise<Restaurant[]> => {
  const response = await fetch(`${API_BASE_URL}/restaurants`);

  if (!response.ok) {
    throw new Error('Failed to fetch restaurants');
  }

  return response.json();
};

// Get analytics
export const getAnalytics = async (): Promise<Analytics> => {
  const response = await fetch(`${API_BASE_URL}/analytics`);

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  return response.json();
};

// Get sentiment trend
export const getSentimentTrend = async (): Promise<SentimentTrend[]> => {
  const response = await fetch(`${API_BASE_URL}/sentiment-trend`);

  if (!response.ok) {
    throw new Error('Failed to fetch sentiment trend');
  }

  return response.json();
};

// Get category breakdown
export const getCategoryBreakdown = async (): Promise<CategoryBreakdown[]> => {
  const response = await fetch(`${API_BASE_URL}/category-breakdown`);

  if (!response.ok) {
    throw new Error('Failed to fetch category breakdown');
  }

  return response.json();
};
