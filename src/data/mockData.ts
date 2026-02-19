export interface Review {
  id: string;
  customerName: string;
  restaurantName: string;
  rating: number;
  text: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  date: string;
  category: string;
}

export interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  averageRating: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  averageRating: number;
  totalReviews: number;
  sentimentSummary: SentimentSummary;
}

export const mockReviews: Review[] = [
  { id: "1", customerName: "Alice M.", restaurantName: "The Golden Fork", rating: 5, text: "Absolutely stunning food and ambiance. The truffle pasta was divine!", sentiment: "positive", sentimentScore: 0.95, date: "2026-02-18", category: "Food Quality" },
  { id: "2", customerName: "Bob T.", restaurantName: "The Golden Fork", rating: 2, text: "Service was incredibly slow. Waited 45 minutes for appetizers.", sentiment: "negative", sentimentScore: 0.15, date: "2026-02-17", category: "Service" },
  { id: "3", customerName: "Carol S.", restaurantName: "The Golden Fork", rating: 4, text: "Great food but the noise level made conversation difficult.", sentiment: "neutral", sentimentScore: 0.6, date: "2026-02-16", category: "Ambiance" },
  { id: "4", customerName: "David L.", restaurantName: "Spice Route", rating: 5, text: "Best Indian food I've had outside of India. The butter chicken is phenomenal.", sentiment: "positive", sentimentScore: 0.92, date: "2026-02-15", category: "Food Quality" },
  { id: "5", customerName: "Emma W.", restaurantName: "Spice Route", rating: 1, text: "Found a hair in my soup. Management was dismissive about it.", sentiment: "negative", sentimentScore: 0.05, date: "2026-02-14", category: "Hygiene" },
  { id: "6", customerName: "Frank H.", restaurantName: "The Golden Fork", rating: 4, text: "Lovely date night spot. Wine selection is impressive.", sentiment: "positive", sentimentScore: 0.82, date: "2026-02-13", category: "Ambiance" },
  { id: "7", customerName: "Grace K.", restaurantName: "Ocean Breeze", rating: 5, text: "The freshest seafood in town. Lobster bisque was out of this world!", sentiment: "positive", sentimentScore: 0.97, date: "2026-02-12", category: "Food Quality" },
  { id: "8", customerName: "Henry P.", restaurantName: "Ocean Breeze", rating: 3, text: "Food was okay but overpriced for the portion size.", sentiment: "neutral", sentimentScore: 0.45, date: "2026-02-11", category: "Value" },
  { id: "9", customerName: "Irene D.", restaurantName: "Spice Route", rating: 4, text: "Warm and welcoming staff. The naan bread was perfectly crispy.", sentiment: "positive", sentimentScore: 0.85, date: "2026-02-10", category: "Service" },
  { id: "10", customerName: "Jack R.", restaurantName: "The Golden Fork", rating: 2, text: "Reservation was lost. Had to wait 30 minutes despite booking ahead.", sentiment: "negative", sentimentScore: 0.12, date: "2026-02-09", category: "Service" },
  { id: "11", customerName: "Karen B.", restaurantName: "Ocean Breeze", rating: 5, text: "The sunset view paired with amazing sushi. Unforgettable experience!", sentiment: "positive", sentimentScore: 0.94, date: "2026-02-08", category: "Ambiance" },
  { id: "12", customerName: "Leo M.", restaurantName: "Spice Route", rating: 3, text: "Decent food but nothing special. Expected more given the hype.", sentiment: "neutral", sentimentScore: 0.5, date: "2026-02-07", category: "Food Quality" },
];

export const mockRestaurants: Restaurant[] = [
  { id: "1", name: "The Golden Fork", cuisine: "Italian", averageRating: 3.8, totalReviews: 234, sentimentSummary: { positive: 140, negative: 47, neutral: 47, total: 234, averageRating: 3.8 } },
  { id: "2", name: "Spice Route", cuisine: "Indian", averageRating: 4.1, totalReviews: 189, sentimentSummary: { positive: 120, negative: 30, neutral: 39, total: 189, averageRating: 4.1 } },
  { id: "3", name: "Ocean Breeze", cuisine: "Seafood", averageRating: 4.3, totalReviews: 156, sentimentSummary: { positive: 110, negative: 15, neutral: 31, total: 156, averageRating: 4.3 } },
];

export const sentimentTrendData = [
  { month: "Sep", positive: 45, negative: 12, neutral: 8 },
  { month: "Oct", positive: 52, negative: 15, neutral: 10 },
  { month: "Nov", positive: 48, negative: 18, neutral: 12 },
  { month: "Dec", positive: 65, negative: 10, neutral: 8 },
  { month: "Jan", positive: 58, negative: 14, neutral: 11 },
  { month: "Feb", positive: 62, negative: 8, neutral: 9 },
];

export const categoryData = [
  { name: "Food Quality", positive: 78, negative: 12 },
  { name: "Service", positive: 45, negative: 35 },
  { name: "Ambiance", positive: 60, negative: 10 },
  { name: "Value", positive: 40, negative: 25 },
  { name: "Hygiene", positive: 55, negative: 8 },
];
