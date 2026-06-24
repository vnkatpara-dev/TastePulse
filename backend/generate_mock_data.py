import json
import random
from datetime import datetime, timedelta

# Configuration
RESTAURANTS = [
    {"id": "1", "name": "The Golden Fork", "cuisine": "Italian", "averageRating": 4.2, "totalReviews": 0},
    {"id": "2", "name": "Spice Route", "cuisine": "Indian", "averageRating": 4.1, "totalReviews": 0},
    {"id": "3", "name": "Ocean Breeze", "cuisine": "Seafood", "averageRating": 4.4, "totalReviews": 0},
    {"id": "burger-shack-id", "name": "Burger Shack", "cuisine": "Fast Food", "averageRating": 3.6, "totalReviews": 0},
    {"id": "sakura-sushi-id", "name": "Sakura Sushi", "cuisine": "Japanese", "averageRating": 4.3, "totalReviews": 0}
]

NAMES = [
    "Alice M.", "Bob T.", "Carol S.", "David L.", "Emma W.", "Frank H.", "Grace K.", "Henry P.",
    "Irene D.", "Jack R.", "Karen B.", "Leo M.", "Sarah J.", "Mike D.", "Nancy C.", "Oliver K.",
    "Penny L.", "Quincy M.", "Rachel G.", "Sam W.", "Tina F.", "Victor P.", "Wendy R.", "Xavier S.",
    "Yvonne T.", "Zach U.", "Liam N.", "Sophia E.", "Noah V.", "Olivia P.", "Jackson C.", "Ava L."
]

