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
    averageRating: 4.3,
    totalReviews: 38,
    ownerUid: "demo_owner_1",
    sentimentSummary: { positive: 29, negative: 4, neutral: 5, total: 38, averageRating: 4.3 }
  },
  {
    id: "2",
    name: "Spice Route",
    cuisine: "Indian",
    averageRating: 4.4,
    totalReviews: 36,
    ownerUid: "demo_owner_2",
    sentimentSummary: { positive: 28, negative: 4, neutral: 4, total: 36, averageRating: 4.4 }
  },
  {
    id: "3",
    name: "Ocean Breeze",
    cuisine: "Seafood",
    averageRating: 4.5,
    totalReviews: 35,
    ownerUid: "demo_owner_3",
    sentimentSummary: { positive: 28, negative: 3, neutral: 4, total: 35, averageRating: 4.5 }
  },
  {
    id: "burger-shack-id",
    name: "Burger Shack",
    cuisine: "Fast Food",
    averageRating: 4.1,
    totalReviews: 36,
    ownerUid: "demo_owner_4",
    sentimentSummary: { positive: 26, negative: 4, neutral: 6, total: 36, averageRating: 4.1 }
  },
  {
    id: "sakura-sushi-id",
    name: "Sakura Sushi",
    cuisine: "Japanese",
    averageRating: 4.7,
    totalReviews: 35,
    ownerUid: "demo_owner_5",
    sentimentSummary: { positive: 30, negative: 2, neutral: 3, total: 35, averageRating: 4.7 }
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
  { id: "seed-16", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Rachel G.", rating: 5, text: "Great dining atmosphere, polite servers, and delicious dragon rolls.", sentiment: "positive", sentimentScore: 0.93, date: "2026-02-15", category: "Service" },

  // The Golden Fork additional mock reviews
  { id: "seed-17", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Marcus V.", rating: 1, text: "Ribeye steak was tough and lukewarm when served. Extremely disappointed given the premium price.", sentiment: "negative", sentimentScore: 0.1, date: "2026-02-14", category: "Food Quality" },
  { id: "seed-18", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Elena R.", rating: 5, text: "The homemade tiramisu and espresso were pure perfection. Highly recommend!", sentiment: "positive", sentimentScore: 0.95, date: "2026-02-12", category: "Food Quality" },
  { id: "seed-19", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Carlos D.", rating: 3, text: "Good pasta but took 50 minutes to get our entrees during Saturday peak dinner.", sentiment: "neutral", sentimentScore: 0.48, date: "2026-02-10", category: "Service" },
  { id: "seed-20", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Sophie T.", rating: 5, text: "Server Matteo was charming and gave great wine recommendations. Outstanding hospitality.", sentiment: "positive", sentimentScore: 0.96, date: "2026-02-08", category: "Service" },
  { id: "seed-21", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Brian K.", rating: 2, text: "Tables were sticky and water glasses had smudges. Needs better sanitation oversight.", sentiment: "negative", sentimentScore: 0.16, date: "2026-02-06", category: "Hygiene" },
  { id: "seed-22", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Hannah J.", rating: 4, text: "Cozy lighting and romantic jazz music in the background. Perfect anniversary dinner.", sentiment: "positive", sentimentScore: 0.86, date: "2026-02-03", category: "Ambiance" },

  // Spice Route additional mock reviews
  { id: "seed-23", restaurantId: "2", restaurantName: "Spice Route", customerName: "Vikram N.", rating: 5, text: "Mouthwatering lamb rogan josh and garlic naan fresh out of the tandoor.", sentiment: "positive", sentimentScore: 0.97, date: "2026-02-16", category: "Food Quality" },
  { id: "seed-24", restaurantId: "2", restaurantName: "Spice Route", customerName: "Chloe B.", rating: 2, text: "Order took over an hour and arrived lukewarm. Disorganized floor management.", sentiment: "negative", sentimentScore: 0.14, date: "2026-02-13", category: "Service" },
  { id: "seed-25", restaurantId: "2", restaurantName: "Spice Route", customerName: "Amir H.", rating: 4, text: "Flavorful biryani with tender chicken pieces. Good portion sizes for the price.", sentiment: "positive", sentimentScore: 0.88, date: "2026-02-11", category: "Value" },
  { id: "seed-26", restaurantId: "2", restaurantName: "Spice Route", customerName: "Jessica W.", rating: 1, text: "Server ignored my allergy warning and the dish had cashews. Huge food safety risk!", sentiment: "negative", sentimentScore: 0.08, date: "2026-02-09", category: "Hygiene" },
  { id: "seed-27", restaurantId: "2", restaurantName: "Spice Route", customerName: "Oliver C.", rating: 4, text: "Exotic interior decor and fragrant aromas as soon as you step through the door.", sentiment: "positive", sentimentScore: 0.84, date: "2026-02-04", category: "Ambiance" },

  // Ocean Breeze additional mock reviews
  { id: "seed-28", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Rebecca M.", rating: 1, text: "Lobster bisque was way too salty, couldn't even finish half of the bowl.", sentiment: "negative", sentimentScore: 0.12, date: "2026-02-15", category: "Food Quality" },
  { id: "seed-29", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Daniel G.", rating: 5, text: "Pan-seared Chilean sea bass with lemon herb butter was an absolute triumph.", sentiment: "positive", sentimentScore: 0.98, date: "2026-02-14", category: "Food Quality" },
  { id: "seed-30", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Zoe F.", rating: 2, text: "Charged $45 for corkage fee with zero explanation. Felt ripped off.", sentiment: "negative", sentimentScore: 0.19, date: "2026-02-10", category: "Value" },
  { id: "seed-31", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Kevin S.", rating: 5, text: "Attentive waitstaff, never had an empty water glass all evening.", sentiment: "positive", sentimentScore: 0.91, date: "2026-02-07", category: "Service" },
  { id: "seed-32", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Natalie P.", rating: 4, text: "Stunning patio overlooking the harbor. Seafood platter was generous and fresh.", sentiment: "positive", sentimentScore: 0.89, date: "2026-02-03", category: "Ambiance" },

  // Burger Shack additional mock reviews
  { id: "seed-33", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Dylan O.", rating: 5, text: "Double bacon cheeseburger with truffle mayo is life-changing. Great crispy fries.", sentiment: "positive", sentimentScore: 0.95, date: "2026-02-17", category: "Food Quality" },
  { id: "seed-34", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Tara K.", rating: 1, text: "Dirty tables in the dining area and overflowing trash cans. Needs cleaning.", sentiment: "negative", sentimentScore: 0.09, date: "2026-02-11", category: "Hygiene" },
  { id: "seed-35", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Leo B.", rating: 4, text: "Great combo deals for families. Quick drive-thru expediting.", sentiment: "positive", sentimentScore: 0.84, date: "2026-02-08", category: "Value" },
  { id: "seed-36", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Maya L.", rating: 3, text: "Burger was fine but onion rings were greasy and soft instead of crispy.", sentiment: "neutral", sentimentScore: 0.49, date: "2026-02-05", category: "Food Quality" },

  // Sakura Sushi additional mock reviews
  { id: "seed-37", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Kenji M.", rating: 5, text: "Omakase was incredible. Each piece of nigiri had perfect temperature and seasoning.", sentiment: "positive", sentimentScore: 0.99, date: "2026-02-17", category: "Food Quality" },
  { id: "seed-38", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Brooke T.", rating: 3, text: "Delicious rolls but cramped seating and loud pop music disrupted the sushi vibe.", sentiment: "neutral", sentimentScore: 0.52, date: "2026-02-13", category: "Ambiance" },
  { id: "seed-39", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Evan R.", rating: 5, text: "Generous lunch bento box with sashimi and miso soup. Fantastic value!", sentiment: "positive", sentimentScore: 0.92, date: "2026-02-09", category: "Value" },
  { id: "seed-40", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Lucas H.", rating: 2, text: "Waitress was dismissive when we inquired about gluten-free soy sauce.", sentiment: "negative", sentimentScore: 0.2, date: "2026-02-04", category: "Service" },

  // Vast pool: The Golden Fork (Italian)
  { id: "seed-41", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Gabriel C.", rating: 5, text: "The carbonara with crispy guanciale was authentic and velvety. Felt like dining in Rome.", sentiment: "positive", sentimentScore: 0.96, date: "2026-01-29", category: "Food Quality" },
  { id: "seed-42", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Natasha P.", rating: 4, text: "Pleasant atmosphere and the burrata salad was extremely fresh.", sentiment: "positive", sentimentScore: 0.87, date: "2026-01-25", category: "Ambiance" },
  { id: "seed-43", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Derrick B.", rating: 2, text: "Waitstaff seemed overwhelmed and forgot our sparkling water twice.", sentiment: "negative", sentimentScore: 0.17, date: "2026-01-20", category: "Service" },
  { id: "seed-44", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Fiona S.", rating: 5, text: "Exceptional veal osso buco! Melt-in-your-mouth tenderness and rich sauce.", sentiment: "positive", sentimentScore: 0.98, date: "2026-01-14", category: "Food Quality" },
  { id: "seed-45", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Trevor K.", rating: 3, text: "Good flavors but portions are conservative for the steep bill.", sentiment: "neutral", sentimentScore: 0.46, date: "2026-01-08", category: "Value" },
  { id: "seed-46", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Gemma D.", rating: 5, text: "Impeccable table service and the sommelier was knowledgeable and unassuming.", sentiment: "positive", sentimentScore: 0.94, date: "2025-12-28", category: "Service" },
  { id: "seed-47", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Sean L.", rating: 4, text: "Festive holiday ambiance with tasteful festive lighting and soft jazz.", sentiment: "positive", sentimentScore: 0.89, date: "2025-12-22", category: "Ambiance" },
  { id: "seed-48", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Melissa V.", rating: 1, text: "Lasagna was cold in the center like it had just come out of a microwave.", sentiment: "negative", sentimentScore: 0.07, date: "2025-12-15", category: "Food Quality" },
  { id: "seed-49", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Arthur W.", rating: 5, text: "Handmade tagliatelle with wild mushroom sauce was heavenly.", sentiment: "positive", sentimentScore: 0.95, date: "2025-11-20", category: "Food Quality" },
  { id: "seed-50", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Kendra M.", rating: 4, text: "Consistently good Italian. A reliable spot for family Sunday dinners.", sentiment: "positive", sentimentScore: 0.83, date: "2025-10-18", category: "General" },

  // Vast pool: Spice Route (Indian)
  { id: "seed-51", restaurantId: "2", restaurantName: "Spice Route", customerName: "Devon R.", rating: 5, text: "The paneer makhani and garlic naan are unmatched in this city.", sentiment: "positive", sentimentScore: 0.94, date: "2026-01-30", category: "Food Quality" },
  { id: "seed-52", restaurantId: "2", restaurantName: "Spice Route", customerName: "Sunil G.", rating: 5, text: "Authentic Lucknowi mutton dum biryani with saffron notes. 10/10!", sentiment: "positive", sentimentScore: 0.99, date: "2026-01-26", category: "Food Quality" },
  { id: "seed-53", restaurantId: "2", restaurantName: "Spice Route", customerName: "Megan O.", rating: 2, text: "Long queue outside even with a reservation, and lobby was freezing cold.", sentiment: "negative", sentimentScore: 0.16, date: "2026-01-21", category: "Service" },
  { id: "seed-54", restaurantId: "2", restaurantName: "Spice Route", customerName: "Harish B.", rating: 4, text: "Rich gravies and polite staff. Gulab jamun dessert was piping hot.", sentiment: "positive", sentimentScore: 0.88, date: "2026-01-15", category: "Food Quality" },
  { id: "seed-55", restaurantId: "2", restaurantName: "Spice Route", customerName: "Kelly Y.", rating: 3, text: "Chicken tikka was slightly charred, but mint chutney was refreshing.", sentiment: "neutral", sentimentScore: 0.51, date: "2026-01-09", category: "Food Quality" },
  { id: "seed-56", restaurantId: "2", restaurantName: "Spice Route", customerName: "Arjun V.", rating: 5, text: "Flawless hospitality. Chef accommodated my grandmother's mild spice request with grace.", sentiment: "positive", sentimentScore: 0.96, date: "2025-12-29", category: "Service" },
  { id: "seed-57", restaurantId: "2", restaurantName: "Spice Route", customerName: "Leah S.", rating: 4, text: "Spacious seating, beautiful brass tableware, and royal decor.", sentiment: "positive", sentimentScore: 0.85, date: "2025-12-18", category: "Ambiance" },
  { id: "seed-58", restaurantId: "2", restaurantName: "Spice Route", customerName: "Raj K.", rating: 1, text: "Dirty silverware on table and found lint in the drinking water.", sentiment: "negative", sentimentScore: 0.06, date: "2025-11-28", category: "Hygiene" },
  { id: "seed-59", restaurantId: "2", restaurantName: "Spice Route", customerName: "Belinda M.", rating: 5, text: "Unbelievable value on the weekend buffet spread with 20+ dishes.", sentiment: "positive", sentimentScore: 0.93, date: "2025-11-12", category: "Value" },
  { id: "seed-60", restaurantId: "2", restaurantName: "Spice Route", customerName: "Nikhil T.", rating: 4, text: "Dal makhani was simmered to perfection with rich buttery layers.", sentiment: "positive", sentimentScore: 0.91, date: "2025-10-15", category: "Food Quality" },

  // Vast pool: Ocean Breeze (Seafood)
  { id: "seed-61", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Courtney B.", rating: 5, text: "King crab legs were steamed to perfection with clarified drawn butter.", sentiment: "positive", sentimentScore: 0.97, date: "2026-01-28", category: "Food Quality" },
  { id: "seed-62", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Tyler W.", rating: 4, text: "Fresh Kumamoto oysters on the half shell were briny and cold. Stellar.", sentiment: "positive", sentimentScore: 0.91, date: "2026-01-23", category: "Food Quality" },
  { id: "seed-63", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Vanessa E.", rating: 2, text: "Fish and chips had oily batter and fries were limp. Expected better.", sentiment: "negative", sentimentScore: 0.18, date: "2026-01-18", category: "Food Quality" },
  { id: "seed-64", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Harrison D.", rating: 5, text: "Panoramic view of the bay during golden hour. Breathtaking sunset dinner.", sentiment: "positive", sentimentScore: 0.98, date: "2026-01-11", category: "Ambiance" },
  { id: "seed-65", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Paige K.", rating: 3, text: "Food is fresh but cocktails are $22 each which feels excessive.", sentiment: "neutral", sentimentScore: 0.44, date: "2026-01-05", category: "Value" },
  { id: "seed-66", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Dennis N.", rating: 5, text: "Clam chowder in sourdough bread bowl was piping hot and packed with clams.", sentiment: "positive", sentimentScore: 0.94, date: "2025-12-27", category: "Food Quality" },
  { id: "seed-67", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Alana H.", rating: 4, text: "Prompt seating and polite server made our corporate dinner seamless.", sentiment: "positive", sentimentScore: 0.88, date: "2025-12-14", category: "Service" },
  { id: "seed-68", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Gregory R.", rating: 1, text: "Mussels were fishy and smelled bad. Left without eating mains.", sentiment: "negative", sentimentScore: 0.05, date: "2025-11-25", category: "Hygiene" },
  { id: "seed-69", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Tiffany C.", rating: 5, text: "Seared sea scallops over butternut squash puree were sublime.", sentiment: "positive", sentimentScore: 0.95, date: "2025-11-09", category: "Food Quality" },
  { id: "seed-70", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Joel P.", rating: 4, text: "Wonderful outdoor heaters on the deck allowing comfortable outdoor dining.", sentiment: "positive", sentimentScore: 0.86, date: "2025-10-22", category: "Ambiance" },

  // Vast pool: Burger Shack (Fast Food)
  { id: "seed-71", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Brandon J.", rating: 5, text: "Crispy chicken sandwich with house spicy slaw hits the spot every single time.", sentiment: "positive", sentimentScore: 0.93, date: "2026-01-31", category: "Food Quality" },
  { id: "seed-72", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Chloe H.", rating: 5, text: "Smash patties with crispy lacy edges and secret sauce are addictive.", sentiment: "positive", sentimentScore: 0.96, date: "2026-01-27", category: "Food Quality" },
  { id: "seed-73", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Austin G.", rating: 2, text: "Drive-thru line was 15 cars deep and took 35 minutes on a Tuesday night.", sentiment: "negative", sentimentScore: 0.15, date: "2026-01-19", category: "Service" },
  { id: "seed-74", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Morgan K.", rating: 4, text: "Thick malt chocolate shake and seasoned crinkle cut fries were great.", sentiment: "positive", sentimentScore: 0.89, date: "2026-01-12", category: "Food Quality" },
  { id: "seed-75", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Trevor P.", rating: 4, text: "Can feed the whole crew for under $40. Best value fast casual around.", sentiment: "positive", sentimentScore: 0.91, date: "2026-01-06", category: "Value" },
  { id: "seed-76", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Abby R.", rating: 1, text: "Found a piece of plastic wrap melted inside the cheese patty. Gross!", sentiment: "negative", sentimentScore: 0.04, date: "2025-12-30", category: "Hygiene" },
  { id: "seed-77", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Kyle B.", rating: 5, text: "Super friendly cashier and order was ready at the counter in under 4 minutes.", sentiment: "positive", sentimentScore: 0.92, date: "2025-12-16", category: "Service" },
  { id: "seed-78", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Samantha M.", rating: 3, text: "Burger was warm but salty. Vanilla shake had good consistency.", sentiment: "neutral", sentimentScore: 0.50, date: "2025-11-22", category: "Food Quality" },
  { id: "seed-79", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Justin L.", rating: 4, text: "Neon retro diner aesthetic with arcade machines in the corner. Fun vibe.", sentiment: "positive", sentimentScore: 0.85, date: "2025-11-05", category: "Ambiance" },
  { id: "seed-80", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Diana F.", rating: 4, text: "Loaded bacon cheese tots were decadent and super crispy.", sentiment: "positive", sentimentScore: 0.88, date: "2025-10-14", category: "Food Quality" },

  // Vast pool: Sakura Sushi (Japanese)
  { id: "seed-81", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Hiroshi S.", rating: 5, text: "Otoro and uni melted in the mouth. High-grade fish flown directly from Toyosu.", sentiment: "positive", sentimentScore: 0.99, date: "2026-01-30", category: "Food Quality" },
  { id: "seed-82", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Claire D.", rating: 5, text: "Spicy crunchy tuna roll and yellowtail jalapeño sashimi were perfection.", sentiment: "positive", sentimentScore: 0.95, date: "2026-01-24", category: "Food Quality" },
  { id: "seed-83", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Patrick N.", rating: 2, text: "Sushi chef was rushing through the omakase courses, felt very hurried.", sentiment: "negative", sentimentScore: 0.22, date: "2026-01-16", category: "Service" },
  { id: "seed-84", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Naomi K.", rating: 5, text: "Spotless sushi bar, chefs wash hands constantly, and knife work is mesmerizing.", sentiment: "positive", sentimentScore: 0.97, date: "2026-01-10", category: "Hygiene" },
  { id: "seed-85", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Garrett V.", rating: 4, text: "Warm green tea refill every few minutes. Subtle minimalist bamboo aesthetic.", sentiment: "positive", sentimentScore: 0.90, date: "2026-01-04", category: "Ambiance" },
  { id: "seed-86", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Victoria W.", rating: 3, text: "Good sushi but $140 for two without drinks feels on the high side.", sentiment: "neutral", sentimentScore: 0.47, date: "2025-12-28", category: "Value" },
  { id: "seed-87", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Wesley F.", rating: 5, text: "Warm unagi roll with sweet eel glaze was out of this world.", sentiment: "positive", sentimentScore: 0.96, date: "2025-12-19", category: "Food Quality" },
  { id: "seed-88", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Audrey T.", rating: 4, text: "Crispy shrimp tempura with light dipping sauce. Fresh and greaseless.", sentiment: "positive", sentimentScore: 0.91, date: "2025-11-29", category: "Food Quality" },
  { id: "seed-89", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Ian C.", rating: 5, text: "Matcha green tea ice cream to end the dinner was divine.", sentiment: "positive", sentimentScore: 0.93, date: "2025-11-15", category: "Food Quality" },
  { id: "seed-90", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Lillian G.", rating: 4, text: "Wonderful service and complimentary edamame while we waited for our rolls.", sentiment: "positive", sentimentScore: 0.89, date: "2025-10-25", category: "Service" },

  // ─── Extensive Pool: The Golden Fork ──────────────────────────────────────────
  { id: "seed-91", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Marco B.", rating: 5, text: "The wild mushroom risotto was creamy, aromatic, and cooked to an absolute al dente perfection.", sentiment: "positive", sentimentScore: 0.98, date: "2026-02-17", category: "Food Quality", ownerReply: "Grazie mille Marco! Our chef uses fresh imported porcini for that exact depth of flavor.", ownerReplyDate: "2026-02-18" },
  { id: "seed-92", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Stephanie N.", rating: 4, text: "Crispy calamari fritti with spicy marinara sauce was a delightful appetizer. Cocktails were strong.", sentiment: "positive", sentimentScore: 0.88, date: "2026-02-11", category: "Food Quality" },
  { id: "seed-93", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Anthony P.", rating: 2, text: "Our ribeye steak was ordered medium-rare but arrived heavily charred and well-done. Kitchen offered no discount.", sentiment: "negative", sentimentScore: 0.14, date: "2026-02-05", category: "Food Quality", ownerReply: "Anthony, we sincerely apologize for failing our internal grilling standards. Please allow us to make this right on your next visit.", ownerReplyDate: "2026-02-06" },
  { id: "seed-94", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Danielle C.", rating: 5, text: "Best cannoli in the city! Ricotta filling was light and sweet with dark chocolate chips.", sentiment: "positive", sentimentScore: 0.96, date: "2026-01-28", category: "Food Quality" },
  { id: "seed-95", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Victor S.", rating: 3, text: "Great ambiance and live acoustic guitarist, but tables are packed too tightly together.", sentiment: "neutral", sentimentScore: 0.52, date: "2026-01-22", category: "Ambiance" },
  { id: "seed-96", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Valerie H.", rating: 5, text: "The sommelier helped us select a fantastic Chianti Classico that paired brilliantly with the truffle pasta.", sentiment: "positive", sentimentScore: 0.97, date: "2026-01-15", category: "Service" },
  { id: "seed-97", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Kenneth D.", rating: 4, text: "Generous portions of eggplant parmigiana and warm rosemary focaccia bread.", sentiment: "positive", sentimentScore: 0.86, date: "2026-01-07", category: "Food Quality" },
  { id: "seed-98", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Paula E.", rating: 1, text: "Restroom was out of hand soap and toilet paper during Friday prime time. Basic hygiene was neglected.", sentiment: "negative", sentimentScore: 0.05, date: "2025-12-26", category: "Hygiene", ownerReply: "Paula, thank you for bringing this to our attention. We have reinforced hourly restroom audits for our facilities team.", ownerReplyDate: "2025-12-27" },
  { id: "seed-99", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Raymond K.", rating: 5, text: "Brought 8 guests for an executive lunch. The private dining room service was discreet and flawless.", sentiment: "positive", sentimentScore: 0.95, date: "2025-12-18", category: "Service" },
  { id: "seed-100", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Gloria W.", rating: 4, text: "Decadent chocolate hazelnut torta and espresso. Elegant presentation.", sentiment: "positive", sentimentScore: 0.91, date: "2025-12-10", category: "Food Quality" },
  { id: "seed-101", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Lucas B.", rating: 3, text: "Pasta sauce was delicious, but $36 for a small pasta dish tests the value boundary.", sentiment: "neutral", sentimentScore: 0.47, date: "2025-11-28", category: "Value" },
  { id: "seed-102", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Christine F.", rating: 5, text: "Third time here this year. The consistency of flavor and hospitality keeps us coming back.", sentiment: "positive", sentimentScore: 0.99, date: "2025-11-19", category: "General" },
  { id: "seed-103", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Simon L.", rating: 4, text: "Excellent burrata caprese salad with sweet balsamic reduction.", sentiment: "positive", sentimentScore: 0.89, date: "2025-11-08", category: "Food Quality" },
  { id: "seed-104", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Teresa J.", rating: 2, text: "Waited 25 minutes after finishing our meal just to flag down the server for the check.", sentiment: "negative", sentimentScore: 0.18, date: "2025-10-30", category: "Service" },
  { id: "seed-105", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Arthur G.", rating: 5, text: "The slow-braised beef ragu pappardelle melted on the tongue. Pure culinary artistry.", sentiment: "positive", sentimentScore: 0.98, date: "2025-10-21", category: "Food Quality" },
  { id: "seed-106", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Monica R.", rating: 4, text: "Valet parking was quick and courtyard seating with heat lamps felt very European.", sentiment: "positive", sentimentScore: 0.87, date: "2025-10-12", category: "Ambiance" },
  { id: "seed-107", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Dean M.", rating: 5, text: "Flawless wine pairing dinner. Chef came out to explain the heritage olive oil.", sentiment: "positive", sentimentScore: 0.94, date: "2025-09-27", category: "Service" },
  { id: "seed-108", restaurantId: "1", restaurantName: "The Golden Fork", customerName: "Elaine T.", rating: 4, text: "Authentic panna cotta with fresh blackberry compote. Lovely ending to the meal.", sentiment: "positive", sentimentScore: 0.90, date: "2025-09-14", category: "Food Quality" },

  // ─── Extensive Pool: Spice Route ──────────────────────────────────────────────
  { id: "seed-109", restaurantId: "2", restaurantName: "Spice Route", customerName: "Rohan P.", rating: 5, text: "The garlic naan was blistered to perfection with rich butter glaze. Goes amazingly with their lamb curry.", sentiment: "positive", sentimentScore: 0.98, date: "2026-02-18", category: "Food Quality", ownerReply: "Thank you Rohan! Our tandoor master prepares each naan fresh on order.", ownerReplyDate: "2026-02-18" },
  { id: "seed-110", restaurantId: "2", restaurantName: "Spice Route", customerName: "Samantha K.", rating: 4, text: "Crispy samosas packed with spiced potatoes and peas, served with tangy tamarind dip.", sentiment: "positive", sentimentScore: 0.90, date: "2026-02-12", category: "Food Quality" },
  { id: "seed-111", restaurantId: "2", restaurantName: "Spice Route", customerName: "Deepak S.", rating: 5, text: "Phenomenal tandoori mixed grill platter! The chicken tikka and seekh kebabs were juicy and smoky.", sentiment: "positive", sentimentScore: 0.97, date: "2026-02-04", category: "Food Quality" },
  { id: "seed-112", restaurantId: "2", restaurantName: "Spice Route", customerName: "Kaitlyn M.", rating: 2, text: "Requested mild spice for my child's chicken korma, but it arrived fiery hot. Server argued it was mild.", sentiment: "negative", sentimentScore: 0.16, date: "2026-01-27", category: "Service", ownerReply: "Kaitlyn, we deeply apologize for the miscommunication on heat levels. We have retrained our kitchen on non-spicy preparation.", ownerReplyDate: "2026-01-28" },
  { id: "seed-113", restaurantId: "2", restaurantName: "Spice Route", customerName: "Ananya J.", rating: 5, text: "Best mango lassi in town! Thick, creamy, and made with real Alphonso mango pulp.", sentiment: "positive", sentimentScore: 0.95, date: "2026-01-19", category: "Food Quality" },
  { id: "seed-114", restaurantId: "2", restaurantName: "Spice Route", customerName: "George F.", rating: 4, text: "Generous lunch thali with 5 different curries, rice, and dessert for only $18. Great value.", sentiment: "positive", sentimentScore: 0.92, date: "2026-01-12", category: "Value" },
  { id: "seed-115", restaurantId: "2", restaurantName: "Spice Route", customerName: "Farhan A.", rating: 5, text: "The dal tadka with jeera rice tasted exactly like homestyle Punjabi cooking.", sentiment: "positive", sentimentScore: 0.96, date: "2026-01-03", category: "Food Quality" },
  { id: "seed-116", restaurantId: "2", restaurantName: "Spice Route", customerName: "Lindsay B.", rating: 3, text: "Rich aromas and flavors, but the dining room music was a bit loud for our business meeting.", sentiment: "neutral", sentimentScore: 0.50, date: "2025-12-27", category: "Ambiance" },
  { id: "seed-117", restaurantId: "2", restaurantName: "Spice Route", customerName: "Manish D.", rating: 5, text: "Their rogan josh has layers of cardamom and Kashmiri chili. Absolutely stellar depth.", sentiment: "positive", sentimentScore: 0.97, date: "2025-12-20", category: "Food Quality" },
  { id: "seed-118", restaurantId: "2", restaurantName: "Spice Route", customerName: "Clara U.", rating: 4, text: "Attentive tea service with cardamom spiced masala chai refilled warmly.", sentiment: "positive", sentimentScore: 0.88, date: "2025-12-11", category: "Service" },
  { id: "seed-119", restaurantId: "2", restaurantName: "Spice Route", customerName: "Neil T.", rating: 1, text: "Spotted food debris under the booth cushions. Cleaning between seating needs serious improvement.", sentiment: "negative", sentimentScore: 0.08, date: "2025-11-26", category: "Hygiene", ownerReply: "Neil, we take cleanliness with utmost seriousness. Deep cleaning of all booths was executed immediately.", ownerReplyDate: "2025-11-27" },
  { id: "seed-120", restaurantId: "2", restaurantName: "Spice Route", customerName: "Tara S.", rating: 5, text: "The rasmalai dessert was delicate, soaked in saffron pistachio milk. Divine ending.", sentiment: "positive", sentimentScore: 0.94, date: "2025-11-17", category: "Food Quality" },
  { id: "seed-121", restaurantId: "2", restaurantName: "Spice Route", customerName: "Colin W.", rating: 4, text: "Palak paneer was silky and vibrant green, paneer cubes were soft and fresh.", sentiment: "positive", sentimentScore: 0.91, date: "2025-11-06", category: "Food Quality" },
  { id: "seed-122", restaurantId: "2", restaurantName: "Spice Route", customerName: "Meera C.", rating: 5, text: "Hosted our Diwali family dinner here. Staff handled 16 people with calm efficiency.", sentiment: "positive", sentimentScore: 0.98, date: "2025-10-28", category: "Service" },
  { id: "seed-123", restaurantId: "2", restaurantName: "Spice Route", customerName: "Sean V.", rating: 3, text: "Food is tasty but drink prices are elevated compared to other Indian bistros.", sentiment: "neutral", sentimentScore: 0.48, date: "2025-10-18", category: "Value" },
  { id: "seed-124", restaurantId: "2", restaurantName: "Spice Route", customerName: "Ayesha N.", rating: 5, text: "Dum chicken biryani served in an earthen clay pot sealing the aroma. Unbelievable taste!", sentiment: "positive", sentimentScore: 0.99, date: "2025-10-09", category: "Food Quality" },
  { id: "seed-125", restaurantId: "2", restaurantName: "Spice Route", customerName: "Bradley H.", rating: 4, text: "Warm hospitality and complimentary papadums with 3 homemade chutneys.", sentiment: "positive", sentimentScore: 0.89, date: "2025-09-25", category: "General" },
  { id: "seed-126", restaurantId: "2", restaurantName: "Spice Route", customerName: "Pooja G.", rating: 5, text: "Tandoori prawns were giant and succulent with charred lemon slices. 10/10.", sentiment: "positive", sentimentScore: 0.96, date: "2025-09-12", category: "Food Quality" },

  // ─── Extensive Pool: Ocean Breeze ─────────────────────────────────────────────
  { id: "seed-127", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Elliott J.", rating: 5, text: "The Maine lobster roll served on warm toasted brioche with brown butter mayo is unbeatable.", sentiment: "positive", sentimentScore: 0.97, date: "2026-02-16", category: "Food Quality", ownerReply: "Elliott, glad you loved the lobster roll! We source our brioche daily from an artisan bakery.", ownerReplyDate: "2026-02-17" },
  { id: "seed-128", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Gretchen S.", rating: 5, text: "Crispy skin Atlantic salmon over saffron cauliflower risotto was exquisite.", sentiment: "positive", sentimentScore: 0.95, date: "2026-02-09", category: "Food Quality" },
  { id: "seed-129", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Darren O.", rating: 2, text: "Oysters were served at room temperature rather than on fresh crushed ice. Food safety concern.", sentiment: "negative", sentimentScore: 0.13, date: "2026-02-02", category: "Hygiene", ownerReply: "Darren, thank you for alerting us. We immediately replaced the ice bed service equipment.", ownerReplyDate: "2026-02-03" },
  { id: "seed-130", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Kendra L.", rating: 4, text: "Seafood paella for two was brimming with mussels, calamari, and tiger prawns. Great saffron socarrat.", sentiment: "positive", sentimentScore: 0.92, date: "2026-01-26", category: "Food Quality" },
  { id: "seed-131", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Stuart B.", rating: 4, text: "Spectacular harbor view table for our anniversary. Waiter brought complimentary prosecco.", sentiment: "positive", sentimentScore: 0.93, date: "2026-01-18", category: "Ambiance" },
  { id: "seed-132", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Miriam E.", rating: 3, text: "Clam chowder was delicious, but fish tacos were slightly bland and needed more lime.", sentiment: "neutral", sentimentScore: 0.49, date: "2026-01-10", category: "Food Quality" },
  { id: "seed-133", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Brett F.", rating: 5, text: "Pan-seared jumbo scallops with truffle pea puree was the highlight of our culinary week.", sentiment: "positive", sentimentScore: 0.98, date: "2026-01-02", category: "Food Quality" },
  { id: "seed-134", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Heather M.", rating: 4, text: "Staff was remarkably knowledgeable about fish seasonality and mercury profiles.", sentiment: "positive", sentimentScore: 0.88, date: "2025-12-23", category: "Service" },
  { id: "seed-135", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Zachary T.", rating: 2, text: "Charged $18 for a slice of cheesecake that looked like it had been sitting in a display case for days.", sentiment: "negative", sentimentScore: 0.17, date: "2025-12-15", category: "Value" },
  { id: "seed-136", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Danielle Y.", rating: 5, text: "Fresh Dungeness crab cakes with zero breading filler. Real pure lump crab goodness.", sentiment: "positive", sentimentScore: 0.97, date: "2025-12-07", category: "Food Quality" },
  { id: "seed-137", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Paulina R.", rating: 4, text: "Outdoor patio heaters made December ocean-side dining surprisingly cozy and romantic.", sentiment: "positive", sentimentScore: 0.89, date: "2025-11-27", category: "Ambiance" },
  { id: "seed-138", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Curtis D.", rating: 5, text: "Grilled sea bass with lemon caper emulsion. Melted like butter.", sentiment: "positive", sentimentScore: 0.96, date: "2025-11-18", category: "Food Quality" },
  { id: "seed-139", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Nora K.", rating: 4, text: "Prompt water refills and our server offered great advice on wine by the glass.", sentiment: "positive", sentimentScore: 0.87, date: "2025-11-04", category: "Service" },
  { id: "seed-140", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Felix G.", rating: 1, text: "Hostess lost our OpenTable reservation and made us wait 45 minutes at the cold entrance.", sentiment: "negative", sentimentScore: 0.11, date: "2025-10-26", category: "Service" },
  { id: "seed-141", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Brooke A.", rating: 5, text: "Calamari was tender, crisp, and served with a zesty roasted red pepper remoulade.", sentiment: "positive", sentimentScore: 0.94, date: "2025-10-15", category: "Food Quality" },
  { id: "seed-142", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Jason C.", rating: 4, text: "Freshly shucked Kumamoto oysters with champagne mignonette were world-class.", sentiment: "positive", sentimentScore: 0.92, date: "2025-10-06", category: "Food Quality" },
  { id: "seed-143", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Chloe P.", rating: 5, text: "Warm molten chocolate lava cake paired with salted caramel gelato. Sublime!", sentiment: "positive", sentimentScore: 0.95, date: "2025-09-24", category: "Food Quality" },
  { id: "seed-144", restaurantId: "3", restaurantName: "Ocean Breeze", customerName: "Wade S.", rating: 4, text: "Solid seafood destination. Clean restrooms, ocean views, and reliable quality.", sentiment: "positive", sentimentScore: 0.89, date: "2025-09-10", category: "General" },

  // ─── Extensive Pool: Burger Shack ─────────────────────────────────────────────
  { id: "seed-145", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Tanner W.", rating: 5, text: "The Oklahoma onion smash burger with crispy lace edges is the best burger in the metro area.", sentiment: "positive", sentimentScore: 0.99, date: "2026-02-17", category: "Food Quality", ownerReply: "Tanner, that's what we live for! Fresh 80/20 chuck smashed on a 450-degree flat top!", ownerReplyDate: "2026-02-18" },
  { id: "seed-146", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Kayla R.", rating: 4, text: "Truffle parmesan crinkle-cut fries are addictive. Big portion easily shared between two.", sentiment: "positive", sentimentScore: 0.91, date: "2026-02-10", category: "Food Quality" },
  { id: "seed-147", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Derrick J.", rating: 1, text: "Ordered delivery via DoorDash. Both burgers were stone cold and cheese wasn't even melted.", sentiment: "negative", sentimentScore: 0.09, date: "2026-02-03", category: "Food Quality", ownerReply: "Derrick, we're sorry for the poor delivery courier transit. Please reach out so we can comp your meal.", ownerReplyDate: "2026-02-04" },
  { id: "seed-148", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Shelby M.", rating: 5, text: "Salted caramel pretzel shake was heavenly. Perfect consistency without being too icy.", sentiment: "positive", sentimentScore: 0.96, date: "2026-01-25", category: "Food Quality" },
  { id: "seed-149", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Mitchell S.", rating: 4, text: "Spicy jalapeno bacon burger had serious kick! Bacon was thick cut and smoky.", sentiment: "positive", sentimentScore: 0.92, date: "2026-01-17", category: "Food Quality" },
  { id: "seed-150", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Janice K.", rating: 3, text: "Great burger but the music volume inside was deafening. Hard to talk to my kids.", sentiment: "neutral", sentimentScore: 0.47, date: "2026-01-09", category: "Ambiance" },
  { id: "seed-151", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Craig L.", rating: 5, text: "Super speedy drive-thru service. In and out with hot food in under 3 minutes.", sentiment: "positive", sentimentScore: 0.95, date: "2026-01-01", category: "Service" },
  { id: "seed-152", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Bethany H.", rating: 4, text: "Vegan beyond burger option is actually seasoned well and juicy, not cardboard-like.", sentiment: "positive", sentimentScore: 0.88, date: "2025-12-24", category: "Food Quality" },
  { id: "seed-153", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Shane P.", rating: 2, text: "Floor near the drink station was soaked with soda and ice. Slipping hazard.", sentiment: "negative", sentimentScore: 0.15, date: "2025-12-16", category: "Hygiene" },
  { id: "seed-154", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Renee C.", rating: 5, text: "Crispy buttermilk chicken tender basket with homemade honey mustard dip was outstanding.", sentiment: "positive", sentimentScore: 0.97, date: "2025-12-08", category: "Food Quality" },
  { id: "seed-155", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Garrett E.", rating: 4, text: "$12 combo deal with burger, fries, and beverage is the best lunch bargain around.", sentiment: "positive", sentimentScore: 0.94, date: "2025-11-25", category: "Value" },
  { id: "seed-156", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Lori F.", rating: 3, text: "Burger was fine, fries were a bit over-salted on this occasion.", sentiment: "neutral", sentimentScore: 0.49, date: "2025-11-15", category: "Food Quality" },
  { id: "seed-157", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Dominic N.", rating: 5, text: "Loaded tater tots with melted cheddar, bacon crumbles, and scallions were incredible.", sentiment: "positive", sentimentScore: 0.96, date: "2025-11-03", category: "Food Quality" },
  { id: "seed-158", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Kelly D.", rating: 4, text: "Staff was polite, energetic, and brought condiments to our booth quickly.", sentiment: "positive", sentimentScore: 0.89, date: "2025-10-24", category: "Service" },
  { id: "seed-159", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Spencer T.", rating: 2, text: "Drive-thru operator forgot our milkshakes and we had to loop around again.", sentiment: "negative", sentimentScore: 0.17, date: "2025-10-13", category: "Service" },
  { id: "seed-160", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Jenna V.", rating: 5, text: "Retro 80s arcade machine in the lobby is fun while waiting for your order!", sentiment: "positive", sentimentScore: 0.92, date: "2025-10-04", category: "Ambiance" },
  { id: "seed-161", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Grant B.", rating: 4, text: "BBQ pulled pork smash combo was rich, smoky, and satisfying.", sentiment: "positive", sentimentScore: 0.90, date: "2025-09-22", category: "Food Quality" },
  { id: "seed-162", restaurantId: "burger-shack-id", restaurantName: "Burger Shack", customerName: "Carmen L.", rating: 5, text: "Classic strawberry milkshake with whipped cream and a cherry. Pure nostalgia.", sentiment: "positive", sentimentScore: 0.95, date: "2025-09-08", category: "Food Quality" },

  // ─── Extensive Pool: Sakura Sushi ─────────────────────────────────────────────
  { id: "seed-163", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Akira K.", rating: 5, text: "The bluefin otoro sashimi was sublime. Melted away like pure silk. Best Japanese dining in the city.", sentiment: "positive", sentimentScore: 0.99, date: "2026-02-18", category: "Food Quality", ownerReply: "Domo arigato Akira! We take great pride in our daily Tsukiji and Toyosu direct seafood shipments.", ownerReplyDate: "2026-02-18" },
  { id: "seed-164", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Sabrina T.", rating: 5, text: "Wagyu beef nigiri lightly torched with truffle oil was an explosion of umami.", sentiment: "positive", sentimentScore: 0.98, date: "2026-02-11", category: "Food Quality" },
  { id: "seed-165", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Marcus H.", rating: 4, text: "Yellowtail jalapeño sashimi with yuzu ponzu had the perfect tartness and heat.", sentiment: "positive", sentimentScore: 0.92, date: "2026-02-06", category: "Food Quality" },
  { id: "seed-166", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Evelyn P.", rating: 2, text: "Waiter brought the wrong sushi rolls twice and seemed indifferent when we pointed it out.", sentiment: "negative", sentimentScore: 0.16, date: "2026-01-29", category: "Service", ownerReply: "Evelyn, we apologize for the service mishaps. We have reviewed our table ordering confirmation flow.", ownerReplyDate: "2026-01-30" },
  { id: "seed-167", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Jonah W.", rating: 5, text: "The dragon roll with crispy eel, cucumber, and creamy avocado layer was magnificent.", sentiment: "positive", sentimentScore: 0.96, date: "2026-01-21", category: "Food Quality" },
  { id: "seed-168", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Miriam G.", rating: 4, text: "Subtle zen decor with cedar wood partitions and relaxing water fountain ambiance.", sentiment: "positive", sentimentScore: 0.91, date: "2026-01-14", category: "Ambiance" },
  { id: "seed-169", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Curtis R.", rating: 5, text: "Miso glazed black cod with baby bok choy was silky and caramelized to perfection.", sentiment: "positive", sentimentScore: 0.98, date: "2026-01-05", category: "Food Quality" },
  { id: "seed-170", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Faye S.", rating: 3, text: "Quality sushi, but charging $6 for extra pickled ginger and wasabi is a bit stingy.", sentiment: "neutral", sentimentScore: 0.46, date: "2025-12-29", category: "Value" },
  { id: "seed-171", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Malcolm D.", rating: 5, text: "Sitting at the sushi bar watching the itamae chefs carve fresh hamachi is pure theater.", sentiment: "positive", sentimentScore: 0.97, date: "2025-12-21", category: "Service" },
  { id: "seed-172", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Nadine B.", rating: 4, text: "Shrimp and asparagus tempura was crisp, golden, and greaseless.", sentiment: "positive", sentimentScore: 0.89, date: "2025-12-12", category: "Food Quality" },
  { id: "seed-173", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Russell C.", rating: 1, text: "Found a piece of brittle plastic wrapper in the spicy tuna roll. Major kitchen oversight.", sentiment: "negative", sentimentScore: 0.05, date: "2025-11-27", category: "Hygiene", ownerReply: "Russell, we take food safety with zero compromise. We immediately audited our sushi prep station.", ownerReplyDate: "2025-11-28" },
  { id: "seed-174", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Hayley M.", rating: 5, text: "The chirashi bowl is loaded with salmon, tuna, scallop, ikura, and tamago. Incredible value.", sentiment: "positive", sentimentScore: 0.96, date: "2025-11-16", category: "Value" },
  { id: "seed-175", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Preston Y.", rating: 4, text: "Warm sake selection is carefully curated and served at proper serving temperature.", sentiment: "positive", sentimentScore: 0.90, date: "2025-11-07", category: "Food Quality" },
  { id: "seed-176", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Leona F.", rating: 5, text: "Matcha mille crepe cake was light, layers were delicate, and not overly sweet.", sentiment: "positive", sentimentScore: 0.94, date: "2025-10-27", category: "Food Quality" },
  { id: "seed-177", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Damon K.", rating: 3, text: "Food was good but waited 40 minutes between our appetizers and our sushi platters.", sentiment: "neutral", sentimentScore: 0.48, date: "2025-10-16", category: "Service" },
  { id: "seed-178", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Beth J.", rating: 5, text: "Attentive tea service and complimentary warm hand towels upon seating. Outstanding.", sentiment: "positive", sentimentScore: 0.96, date: "2025-10-08", category: "Service" },
  { id: "seed-179", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Vaughn E.", rating: 4, text: "Crispy salmon skin roll with cucumber and sweet unagi sauce was super crunchy.", sentiment: "positive", sentimentScore: 0.91, date: "2025-09-23", category: "Food Quality" },
  { id: "seed-180", restaurantId: "sakura-sushi-id", restaurantName: "Sakura Sushi", customerName: "Audra R.", rating: 5, text: "Uni from Hokkaido was incredibly fresh, creamy, and sweet. World-class Japanese dining.", sentiment: "positive", sentimentScore: 0.99, date: "2025-09-11", category: "Food Quality" }
];

export const getDynamicReviewDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
};

/**
 * Returns seed reviews distributed relative to current date so that:
 * - Days 0 (Today) has reviews
 * - Days 1..7 (Last 7 Days) has reviews
 * - Days 8..30 (Last 30 Days) has reviews
 * - Days 31..90 has reviews
 */
export const getDynamicSeedReviews = (): Review[] => {
  return INITIAL_SEED_REVIEWS.map((rev, idx) => {
    // 180 reviews spread across 0 to 44 days ago
    const daysAgo = idx % 45;
    const dynamicDate = getDynamicReviewDate(daysAgo);
    return {
      ...rev,
      date: dynamicDate,
      ownerReplyDate: rev.ownerReply ? dynamicDate : undefined,
    };
  });
};

export const getStoredReviews = (): Review[] => {
  try {
    const raw = localStorage.getItem("tastepulse_reviews_store_v4");
    if (!raw) {
      const dynamicSeeds = getDynamicSeedReviews();
      localStorage.setItem("tastepulse_reviews_store_v4", JSON.stringify(dynamicSeeds));
      localStorage.removeItem("tastepulse_reviews_store");
      localStorage.removeItem("tastepulse_reviews_store_v2");
      localStorage.removeItem("tastepulse_reviews_store_v3");
      return dynamicSeeds;
    }
    const parsed: Review[] = JSON.parse(raw);
    const todayStr = new Date().toISOString().split("T")[0];
    const hasCurrentReview = parsed.some((r) => r.date === todayStr);
    if (!hasCurrentReview) {
      const refreshed = getDynamicSeedReviews();
      localStorage.setItem("tastepulse_reviews_store_v4", JSON.stringify(refreshed));
      return refreshed;
    }
    return parsed;
  } catch {
    return getDynamicSeedReviews();
  }
};

export const saveStoredReviews = (reviews: Review[]) => {
  try {
    localStorage.setItem("tastepulse_reviews_store_v4", JSON.stringify(reviews));
    window.dispatchEvent(new CustomEvent('tastepulse_review_store_updated', { detail: reviews }));
  } catch (err) {
    console.error("Failed to save reviews store to localStorage:", err);
  }
};

export const getStoredRestaurants = (): Restaurant[] => {
  try {
    const raw = localStorage.getItem("tastepulse_restaurants_store");
    let restaurants: Restaurant[] = raw ? JSON.parse(raw) : INITIAL_SEED_RESTAURANTS;
    if (!raw || !Array.isArray(restaurants) || restaurants.length === 0) {
      restaurants = INITIAL_SEED_RESTAURANTS;
      localStorage.setItem("tastepulse_restaurants_store", JSON.stringify(INITIAL_SEED_RESTAURANTS));
    }

    // Deduplicate by restaurant name so duplicate entries never appear
    const seenNames = new Set<string>();
    restaurants = restaurants.filter(r => {
      const normalized = (r.name || "").trim().toLowerCase();
      if (!normalized || seenNames.has(normalized)) return false;
      seenNames.add(normalized);
      return true;
    });

    // Always recalculate sentiment summary from the latest stored reviews
    const allReviews = getStoredReviews();
    restaurants = restaurants.map(r => {
      const matchingReviews = allReviews.filter(rev => 
        (r.name && rev.restaurantName?.toLowerCase() === r.name.toLowerCase()) || 
        (r.id && rev.restaurantId === r.id)
      );
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
  let backendRestaurants: Restaurant[] = [];
  try {
    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/restaurants${myRestaurants ? '?myRestaurants=true' : ''}`;
    const response = await fetch(url, { headers });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        backendRestaurants = data;
      }
    }
  } catch {
    // Fallback to local store
  }

  const stored = getStoredRestaurants();
  // Merge and deduplicate by normalized name so duplicate restaurants never appear
  const combined = [...backendRestaurants, ...stored];
  const seenNames = new Set<string>();
  const results = combined.filter(r => {
    const key = (r.name || "").trim().toLowerCase();
    if (!key || seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });

  return results.length > 0 ? results : stored;
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
  const monthOrder = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const monthlyData: Record<string, { positive: number; negative: number; neutral: number }> = {
    "Sep": { positive: 24, negative: 4, neutral: 4 },
    "Oct": { positive: 28, negative: 6, neutral: 5 },
    "Nov": { positive: 32, negative: 7, neutral: 5 },
    "Dec": { positive: 45, negative: 6, neutral: 4 },
    "Jan": { positive: 40, negative: 8, neutral: 7 },
    "Feb": { positive: 42, negative: 6, neutral: 5 },
  };

  reviews.forEach(r => {
    const d = r.date || "";
    let monthKey = "";
    if (d.startsWith("2025-09") || d.includes("Sep")) monthKey = "Sep";
    else if (d.startsWith("2025-10") || d.includes("Oct")) monthKey = "Oct";
    else if (d.startsWith("2025-11") || d.includes("Nov")) monthKey = "Nov";
    else if (d.startsWith("2025-12") || d.includes("Dec")) monthKey = "Dec";
    else if (d.startsWith("2026-01") || d.includes("Jan")) monthKey = "Jan";
    else if (d.startsWith("2026-02") || d.includes("Feb")) monthKey = "Feb";

    if (monthKey && monthlyData[monthKey]) {
      const s = r.sentiment || "neutral";
      if (monthlyData[monthKey][s] !== undefined) {
        monthlyData[monthKey][s] += 1;
      }
    }
  });

  return monthOrder.map(month => ({
    month,
    ...monthlyData[month]
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
  const current = getStoredRestaurants();
  const target = current.find(r => r.id === restaurantId);
  const targetName = target?.name?.trim().toLowerCase();

  let stored = current.filter(r => r.id !== restaurantId && (!targetName || r.name?.trim().toLowerCase() !== targetName));
  // If user deleted all restaurants, keep the other seed restaurants alive
  if (stored.length === 0) {
    stored = INITIAL_SEED_RESTAURANTS.filter(r => r.id !== restaurantId && (!targetName || r.name?.trim().toLowerCase() !== targetName));
  }
  saveStoredRestaurants(stored);

  // If a restaurant was deleted, also clean up associated reviews safely
  if (targetName) {
    const currentReviews = getStoredReviews();
    const remaining = currentReviews.filter(r => 
      r.restaurantId !== restaurantId && 
      (r.restaurantName || "").trim().toLowerCase() !== targetName
    );
    saveStoredReviews(remaining.length > 0 ? remaining : INITIAL_SEED_REVIEWS);
  }

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
