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

// ─── LOCAL SYNCHRONIZED STORAGE ENGINE (DEMO & BACKEND SYNC) ─────────────────

const INITIAL_SEED_RESTAURANTS: Restaurant[] = [
  {
    id: "1",
    name: "The Golden Fork",
    cuisine: "Italian",
    averageRating: 4.2,
    totalReviews: 5,
    ownerUid: "demo_owner_1",
    sentimentSummary: { positive: 3, negative: 1, neutral: 1, total: 5, averageRating: 4.2 }
  },
  {
    id: "2",
    name: "Spice Route",
    cuisine: "Indian",
    averageRating: 4.1,
    totalReviews: 4,
    ownerUid: "demo_owner_2",
    sentimentSummary: { positive: 3, negative: 0, neutral: 1, total: 4, averageRating: 4.1 }
  },
  {
    id: "3",
    name: "Ocean Breeze",
    cuisine: "Seafood",
    averageRating: 4.4,
    totalReviews: 3,
    ownerUid: "demo_owner_3",
    sentimentSummary: { positive: 2, negative: 0, neutral: 1, total: 3, averageRating: 4.4 }
  },
  {
    id: "burger-shack-id",
    name: "Burger Shack",
    cuisine: "Fast Food",
    averageRating: 3.8,
    totalReviews: 2,
    ownerUid: "demo_owner_4",
    sentimentSummary: { positive: 1, negative: 1, neutral: 0, total: 2, averageRating: 3.8 }
  },
  {
    id: "sakura-sushi-id",
    name: "Sakura Sushi",
    cuisine: "Japanese",
    averageRating: 4.6,
    totalReviews: 2,
    ownerUid: "demo_owner_5",
    sentimentSummary: { positive: 2, negative: 0, neutral: 0, total: 2, averageRating: 4.6 }
  }
];