REVIEW_TEMPLATES = {
    "The Golden Fork": {
        "positive": [
            ("The truffle pasta was absolutely divine! Best Italian in town.", "Food Quality", 5, 0.95),
            ("Wonderful cozy ambiance and the wood-fired pizza was cooked perfectly.", "Ambiance", 5, 0.92),
            ("Excellent dining experience. The lasagna was rich and service was highly attentive.", "Food Quality", 5, 0.94),
            ("Amazing wine selection paired with perfect bruschetta. Highly recommend!", "Food Quality", 4, 0.88),
            ("The staff was incredibly welcoming and our pasta dishes were top-tier.", "Service", 5, 0.91),
            ("Great date night spot. The acoustics are quiet and decor is rustic.", "Ambiance", 4, 0.85),
            ("Superb value for the lunch specials. Gourmet pasta at a reasonable cost.", "Value", 4, 0.83),
        ],
        "neutral": [
            ("Food was decent, though the marinara sauce was a bit plain.", "Food Quality", 3, 0.52),
            ("Average Italian dining. The service was polite but quite slow.", "Service", 3, 0.48),
            ("The pasta was good, but the tables were placed too close together.", "Ambiance", 3, 0.45),
            ("Pretty standard Italian food, pricing is okay for the portion sizes.", "Value", 3, 0.50),
        ],
        "negative": [
            ("Terrible service. Waited 45 minutes for basic spaghetti and it was cold.", "Service", 1, 0.08),
            ("Highly overpriced for tiny portions of bland pasta. Very disappointed.", "Value", 2, 0.15),
            ("The table was dirty and there was dust on the wine glasses. Poor hygiene.", "Hygiene", 2, 0.12),
            ("Extremely loud environment, made it impossible to talk. Food was average.", "Ambiance", 2, 0.18),
        ]
    },
    "Spice Route": {
        "positive": [
            ("Best butter chicken I've ever tasted! Extremely rich and aromatic spices.", "Food Quality", 5, 0.96),
            ("Very clean buffet layout and the garlic naan was fresh out of the oven.", "Hygiene", 5, 0.93),
            ("Exceptional service. The waiters helped customize the spice levels perfectly.", "Service", 5, 0.90),
            ("Loved the chicken tikka masala and vegetable samosas. Top tier Indian food.", "Food Quality", 4, 0.89),
            ("Spicy lamb vindaloo was phenomenal, and the portion sizes are huge.", "Food Quality", 5, 0.92),
            ("Great value for money. The buffet has an enormous selection for a cheap price.", "Value", 4, 0.85),
        ],
        "neutral": [
            ("Good food but it was a bit too spicy for my taste. Decent service.", "Food Quality", 3, 0.50),
            ("Average Indian cuisine. The naan was a bit dry, but the curry was okay.", "Food Quality", 3, 0.48),
            ("Nice ambiance but the dining hall was overly crowded during peak hour.", "Ambiance", 3, 0.46),
            ("Standard curries, neither bad nor exceptional. Service was regular.", "Service", 3, 0.52),
        ],
        "negative": [
            ("Found a hair in my chicken tikka. Management was dismissive and rude.", "Hygiene", 1, 0.05),
            ("Service was incredibly slow. We waited over an hour for our main dishes.", "Service", 1, 0.10),
            ("Highly overpriced curries that were mostly sauce and very little meat.", "Value", 2, 0.15),
            ("The tables were sticky and the restrooms were not clean. Very bad hygiene.", "Hygiene", 2, 0.11),
        ]
    },
    "Ocean Breeze": {
        "positive": [
            ("The freshest seafood in the harbor! Lobster bisque is outstanding.", "Food Quality", 5, 0.97),
            ("Stunning ocean view, beautiful glass design, and quick service.", "Ambiance", 5, 0.95),
            ("Superb crab cakes and oysters. Absolute perfection by the sea.", "Food Quality", 5, 0.94),
            ("Excellent clam chowder and the fish was caught fresh daily.", "Food Quality", 4, 0.91),
            ("Friendly server who gave excellent recommendations on the daily specials.", "Service", 4, 0.88),
            ("High quality seafood, worth every penny for a special occasion.", "Value", 4, 0.82),
        ],
        "neutral": [
            ("Food was okay, but the clam chowder was a bit too salty.", "Food Quality", 3, 0.45),
            ("Nice view of the marina, but the seafood selection was limited.", "Ambiance", 3, 0.51),
            ("Decent meal, service took a while to bring the check.", "Service", 3, 0.47),
            ("The food was good, though slightly expensive for what it is.", "Value", 3, 0.49),
        ],
        "negative": [
            ("Seafood did not taste fresh at all. Had an upset stomach afterwards.", "Hygiene", 1, 0.06),
            ("Terrible service. Hostess lost our reservation and left us waiting outside.", "Service", 1, 0.12),
            ("Soggy and greasy fish and chips. Absolutely overpriced for oil-soaked food.", "Food Quality", 2, 0.14),
            ("Extremely cold draft inside the restaurant and server was highly inattentive.", "Ambiance", 2, 0.19),
        ]
    },
    "Burger Shack": {
        "positive": [
            ("Phenomenal double cheeseburger! Buns were soft and meat was incredibly juicy.", "Food Quality", 5, 0.95),
            ("Extremely fast drive-thru and very polite cashiers. Solid service.", "Service", 5, 0.90),
            ("Best value burger in the city. Cheap, quick, and highly satisfying.", "Value", 5, 0.93),
            ("Curly fries were perfectly seasoned and the milkshakes are rich.", "Food Quality", 4, 0.87),
            ("Super clean dining area and tables. Great quick lunch spot.", "Hygiene", 4, 0.86),
        ],
        "neutral": [
            ("Standard fast-food burger. Quick service but nothing memorable.", "Food Quality", 3, 0.50),
            ("The fries were good but the burger patty was slightly dry.", "Food Quality", 3, 0.47),
            ("Decent prices, although the milkshakes are a bit small.", "Value", 3, 0.49),
            ("Fast service, but the lobby was quite noisy with kids.", "Ambiance", 3, 0.44),
        ],
        "negative": [
            ("Dirty, sticky tables and trash cans overflowing. Horrible hygiene.", "Hygiene", 1, 0.08),
            ("Soggy, cold fries and a completely burnt burger. Awful fast food.", "Food Quality", 1, 0.11),
            ("They completely messed up our order and refused to fix it. Poor service.", "Service", 2, 0.14),
            ("Overpriced for basic fast food, and the soda machine was broken.", "Value", 2, 0.18),
        ]
    },
    "Sakura Sushi": {
        "positive": [
            ("Incredibly fresh salmon sashimi and the dragon rolls were amazing.", "Food Quality", 5, 0.98),
            ("Beautiful minimalist Japanese decor, tranquil music, perfect ambiance.", "Ambiance", 5, 0.96),
            ("The sushi chef was engaging and prepared the rolls right in front of us.", "Service", 5, 0.93),
            ("High-quality fresh tuna and very attentive wait staff.", "Food Quality", 4, 0.90),
            ("Clean prep bar and meticulous plating. Absolute art on a plate.", "Hygiene", 5, 0.92),
            ("Price is premium but the quality of fresh imported fish justifies it.", "Value", 4, 0.83),
        ],
        "neutral": [
            ("Sushi was decent, but the rice was a bit too sweet for me.", "Food Quality", 3, 0.49),
            ("Standard sushi roll selections. Nice environment but nothing unique.", "Ambiance", 3, 0.50),
            ("The food was fine, though we had to ask twice for soy sauce.", "Service", 3, 0.45),
            ("Decent rolls, pricing is normal for high-end sushi.", "Value", 3, 0.48),
        ],
        "negative": [
            ("Wait time for sushi was over 50 minutes. Understaffed prep bar.", "Service", 2, 0.15),
            ("Extremely expensive for very small pieces of sushi. Low value.", "Value", 2, 0.17),
            ("Found a small fly in the salad bowl. Kitchen prep needs inspection.", "Hygiene", 1, 0.07),
            ("Warm fish served on rolls that should be chilled. Terrible quality.", "Food Quality", 1, 0.10),
        ]
    }
}