const INITIAL_SEED_REVIEWS: Review[] = [
  { id: "seed-1", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Alice M.", rating: 5, text: "Absolutely stunning food and ambiance. The truffle pasta was divine!", sentiment: "positive", sentimentScore: 0.95, date: "2026-02-18", category: "Food Quality" },
  { id: "seed-2", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Bob T.", rating: 2, text: "Service was incredibly slow. Waited 45 minutes for appetizers.", sentiment: "negative", sentimentScore: 0.15, date: "2026-02-17", category: "Service" },
  { id: "seed-3", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Carol S.", rating: 4, text: "Great food but the noise level made conversation difficult.", sentiment: "neutral", sentimentScore: 0.6, date: "2026-02-16", category: "Ambiance" },
  { id: "seed-4", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Frank H.", rating: 4, text: "Lovely date night spot. Wine selection is impressive.", sentiment: "positive", sentimentScore: 0.82, date: "2026-02-13", category: "Ambiance" },
  { id: "seed-5", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Jack R.", rating: 4, text: "Rich flavorful lasagna and delicious dessert.", sentiment: "positive", sentimentScore: 0.88, date: "2026-02-09", category: "Food Quality" },
  
  { id: "seed-6", restaurantId: "2", restaurantName: "Spice Route", customerName: "David L.", rating: 5, text: "Best Indian food I've had! The butter chicken is phenomenal.", sentiment: "positive", sentimentScore: 0.92, date: "2026-02-15", category: "Food Quality" },
  { id: "seed-7", restaurantId: "2", restaurantName: "Spice Route", customerName: "Irene D.", rating: 4, text: "Warm and welcoming staff. The naan bread was perfectly crispy.", sentiment: "positive", sentimentScore: 0.85, date: "2026-02-10", category: "Service" },
  { id: "seed-8", restaurantId: "2", restaurantName: "Spice Route", customerName: "Leo M.", rating: 3, text: "Decent curry but nothing extraordinary given the hype.", sentiment: "neutral", sentimentScore: 0.5, date: "2026-02-07", category: "Food Quality" },
  { id: "seed-9", restaurantId: "2", restaurantName: "Spice Route", customerName: "Priya S.", rating: 5, text: "Authentic spice blends and quick hospitable service.", sentiment: "positive", sentimentScore: 0.94, date: "2026-02-05", category: "Food Quality" },

  { id: "seed-10", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Grace K.", rating: 5, text: "The freshest seafood in town. Lobster bisque was out of this world!", sentiment: "positive", sentimentScore: 0.97, date: "2026-02-12", category: "Food Quality" },
  { id: "seed-11", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Henry P.", rating: 3, text: "Food was okay but slightly overpriced for the portion size.", sentiment: "neutral", sentimentScore: 0.45, date: "2026-02-11", category: "Value" },
  { id: "seed-12", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Karen B.", rating: 5, text: "The sunset view paired with amazing fresh oysters. Unforgettable experience!", sentiment: "positive", sentimentScore: 0.94, date: "2026-02-08", category: "Ambiance" },

  { id: "seed-13", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Tom C.", rating: 5, text: "Juicy smash burgers, hot crispy fries, and excellent milkshakes!", sentiment: "positive", sentimentScore: 0.91, date: "2026-02-14", category: "Food Quality" },
  { id: "seed-14", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Sam W.", rating: 2, text: "Buns were cold and burger was overcooked. Disappointing visit.", sentiment: "negative", sentimentScore: 0.18, date: "2026-02-02", category: "Food Quality" },

  { id: "seed-15", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Yuki T.", rating: 5, text: "Mastercrafted sashimi and fresh nigiri with impeccable presentation.", sentiment: "positive", sentimentScore: 0.96, date: "2026-02-18", category: "Food Quality" },
  { id: "seed-16", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Rachel G.", rating: 5, text: "Great dining atmosphere, polite servers, and delicious dragon rolls.", sentiment: "positive", sentimentScore: 0.93, date: "2026-02-15", category: "Service" }
];

export const getStoredReviews = (): Review[] => {
  try {
    const raw = localStorage.getItem("tastepulse_reviews_store");
    if (!raw) {
      localStorage.setItem("tastepulse_reviews_store", JSON.stringify(INITIAL_SEED_REVIEWS));
      return INITIAL_SEED_REVIEWS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SEED_REVIEWS;
  }
};

export const saveStoredReviews = (reviews: Review[]) => {
  try {
    localStorage.setItem("tastepulse_reviews_store", JSON.stringify(reviews));
    window.dispatchEvent(new CustomEvent('tastepulse_review_store_updated', { detail: reviews }));
  } catch (err) {
    console.error("Failed to save reviews store to localStorage:", err);
  }
};

export const getStoredRestaurants = (): Restaurant[] => {
  try {
    const raw = localStorage.getItem("tastepulse_restaurants_store");
    let restaurants: Restaurant[] = raw ? JSON.parse(raw) : INITIAL_SEED_RESTAURANTS;
    if (!raw) {
      localStorage.setItem("tastepulse_restaurants_store", JSON.stringify(INITIAL_SEED_RESTAURANTS));
    }

    // Always recalculate sentiment summary from the latest stored reviews
    const allReviews = getStoredReviews();
    restaurants = restaurants.map(r => {
      const matchingReviews = allReviews.filter(rev => rev.restaurantName === r.name || (r.id && rev.restaurantId === r.id));
      const total = matchingReviews.length;
      if (total > 0) {
        const pos = matchingReviews.filter(rev => rev.sentiment === 'positive').length;
        const neg = matchingReviews.filter(rev => rev.sentiment === 'negative').length;
        const neu = matchingReviews.filter(rev => rev.sentiment === 'neutral').length;
        const avg = Math.round((matchingReviews.reduce((sum, rev) => sum + (rev.rating || 0), 0) / total) * 10) / 10;
        return {
          ...r,
          totalReviews: total,
          averageRating: avg,
          sentimentSummary: {
            positive: pos,
            negative: neg,
            neutral: neu,
            total,
            averageRating: avg
          }
        };
      }
      return r;
    });

    return restaurants;
  } catch {
    return INITIAL_SEED_RESTAURANTS;
  }
};

export const saveStoredRestaurants = (restaurants: Restaurant[]) => {
  try {
    localStorage.setItem("tastepulse_restaurants_store", JSON.stringify(restaurants));
    window.dispatchEvent(new CustomEvent('tastepulse_review_store_updated'));
  } catch (err) {
    console.error("Failed to save restaurants store:", err);
  }
};

// Client-side rule-based sentiment prediction fallback
export const predictSentimentClient = (text: string): SentimentPrediction => {
  const textLower = text.toLowerCase();
  const posWords = [
    "good", "great", "excellent", "amazing", "love", "delicious",
    "friendly", "awesome", "best", "nice", "fantastic", "wonderful",
    "perfect", "stunning", "phenomenal", "impressive", "warm",
    "welcoming", "fresh", "divine", "outstanding", "superb", "tasty", "favorite", "rich"
  ];
  const negWords = [
    "bad", "terrible", "awful", "hate", "horrible", "rude",
    "slow", "worst", "poor", "disgusting", "dirty", "cold",
    "overpriced", "dismissive", "hair", "undercooked", "stale", "disappointing"
  ];

  const posCount = posWords.filter(w => textLower.includes(w)).length;
  const negCount = negWords.filter(w => textLower.includes(w)).length;

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  let sentimentScore = 0.5;
  let confidence = 0.75;

  if (posCount > negCount) {
    sentiment = 'positive';
    sentimentScore = Math.min(0.98, 0.65 + (posCount * 0.1));
    confidence = 0.85;
  } else if (negCount > posCount) {
    sentiment = 'negative';
    sentimentScore = Math.max(0.05, 0.35 - (negCount * 0.1));
    confidence = 0.85;
  }

  return { sentiment, sentimentScore, confidence };
};

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
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback to local predictor
  }
  return predictSentimentClient(text);
};

// Delete a review
export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    // Continue to remove locally
  }

  // Remove from local store
  const reviews = getStoredReviews().filter(r => r.id !== reviewId);
  saveStoredReviews(reviews);
};

// Get reviews with optional pagination and filters
export const getReviews = async (params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  startAfter?: string;
  restaurantId?: string;
  restaurantName?: string;
}): Promise<Review[]> => {
  let backendReviews: Review[] = [];
  try {
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

    if (response.ok) {
      backendReviews = await response.json();
    }
  } catch {
    // Use stored reviews
  }

  const stored = getStoredReviews();
  
  // Merge and deduplicate by id
  const combinedMap = new Map<string, Review>();
  stored.forEach(r => combinedMap.set(r.id, r));
  backendReviews.forEach(r => combinedMap.set(r.id, r));

  let results = Array.from(combinedMap.values());

  if (params?.restaurantName) {
    results = results.filter(r => r.restaurantName === params.restaurantName);
  }
  if (params?.restaurantId) {
    results = results.filter(r => r.restaurantId === params.restaurantId);
  }
  if (params?.startDate) {
    results = results.filter(r => r.date >= params.startDate!);
  }
  if (params?.endDate) {
    results = results.filter(r => r.date <= params.endDate!);
  }

  // Sort descending by date
  results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return results;
};

// Get reviews by restaurant
export const getReviewsByRestaurant = async (restaurantName: string, startDate?: string, endDate?: string): Promise<Review[]> => {
  return getReviews({ restaurantName, startDate, endDate });
};

// Add a new review (requires authentication / demo session)
export const addReview = async (review: {
  restaurantId?: string;
  restaurantName: string;
  rating: number;
  text: string;
  category: string;
  customerName?: string;
}): Promise<Review> => {
  // 1. Predict sentiment
  let sentimentData: SentimentPrediction;
  try {
    sentimentData = await predictSentiment(review.text);
  } catch {
    sentimentData = predictSentimentClient(review.text);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const newReviewId = `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  const createdReview: Review = {
    id: newReviewId,
    restaurantId: review.restaurantId || "",
    restaurantName: review.restaurantName,
    customerName: review.customerName || "Demo Customer",
    rating: review.rating,
    text: review.text,
    category: review.category || "General",
    sentiment: sentimentData.sentiment,
    sentimentScore: sentimentData.sentimentScore,
    confidence: sentimentData.confidence,
    date: todayStr,
    createdAt: new Date().toISOString()
  };

  // 2. Persist to local store immediately so all dashboards instantly sync
  const currentReviews = getStoredReviews();
  const updatedReviews = [createdReview, ...currentReviews];
  saveStoredReviews(updatedReviews);

  // 3. Update restaurant list in local store with new stats
  getStoredRestaurants();

  // 4. Try sending to backend if online
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createdReview),
    });
    if (response.ok) {
      const backendData = await response.json();
      return backendData;
    }
  } catch {
    // Offline / Demo fallback completed successfully
  }

  return createdReview;
};

// Get all restaurants
export const getRestaurants = async (myRestaurants = false): Promise<Restaurant[]> => {
  try {
    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/restaurants${myRestaurants ? '?myRestaurants=true' : ''}`;
    const response = await fetch(url, { headers });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Fallback to local store
  }

  return getStoredRestaurants();
};

// Get analytics
export const getAnalytics = async (): Promise<Analytics> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/analytics`, { headers });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback
  }

  const reviews = getStoredReviews();
  const totalReviews = reviews.length;
  const positive = reviews.filter(r => r.sentiment === 'positive').length;
  const negative = reviews.filter(r => r.sentiment === 'negative').length;
  const neutral = reviews.filter(r => r.sentiment === 'neutral').length;
  const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

  return {
    totalReviews,
    positive,
    negative,
    neutral,
    positivePercent: totalReviews > 0 ? Math.round((positive / totalReviews) * 100 * 10) / 10 : 0,
    negativePercent: totalReviews > 0 ? Math.round((negative / totalReviews) * 100 * 10) / 10 : 0,
    averageRating: Math.round(avgRating * 10) / 10
  };
};

// Get sentiment trend
export const getSentimentTrend = async (): Promise<SentimentTrend[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sentiment-trend`, { headers });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback
  }

  const reviews = getStoredReviews();
  const monthlyData: Record<string, { positive: number; negative: number; neutral: number }> = {
    "Sep": { positive: 45, negative: 12, neutral: 8 },
    "Oct": { positive: 52, negative: 15, neutral: 10 },
    "Nov": { positive: 48, negative: 18, neutral: 12 },
    "Dec": { positive: 65, negative: 10, neutral: 8 },
    "Jan": { positive: 58, negative: 14, neutral: 11 },
    "Feb": { positive: 62, negative: 8, neutral: 9 },
  };

  reviews.forEach(r => {
    const d = r.date || "";
    if (d.startsWith("2026-02") || d.includes("Feb")) {
      const s = r.sentiment || "neutral";
      if (monthlyData["Feb"][s] !== undefined) {
        monthlyData["Feb"][s] += 1;
      }
    }
  });

  return Object.entries(monthlyData).map(([month, counts]) => ({
    month,
    ...counts
  }));
};

// Get category breakdown
export const getCategoryBreakdown = async (): Promise<CategoryBreakdown[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/category-breakdown`, { headers });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback
  }

  const reviews = getStoredReviews();
  const catMap: Record<string, { positive: number; negative: number }> = {
    "Food Quality": { positive: 78, negative: 12 },
    "Service": { positive: 45, negative: 35 },
    "Ambiance": { positive: 60, negative: 10 },
    "Value": { positive: 40, negative: 25 },
    "Hygiene": { positive: 55, negative: 8 },
  };

  reviews.forEach(r => {
    const cat = r.category || "General";
    if (!catMap[cat]) {
      catMap[cat] = { positive: 0, negative: 0 };
    }
    if (r.sentiment === 'positive') {
      catMap[cat].positive += 1;
    } else {
      catMap[cat].negative += 1;
    }
  });

  return Object.entries(catMap).map(([name, counts]) => ({
    name,
    ...counts
  }));
};

// Add a new restaurant (requires owner authentication)
export const addRestaurant = async (restaurant: { name: string; cuisine: string }): Promise<Restaurant> => {
  const newRestaurant: Restaurant = {
    id: `rest-${Date.now()}`,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    averageRating: 0,
    totalReviews: 0,
    sentimentSummary: { positive: 0, negative: 0, neutral: 0, total: 0, averageRating: 0 }
  };

  const stored = getStoredRestaurants();
  const updated = [...stored, newRestaurant];
  saveStoredRestaurants(updated);

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/restaurants`, {
      method: 'POST',
      headers,
      body: JSON.stringify(restaurant),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback completed
  }

  return newRestaurant;
};

// Delete a restaurant (requires owner authentication)
export const deleteRestaurant = async (restaurantId: string): Promise<void> => {
  const stored = getStoredRestaurants().filter(r => r.id !== restaurantId);
  saveStoredRestaurants(stored);

  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    // Ignored
  }
};

// Update a restaurant
export const updateRestaurant = async (restaurantId: string, restaurant: { name?: string; cuisine?: string }): Promise<void> => {
  const stored = getStoredRestaurants().map(r => {
    if (r.id === restaurantId) {
      return { ...r, ...restaurant };
    }
    return r;
  });
  saveStoredRestaurants(stored);

  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(restaurant),
    });
  } catch {
    // Ignored
  }
};

// Add reply to a review
export const addReplyToReview = async (reviewId: string, reply: string): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  const stored = getStoredReviews().map(r => {
    if (r.id === reviewId) {
      return { ...r, ownerReply: reply, ownerReplyDate: today };
    }
    return r;
  });
  saveStoredReviews(stored);

  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE_URL}/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reply }),
    });
  } catch {
    // Ignored
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
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (restaurant) params.append('restaurant', restaurant);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/dish-insights${queryString ? '?' + queryString : ''}`;
    const response = await fetch(url, { headers });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback
  }

  const reviews = getStoredReviews().filter(r => !restaurant || r.restaurantName === restaurant);
  const DISHES_AND_ASPECTS: Record<string, string[]> = {
    'Pasta & Lasagna': ['pasta', 'lasagna', 'spaghetti', 'truffle pasta', 'ravioli'],
    'Steak & Beef': ['steak', 'beef', 'ribeye', 'sirloin'],
    'Seafood & Lobster': ['lobster', 'bisque', 'seafood', 'crab', 'fish', 'oysters', 'sushi'],
    'Indian Cuisine': ['chicken', 'tikka', 'vindaloo', 'curry', 'samosa', 'naan'],
    'Service Quality': ['service', 'waiter', 'waitress', 'staff', 'server', 'reservation'],
    'Ambiance & Music': ['ambiance', 'atmosphere', 'decor', 'noise', 'view'],
    'Value & Pricing': ['price', 'overpriced', 'value', 'expensive', 'cost'],
    'Hygiene Standards': ['hygiene', 'dirty', 'hair', 'cleanliness', 'clean']
  };

  const insights: Record<string, { positive: number; negative: number; neutral: number }> = {};
  Object.keys(DISHES_AND_ASPECTS).forEach(name => {
    insights[name] = { positive: 0, negative: 0, neutral: 0 };
  });

  reviews.forEach(r => {
    const textLower = (r.text || "").toLowerCase();
    const sentiment = r.sentiment || 'neutral';
    Object.entries(DISHES_AND_ASPECTS).forEach(([groupName, keywords]) => {
      if (keywords.some(kw => textLower.includes(kw))) {
        insights[groupName][sentiment] += 1;
      }
    });
  });

  const result: DishInsight[] = [];
  Object.entries(insights).forEach(([name, counts]) => {
    const total = counts.positive + counts.negative + counts.neutral;
    if (total > 0) {
      result.push({
        name,
        count: total,
        sentiment: counts
      });
    }
  });

  result.sort((a, b) => b.count - a.count);
  return result;
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
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (restaurant) params.append('restaurant', restaurant);
    const queryString = params.toString();
    const url = `${API_BASE_URL}/churn-risk${queryString ? '?' + queryString : ''}`;
    const response = await fetch(url, { headers });
    if (response.ok) return await response.json();
  } catch {
    // Fallback
  }

  const reviews = getStoredReviews().filter(r => !restaurant || r.restaurantName === restaurant);
  const customers: Record<string, Review[]> = {};
  reviews.forEach(r => {
    const name = r.customerName || "Diner";
    if (!customers[name]) customers[name] = [];
    customers[name].push(r);
  });

  const results: ChurnRisk[] = [];
  Object.entries(customers).forEach(([name, custReviews]) => {
    const latest = custReviews[0];
    const score = latest.sentiment === 'negative' ? 75 : latest.sentiment === 'neutral' ? 45 : 15;
    results.push({
      customerName: name,
      lastVisit: latest.date,
      lastRating: latest.rating,
      lastSentiment: latest.sentiment,
      lastReviewText: latest.text,
      churnScore: score,
      riskLevel: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low',
      daysSinceVisit: 14,
      totalReviews: custReviews.length,
      priorPositives: custReviews.filter(r => r.sentiment === 'positive').length
    });
  });

  results.sort((a, b) => b.churnScore - a.churnScore);
  return results.slice(0, 10);
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
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (restaurant) params.append('restaurant', restaurant);
    const queryString = params.toString();
    const url = `${API_BASE_URL}/menu-lifecycle${queryString ? '?' + queryString : ''}`;
    const response = await fetch(url, { headers });
    if (response.ok) return await response.json();
  } catch {
    // Fallback
  }

  return [
    {
      name: "Truffle Pasta & Lasagna",
      weeks: [
        { week: "2026-W05", positiveRatio: 80, mentions: 5, positive: 4, negative: 1, neutral: 0 },
        { week: "2026-W06", positiveRatio: 88, mentions: 8, positive: 7, negative: 1, neutral: 0 },
        { week: "2026-W07", positiveRatio: 92, mentions: 12, positive: 11, negative: 1, neutral: 0 }
      ],
      trend: "rising",
      momentum: 12,
      currentPositiveRatio: 92,
      totalMentions: 25
    },
    {
      name: "Butter Chicken & Naan",
      weeks: [
        { week: "2026-W05", positiveRatio: 90, mentions: 6, positive: 5, negative: 0, neutral: 1 },
        { week: "2026-W06", positiveRatio: 90, mentions: 7, positive: 6, negative: 0, neutral: 1 },
        { week: "2026-W07", positiveRatio: 91, mentions: 10, positive: 9, negative: 0, neutral: 1 }
      ],
      trend: "stable",
      momentum: 1,
      currentPositiveRatio: 91,
      totalMentions: 23
    },
    {
      name: "Lobster Bisque & Seafood",
      weeks: [
        { week: "2026-W05", positiveRatio: 95, mentions: 4, positive: 4, negative: 0, neutral: 0 },
        { week: "2026-W06", positiveRatio: 90, mentions: 5, positive: 4, negative: 0, neutral: 1 },
        { week: "2026-W07", positiveRatio: 94, mentions: 6, positive: 5, negative: 0, neutral: 1 }
      ],
      trend: "stable",
      momentum: 2,
      currentPositiveRatio: 94,
      totalMentions: 15
    }
  ];
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
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/competitor-benchmark`, { headers });
    if (response.ok) return await response.json();
  } catch {
    // Fallback
  }

  const restaurants = getStoredRestaurants();
  return restaurants.map(r => ({
    name: r.name,
    cuisine: r.cuisine,
    totalReviews: r.totalReviews,
    averageRating: r.averageRating,
    dimensions: {
      foodQuality: Math.min(100, Math.round(r.averageRating * 20)),
      service: Math.min(100, Math.round((r.averageRating - 0.2) * 20)),
      hygiene: Math.min(100, Math.round((r.averageRating + 0.1) * 20)),
      value: Math.min(100, Math.round((r.averageRating - 0.3) * 20)),
      ambiance: Math.min(100, Math.round(r.averageRating * 20))
    },
    overallScore: Math.min(100, Math.round(r.averageRating * 20))
  }));
};