def generate_mock_data():
    reviews = []
    
    # Generate ~200 reviews spread across the last 12 months (July 2025 to June 2026)
    start_date = datetime(2025, 7, 1)
    end_date = datetime(2026, 6, 24)
    total_days = (end_date - start_date).days
    
    review_id_counter = 1001
    
    # Let's assign count weight to restaurants
    restaurant_configs = {
        "The Golden Fork": 45,
        "Spice Route": 40,
        "Ocean Breeze": 35,
        "Burger Shack": 42,
        "Sakura Sushi": 38
    }
    
    for r_name, count in restaurant_configs.items():
        templates = REVIEW_TEMPLATES[r_name]
        
        for _ in range(count):
            # Pick positive, negative, neutral with some weights (e.g. 60% positive, 25% negative, 15% neutral)
            rand = random.random()
            if rand < 0.60:
                sentiment = "positive"
            elif rand < 0.85:
                sentiment = "negative"
            else:
                sentiment = "neutral"
                
            template = random.choice(templates[sentiment])
            text, category, rating, score_base = template
            
            # Add minor random noise to score base
            score = round(max(0.01, min(0.99, score_base + random.uniform(-0.05, 0.05))), 2)
            
            # Generate random date
            random_days = random.randint(0, total_days)
            review_date = (start_date + timedelta(days=random_days)).strftime("%Y-%m-%d")
            
            customer_name = random.choice(NAMES)
            
            reviews.append({
                "id": str(review_id_counter),
                "customerName": customer_name,
                "restaurantName": r_name,
                "rating": rating,
                "text": text,
                "sentiment": sentiment,
                "sentimentScore": score,
                "date": review_date,
                "category": category
            })
            review_id_counter += 1
            
    # Sort reviews by date descending
    reviews.sort(key=lambda x: x["date"], reverse=True)
    
    # Recalculate average ratings and total review counts for each restaurant
    for rest in RESTAURANTS:
        rest_reviews = [rev for rev in reviews if rev["restaurantName"] == rest["name"]]
        if rest_reviews:
            total = len(rest_reviews)
            avg_rating = round(sum(rev["rating"] for rev in rest_reviews) / total, 2)
            rest["averageRating"] = avg_rating
            rest["totalReviews"] = total
            
    # Write directly to reviews.json
    db_data = {
        "reviews": reviews,
        "restaurants": RESTAURANTS
    }
    
    output_path = "backend/reviews.json"
    with open(output_path, "w") as f:
        json.dump(db_data, f, indent=2)
        
    print(f"Generated {len(reviews)} reviews successfully in {output_path}!")

if __name__ == "__main__":
    generate_mock_data()
