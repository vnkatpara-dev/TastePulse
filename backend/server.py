from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import json
from datetime import datetime
import uuid

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

from auth_middleware import firebase_initialized
from firebase_admin import firestore

# Initialize Firestore client if Firebase is active
db = None
if firebase_initialized:
    try:
        db = firestore.client()
        print("Firestore client initialized successfully!")
    except Exception as e:
        print(f"Could not initialize Firestore client: {e}")
        db = None

# Load model and vectorizer
MODEL_PATH = os.path.join(os.path.dirname(__file__), "restaurant_sentiment_model.pkl")
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), "tfidf_vectorizer.pkl")
DATA_PATH = os.path.join(os.path.dirname(__file__), "reviews.json")

# Try to load model and vectorizer, use fallback if it fails
model = None
vectorizer = None

try:
    print("Loading model and vectorizer...")
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Could not load ML model: {e}")
    print("Using fallback rule-based sentiment classifier")
    model = None
    vectorizer = None

# Fallback rule-based sentiment classifier
def simple_sentiment(text):
    """Simple rule-based sentiment classifier as fallback"""
    text_lower = text.lower()
    pos_words = ["good", "great", "excellent", "amazing", "love", "delicious", "friendly", "awesome", "best", "nice", "fantastic", "wonderful", "perfect", "stunning", "phenomenal", "impressive", "warm", "welcoming", "fresh", "divine", "outstanding", "superb"]
    neg_words = ["bad", "terrible", "awful", "hate", "horrible", "rude", "slow", "worst", "poor", "disgusting", "dirty", "cold", "overpriced", "dismissive", "lost", "waited", "hair", "difficult", "okay", "decent"]
    
    pos_count = sum(1 for word in pos_words if word in text_lower)
    neg_count = sum(1 for word in neg_words if word in text_lower)
    
    if pos_count > neg_count:
        return "positive"
    elif neg_count > pos_count:
        return "negative"
    return "neutral"

# Initialize data file if it doesn't exist
if not os.path.exists(DATA_PATH):
    initial_data = {
        "reviews": [
            {"id": "101", "customerName": "Alice M.", "restaurantName": "The Golden Fork", "rating": 5, "text": "Fabulous lasagna and wonderful summer salad! Service was quick.", "sentiment": "positive", "sentimentScore": 0.95, "date": "2025-06-12", "category": "Food Quality"},
            {"id": "102", "customerName": "Bob T.", "restaurantName": "Spice Route", "rating": 3, "text": "The chicken tikka was okay, but the service was extremely slow.", "sentiment": "neutral", "sentimentScore": 0.45, "date": "2025-06-25", "category": "Service"},
            {"id": "103", "customerName": "Carol S.", "restaurantName": "Ocean Breeze", "rating": 2, "text": "Found a piece of plastic in the crab cake. Disgusting hygiene standards.", "sentiment": "negative", "sentimentScore": 0.1, "date": "2025-07-08", "category": "Hygiene"},
            {"id": "104", "customerName": "David L.", "restaurantName": "The Golden Fork", "rating": 4, "text": "Great wine list and lovely view. The steak was cooked perfectly.", "sentiment": "positive", "sentimentScore": 0.88, "date": "2025-07-22", "category": "Ambiance"},
            {"id": "105", "customerName": "Emma W.", "restaurantName": "Spice Route", "rating": 5, "text": "Unbelievable flavors! The lamb vindaloo was out of this world.", "sentiment": "positive", "sentimentScore": 0.96, "date": "2025-08-14", "category": "Food Quality"},
            {"id": "106", "customerName": "Frank H.", "restaurantName": "Ocean Breeze", "rating": 4, "text": "Nice dining by the water. Good oysters and pleasant service.", "sentiment": "positive", "sentimentScore": 0.85, "date": "2025-08-28", "category": "Ambiance"},
            {"id": "107", "customerName": "Grace K.", "restaurantName": "The Golden Fork", "rating": 1, "text": "Rude waiters and overpriced wine. Will never return.", "sentiment": "negative", "sentimentScore": 0.05, "date": "2025-09-05", "category": "Service"},
            {"id": "108", "customerName": "Henry P.", "restaurantName": "Spice Route", "rating": 4, "text": "Reliable Indian food, very clean and friendly staff.", "sentiment": "positive", "sentimentScore": 0.89, "date": "2025-09-19", "category": "Hygiene"},
            {"id": "109", "customerName": "Irene D.", "restaurantName": "Ocean Breeze", "rating": 3, "text": "Portion sizes were too small for the price. Food was decent.", "sentiment": "neutral", "sentimentScore": 0.5, "date": "2025-10-10", "category": "Value"},
            {"id": "110", "customerName": "Jack R.", "restaurantName": "The Golden Fork", "rating": 5, "text": "Best pasta I've had in years! Absolutely amazing restaurant.", "sentiment": "positive", "sentimentScore": 0.97, "date": "2025-10-31", "category": "Food Quality"},
            {"id": "111", "customerName": "Karen B.", "restaurantName": "Spice Route", "rating": 2, "text": "Very bland food. I expected authentic spices, but was let down.", "sentiment": "negative", "sentimentScore": 0.2, "date": "2025-11-12", "category": "Food Quality"},
            {"id": "112", "customerName": "Leo M.", "restaurantName": "Ocean Breeze", "rating": 5, "text": "Super fresh seafood, fast service, beautiful decor.", "sentiment": "positive", "sentimentScore": 0.94, "date": "2025-11-28", "category": "Food Quality"},
            {"id": "113", "customerName": "Sarah J.", "restaurantName": "The Golden Fork", "rating": 4, "text": "Holiday menu was delicious. The noise level was quite high though.", "sentiment": "positive", "sentimentScore": 0.78, "date": "2025-12-15", "category": "Ambiance"},
            {"id": "114", "customerName": "Mike D.", "restaurantName": "Spice Route", "rating": 5, "text": "Best butter chicken in town! Extremely friendly servers.", "sentiment": "positive", "sentimentScore": 0.93, "date": "2025-12-24", "category": "Service"},
            {"id": "115", "customerName": "Nancy C.", "restaurantName": "Ocean Breeze", "rating": 2, "text": "Overpriced for what it is. Wait time was over an hour.", "sentiment": "negative", "sentimentScore": 0.15, "date": "2026-01-08", "category": "Value"},
            {"id": "116", "customerName": "Oliver K.", "restaurantName": "The Golden Fork", "rating": 3, "text": "Average Italian food. The service was polite but slow.", "sentiment": "neutral", "sentimentScore": 0.48, "date": "2026-01-20", "category": "Service"},
            {"id": "1", "customerName": "Alice M.", "restaurantName": "The Golden Fork", "rating": 5, "text": "Absolutely stunning food and ambiance. The truffle pasta was divine!", "sentiment": "positive", "sentimentScore": 0.95, "date": "2026-02-18", "category": "Food Quality"},
            {"id": "2", "customerName": "Bob T.", "restaurantName": "The Golden Fork", "rating": 2, "text": "Service was incredibly slow. Waited 45 minutes for appetizers.", "sentiment": "negative", "sentimentScore": 0.15, "date": "2026-02-17", "category": "Service"},
            {"id": "3", "customerName": "Carol S.", "restaurantName": "The Golden Fork", "rating": 4, "text": "Great food but the noise level made conversation difficult.", "sentiment": "neutral", "sentimentScore": 0.6, "date": "2026-02-16", "category": "Ambiance"},
            {"id": "4", "customerName": "David L.", "restaurantName": "Spice Route", "rating": 5, "text": "Best Indian food I've had outside of India. The butter chicken is phenomenal.", "sentiment": "positive", "sentimentScore": 0.92, "date": "2026-02-15", "category": "Food Quality"},
            {"id": "5", "customerName": "Emma W.", "restaurantName": "Spice Route", "rating": 1, "text": "Found a hair in my soup. Management was dismissive about it.", "sentiment": "negative", "sentimentScore": 0.05, "date": "2026-02-14", "category": "Hygiene"},
            {"id": "6", "customerName": "Frank H.", "restaurantName": "The Golden Fork", "rating": 4, "text": "Lovely date night spot. Wine selection is impressive.", "sentiment": "positive", "sentimentScore": 0.82, "date": "2026-02-13", "category": "Ambiance"},
            {"id": "7", "customerName": "Grace K.", "restaurantName": "Ocean Breeze", "rating": 5, "text": "The freshest seafood in town. Lobster bisque was out of this world!", "sentiment": "positive", "sentimentScore": 0.97, "date": "2026-02-12", "category": "Food Quality"},
            {"id": "8", "customerName": "Henry P.", "restaurantName": "Ocean Breeze", "rating": 3, "text": "Food was okay but overpriced for the portion size.", "sentiment": "neutral", "sentimentScore": 0.45, "date": "2026-02-11", "category": "Value"},
            {"id": "9", "customerName": "Irene D.", "restaurantName": "Spice Route", "rating": 4, "text": "Warm and welcoming staff. The naan bread was perfectly crispy.", "sentiment": "positive", "sentimentScore": 0.85, "date": "2026-02-10", "category": "Service"},
            {"id": "10", "customerName": "Jack R.", "restaurantName": "The Golden Fork", "rating": 2, "text": "Reservation was lost. Had to wait 30 minutes despite booking ahead.", "sentiment": "negative", "sentimentScore": 0.12, "date": "2026-02-09", "category": "Service"},
            {"id": "11", "customerName": "Karen B.", "restaurantName": "Ocean Breeze", "rating": 5, "text": "The sunset view paired with amazing sushi. Unforgettable experience!", "sentiment": "positive", "sentimentScore": 0.94, "date": "2026-02-08", "category": "Ambiance"},
            {"id": "12", "customerName": "Leo M.", "restaurantName": "Spice Route", "rating": 3, "text": "Decent food but nothing special. Expected more given the hype.", "sentiment": "neutral", "sentimentScore": 0.5, "date": "2026-02-07", "category": "Food Quality"},
            {"id": "117", "customerName": "Penny L.", "restaurantName": "Spice Route", "rating": 4, "text": "Spicy but delicious. The garlic naan was super soft.", "sentiment": "positive", "sentimentScore": 0.87, "date": "2026-03-15", "category": "Food Quality"},
            {"id": "118", "customerName": "Quincy M.", "restaurantName": "Ocean Breeze", "rating": 4, "text": "Wonderful atmosphere. Seafood platter is huge and tasty.", "sentiment": "positive", "sentimentScore": 0.91, "date": "2026-03-29", "category": "Food Quality"},
            {"id": "119", "customerName": "Rachel G.", "restaurantName": "The Golden Fork", "rating": 2, "text": "The table was dirty and service was dismissive. Disappointing.", "sentiment": "negative", "sentimentScore": 0.18, "date": "2026-04-10", "category": "Hygiene"},
            {"id": "120", "customerName": "Sam W.", "restaurantName": "Spice Route", "rating": 5, "text": "Consistent quality and warm hospitality. Love the samosas.", "sentiment": "positive", "sentimentScore": 0.94, "date": "2026-04-25", "category": "Service"},
            {"id": "121", "customerName": "Tina F.", "restaurantName": "Ocean Breeze", "rating": 3, "text": "Decent food, but the music was too loud. Hard to talk.", "sentiment": "neutral", "sentimentScore": 0.46, "date": "2026-05-05", "category": "Ambiance"},
            {"id": "122", "customerName": "Victor P.", "restaurantName": "The Golden Fork", "rating": 5, "text": "Truffle pasta is a must-try. Top tier food quality.", "sentiment": "positive", "sentimentScore": 0.96, "date": "2026-05-18", "category": "Food Quality"},
            {"id": "201", "customerName": "Guest Diner", "restaurantName": "Burger Shack", "rating": 5, "text": "Best burgers in town! The brioche bun was fresh and the patty was incredibly juicy.", "sentiment": "positive", "sentimentScore": 0.96, "date": "2026-03-10", "category": "Food Quality"},
            {"id": "202", "customerName": "Alice M.", "restaurantName": "Burger Shack", "rating": 2, "text": "The fries were cold and soggy. Service took way too long for fast food.", "sentiment": "negative", "sentimentScore": 0.12, "date": "2026-03-24", "category": "Service"},
            {"id": "203", "customerName": "Bob T.", "restaurantName": "Burger Shack", "rating": 4, "text": "Decent burger for the price. Fast and clean.", "sentiment": "positive", "sentimentScore": 0.82, "date": "2026-04-12", "category": "Value"},
            {"id": "204", "customerName": "Carol S.", "restaurantName": "Burger Shack", "rating": 2, "text": "Tables were dirty and sticky. Staff was completely indifferent.", "sentiment": "negative", "sentimentScore": 0.15, "date": "2026-05-18", "category": "Hygiene"},
            {"id": "205", "customerName": "David L.", "restaurantName": "Sakura Sushi", "rating": 5, "text": "Incredibly fresh sushi! The chef was amazing and interactive.", "sentiment": "positive", "sentimentScore": 0.97, "date": "2026-04-05", "category": "Food Quality"},
            {"id": "206", "customerName": "Emma W.", "restaurantName": "Sakura Sushi", "rating": 3, "text": "Decent rolls, but it was way too expensive for what they served.", "sentiment": "neutral", "sentimentScore": 0.45, "date": "2026-04-20", "category": "Value"},
            {"id": "207", "customerName": "Frank H.", "restaurantName": "Sakura Sushi", "rating": 5, "text": "Beautiful atmosphere, quiet music, perfect for date night.", "sentiment": "positive", "sentimentScore": 0.94, "date": "2026-05-12", "category": "Ambiance"},
            {"id": "208", "customerName": "Grace K.", "restaurantName": "Sakura Sushi", "rating": 2, "text": "Wait time for sushi was over 50 minutes. Not worth the wait.", "sentiment": "negative", "sentimentScore": 0.18, "date": "2026-05-30", "category": "Service"}
        ],
        "restaurants": [
            {"id": "1", "name": "The Golden Fork", "cuisine": "Italian", "averageRating": 3.8, "totalReviews": 234},
            {"id": "2", "name": "Spice Route", "cuisine": "Indian", "averageRating": 4.1, "totalReviews": 189},
            {"id": "3", "name": "Ocean Breeze", "cuisine": "Seafood", "averageRating": 4.3, "totalReviews": 156},
            {"id": "burger-shack-id", "name": "Burger Shack", "cuisine": "Fast Food", "averageRating": 3.25, "totalReviews": 4},
            {"id": "sakura-sushi-id", "name": "Sakura Sushi", "cuisine": "Japanese", "averageRating": 3.75, "totalReviews": 4}
        ]
    }
    with open(DATA_PATH, 'w') as f:
        json.dump(initial_data, f, indent=2)

def seed_firestore_if_empty():
    if db is None:
        return
    try:
        # Check if restaurants collection has any documents
        docs = list(db.collection('restaurants').limit(1).stream())
        if len(docs) == 0:
            print("Seeding Firestore with initial mock data...")
            seed_data = None
            if os.path.exists(DATA_PATH):
                try:
                    with open(DATA_PATH, 'r') as f:
                        seed_data = json.load(f)
                except Exception as e:
                    print(f"Could not load local reviews.json for seeding: {e}")
            
            # If local file is missing, use global initial_data template
            if not seed_data or 'restaurants' not in seed_data:
                print("Seeding Firestore using template initial_data...")
                global initial_data
                seed_data = initial_data
                
            # Seed restaurants
            for r in seed_data.get('restaurants', []):
                db.collection('restaurants').document(r['id']).set(r)
                
            # Seed reviews
            for rev in seed_data.get('reviews', []):
                db.collection('reviews').document(rev['id']).set(rev)
                
            print(f"Firestore seeding completed! Seeded {len(seed_data.get('restaurants', []))} restaurants and {len(seed_data.get('reviews', []))} reviews.")
    except Exception as e:
        print(f"Error seeding Firestore: {e}")

# Call seed function immediately on server startup
if db is not None:
    seed_firestore_if_empty()

def load_data():
    """Load data from Firestore if available, otherwise from local JSON file"""
    if db is not None:
        try:
            # Load reviews
            reviews_ref = db.collection('reviews')
            reviews_docs = reviews_ref.stream()
            reviews = [doc.to_dict() for doc in reviews_docs]
            
            # Load restaurants
            restaurants_ref = db.collection('restaurants')
            restaurants_docs = restaurants_ref.stream()
            restaurants = [doc.to_dict() for doc in restaurants_docs]
            
            return {
                "reviews": reviews,
                "restaurants": restaurants
            }
        except Exception as e:
            print(f"Error loading from Firestore: {e}")
            # Fall back to local file
            
    # Local JSON fallback
    with open(DATA_PATH, 'r') as f:
        return json.load(f)

def save_data(data):
    """Save data to local JSON file"""
    try:
        with open(DATA_PATH, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving to local file: {e}")

def add_review_db(review):
    """Add a review to Firestore and local JSON"""
    if db is not None:
        try:
            db.collection('reviews').document(review['id']).set(review)
        except Exception as e:
            print(f"Error adding review to Firestore: {e}")
    try:
        db_data = load_data()
        db_data['reviews'] = [r for r in db_data['reviews'] if r['id'] != review['id']]
        db_data['reviews'].append(review)
        save_data(db_data)
    except Exception as e:
        print(f"Error saving review locally: {e}")

def delete_review_db(review_id):
    """Delete a review from Firestore and local JSON"""
    if db is not None:
        try:
            db.collection('reviews').document(review_id).delete()
        except Exception as e:
            print(f"Error deleting review from Firestore: {e}")
    try:
        db_data = load_data()
        db_data['reviews'] = [r for r in db_data['reviews'] if r['id'] != review_id]
        save_data(db_data)
    except Exception as e:
        print(f"Error deleting review locally: {e}")

def add_restaurant_db(restaurant):
    """Add a restaurant to Firestore and local JSON"""
    if db is not None:
        try:
            db.collection('restaurants').document(restaurant['id']).set(restaurant)
        except Exception as e:
            print(f"Error adding restaurant to Firestore: {e}")
    try:
        db_data = load_data()
        db_data['restaurants'] = [r for r in db_data['restaurants'] if r['id'] != restaurant['id']]
        db_data['restaurants'].append(restaurant)
        save_data(db_data)
    except Exception as e:
        print(f"Error saving restaurant locally: {e}")

def delete_restaurant_db(restaurant_id, restaurant_name):
    """Delete a restaurant and its reviews from Firestore and local JSON"""
    if db is not None:
        try:
            db.collection('restaurants').document(restaurant_id).delete()
            reviews_ref = db.collection('reviews').where('restaurantName', '==', restaurant_name)
            docs = reviews_ref.stream()
            for doc in docs:
                doc.reference.delete()
        except Exception as e:
            print(f"Error deleting restaurant/reviews from Firestore: {e}")
    try:
        db_data = load_data()
        db_data['restaurants'] = [r for r in db_data['restaurants'] if r['id'] != restaurant_id]
        db_data['reviews'] = [r for r in db_data['reviews'] if r['restaurantName'] != restaurant_name]
        save_data(db_data)
    except Exception as e:
        print(f"Error deleting restaurant locally: {e}")

def update_restaurant_db(restaurant_id, updated_fields):
    """Update restaurant fields in Firestore and local JSON"""
    if db is not None:
        try:
            db.collection('restaurants').document(restaurant_id).update(updated_fields)
        except Exception as e:
            print(f"Error updating restaurant in Firestore: {e}")
    try:
        db_data = load_data()
        for r in db_data['restaurants']:
            if r['id'] == restaurant_id:
                for k, v in updated_fields.items():
                    r[k] = v
                break
        save_data(db_data)
    except Exception as e:
        print(f"Error updating restaurant locally: {e}")

def calculate_sentiment_score(prediction, confidence=0.8):
    """Convert sentiment prediction to a score between 0 and 1"""
    if prediction == "positive":
        return 0.5 + (confidence * 0.5)
    elif prediction == "negative":
        return 0.5 - (confidence * 0.5)
    else:
        return 0.5

@app.route('/api/predict', methods=['POST'])
def predict_sentiment():
    """Predict sentiment for a given text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Use ML model if available, otherwise use fallback classifier
        if model is not None and vectorizer is not None:
            text_vector = vectorizer.transform([text])
            prediction = model.predict(text_vector)[0]
            decision_score = model.decision_function(text_vector)[0]
            confidence = 1 / (1 + abs(decision_score))
            sentiment_score = calculate_sentiment_score(prediction, confidence)
        else:
            # Use fallback classifier
            prediction = simple_sentiment(text)
            confidence = 0.7
            sentiment_score = calculate_sentiment_score(prediction, confidence)
        
        return jsonify({
            'sentiment': prediction,
            'sentimentScore': sentiment_score,
            'confidence': confidence
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    """Get all reviews with optional date filtering"""
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        data = load_data()
        reviews = data['reviews']
        
        if start_date or end_date:
            filtered_reviews = []
            for r in reviews:
                review_date = r.get('date', '')
                if start_date and review_date < start_date:
                    continue
                if end_date and review_date > end_date:
                    continue
                filtered_reviews.append(r)
            return jsonify(filtered_reviews)
        
        return jsonify(reviews)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews/<restaurant_name>', methods=['GET'])
def get_reviews_by_restaurant(restaurant_name):
    """Get reviews for a specific restaurant with optional date filtering"""
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        data = load_data()
        reviews = [r for r in data['reviews'] if r['restaurantName'] == restaurant_name]
        
        if start_date or end_date:
            filtered_reviews = []
            for r in reviews:
                review_date = r.get('date', '')
                if start_date and review_date < start_date:
                    continue
                if end_date and review_date > end_date:
                    continue
                filtered_reviews.append(r)
            return jsonify(filtered_reviews)
        
        return jsonify(reviews)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews', methods=['POST'])
def add_review():
    """Add a new review with sentiment analysis"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['customerName', 'restaurantName', 'rating', 'text', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Predict sentiment for the review text
        text = data['text']
        
        # Use ML model if available, otherwise use fallback classifier
        if model is not None and vectorizer is not None:
            text_vector = vectorizer.transform([text])
            prediction = model.predict(text_vector)[0]
            decision_score = model.decision_function(text_vector)[0]
            confidence = 1 / (1 + abs(decision_score))
            sentiment_score = calculate_sentiment_score(prediction, confidence)
        else:
            # Use fallback classifier
            prediction = simple_sentiment(text)
            confidence = 0.7
            sentiment_score = calculate_sentiment_score(prediction, confidence)
        
        # Create review object
        review = {
            'id': str(uuid.uuid4()),
            'customerName': data['customerName'],
            'restaurantName': data['restaurantName'],
            'rating': data['rating'],
            'text': data['text'],
            'sentiment': prediction,
            'sentimentScore': sentiment_score,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'category': data['category']
        }
        
        # Add review using database helper
        add_review_db(review)
        
        return jsonify(review), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/restaurants', methods=['GET'])
def get_restaurants():
    """Get all restaurants with calculated sentiment summaries"""
    try:
        data = load_data()
        restaurants = data['restaurants']
        reviews = data['reviews']
        
        # Calculate sentiment summaries for each restaurant
        for restaurant in restaurants:
            restaurant_reviews = [r for r in reviews if r['restaurantName'] == restaurant['name']]
            total = len(restaurant_reviews)
            
            if total > 0:
                positive = len([r for r in restaurant_reviews if r['sentiment'] == 'positive'])
                negative = len([r for r in restaurant_reviews if r['sentiment'] == 'negative'])
                neutral = len([r for r in restaurant_reviews if r['sentiment'] == 'neutral'])
                avg_rating = sum([r['rating'] for r in restaurant_reviews]) / total
                
                restaurant['sentimentSummary'] = {
                    'positive': positive,
                    'negative': negative,
                    'neutral': neutral,
                    'total': total,
                    'averageRating': round(avg_rating, 1)
                }
            else:
                restaurant['sentimentSummary'] = {
                    'positive': 0,
                    'negative': 0,
                    'neutral': 0,
                    'total': 0,
                    'averageRating': 0
                }
        
        return jsonify(restaurants)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/restaurants', methods=['POST'])
def add_restaurant():
    """Add a new restaurant"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'cuisine']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create restaurant object
        restaurant = {
            'id': str(uuid.uuid4()),
            'name': data['name'],
            'cuisine': data['cuisine'],
            'averageRating': 0,
            'totalReviews': 0
        }
        
        # Add restaurant using database helper
        add_restaurant_db(restaurant)
        
        return jsonify(restaurant), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/restaurants/<restaurant_id>', methods=['DELETE'])
def delete_restaurant(restaurant_id):
    """Delete a restaurant"""
    try:
        # Load existing data
        db_data = load_data()
        
        # Find the restaurant name before removing
        restaurant_name = None
        for r in db_data['restaurants']:
            if r['id'] == restaurant_id:
                restaurant_name = r['name']
                break
        
        if not restaurant_name:
            return jsonify({'error': 'Restaurant not found'}), 404
            
        # Delete restaurant and associated reviews using database helper
        delete_restaurant_db(restaurant_id, restaurant_name)
        
        return jsonify({'message': 'Restaurant deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/restaurants/<restaurant_id>', methods=['PUT'])
def update_restaurant(restaurant_id):
    """Update a restaurant"""
    try:
        data = request.get_json()
        
        # Load existing data
        db_data = load_data()
        
        # Verify the restaurant exists
        restaurant_found = False
        for restaurant in db_data['restaurants']:
            if restaurant['id'] == restaurant_id:
                restaurant_found = True
                break
        
        if not restaurant_found:
            return jsonify({'error': 'Restaurant not found'}), 404
            
        # Update restaurant fields using database helper
        updated_fields = {}
        if 'name' in data:
            updated_fields['name'] = data['name']
        if 'cuisine' in data:
            updated_fields['cuisine'] = data['cuisine']
            
        update_restaurant_db(restaurant_id, updated_fields)
        
        return jsonify({'message': 'Restaurant updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get overall analytics data"""
    try:
        data = load_data()
        reviews = data['reviews']
        
        total_reviews = len(reviews)
        positive = len([r for r in reviews if r['sentiment'] == 'positive'])
        negative = len([r for r in reviews if r['sentiment'] == 'negative'])
        neutral = len([r for r in reviews if r['sentiment'] == 'neutral'])
        
        avg_rating = sum([r['rating'] for r in reviews]) / total_reviews if total_reviews > 0 else 0
        
        return jsonify({
            'totalReviews': total_reviews,
            'positive': positive,
            'negative': negative,
            'neutral': neutral,
            'positivePercent': round((positive / total_reviews) * 100, 1) if total_reviews > 0 else 0,
            'negativePercent': round((negative / total_reviews) * 100, 1) if total_reviews > 0 else 0,
            'averageRating': round(avg_rating, 1)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sentiment-trend', methods=['GET'])
def get_sentiment_trend():
    """Get sentiment trend over time"""
    try:
        data = load_data()
        reviews = data['reviews']
        
        # Group reviews by month
        monthly_data = {}
        for review in reviews:
            month = review['date'][:7]  # Get YYYY-MM
            if month not in monthly_data:
                monthly_data[month] = {'positive': 0, 'negative': 0, 'neutral': 0}
            
            monthly_data[month][review['sentiment']] += 1
        
        # Convert to sorted list
        trend_data = [
            {'month': month, **counts}
            for month, counts in sorted(monthly_data.items())
        ]
        
        return jsonify(trend_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/category-breakdown', methods=['GET'])
def get_category_breakdown():
    """Get sentiment breakdown by category"""
    try:
        data = load_data()
        reviews = data['reviews']
        
        # Group by category
        category_data = {}
        for review in reviews:
            category = review['category']
            if category not in category_data:
                category_data[category] = {'positive': 0, 'negative': 0}
            
            if review['sentiment'] == 'positive':
                category_data[category]['positive'] += 1
            else:
                category_data[category]['negative'] += 1
        
        # Convert to list
        breakdown = [
            {'name': category, **counts}
            for category, counts in category_data.items()
        ]
        
        return jsonify(breakdown)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dish-insights', methods=['GET'])
def get_dish_insights():
    """Get sentiment breakdown for specific dishes and aspects"""
    try:
        restaurant = request.args.get('restaurant')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        data = load_data()
        reviews = data['reviews']
        
        # Predefined mapping of categories/dishes to scan
        DISHES_AND_ASPECTS = {
            'Pasta & Lasagna': ['pasta', 'lasagna', 'spaghetti', 'truffle pasta', 'ravioli', 'macaroni'],
            'Steak & Beef': ['steak', 'beef', 'ribeye', 'sirloin', 'fillet'],
            'Seafood & Lobster': ['lobster', 'bisque', 'seafood', 'crab', 'fish', 'oysters', 'sushi'],
            'Indian Cuisine': ['chicken', 'tikka', 'vindaloo', 'curry', 'samosa', 'naan', 'indian'],
            'Coffee & Pastries': ['coffee', 'pastry', 'pastries', 'cappuccino', 'latte', 'espresso'],
            'Service Quality': ['service', 'waiter', 'waitress', 'staff', 'server', 'reservation'],
            'Ambiance & Music': ['ambiance', 'atmosphere', 'decor', 'noise', 'view', 'music'],
            'Value & Pricing': ['price', 'overpriced', 'value', 'expensive', 'cost', 'bill'],
            'Hygiene Standards': ['hygiene', 'dirty', 'hair', 'cleanliness', 'clean']
        }
        
        # Initialize insights structure
        insights = {}
        for name in DISHES_AND_ASPECTS:
            insights[name] = {'positive': 0, 'negative': 0, 'neutral': 0}
            
        for r in reviews:
            # Filter by restaurant if provided
            if restaurant and r.get('restaurantName') != restaurant:
                continue
                
            # Filter by date if provided
            review_date = r.get('date', '')
            if start_date and review_date < start_date:
                continue
            if end_date and review_date > end_date:
                continue
                
            text_lower = r.get('text', '').lower()
            sentiment = r.get('sentiment', 'neutral')
            if sentiment not in ['positive', 'negative', 'neutral']:
                sentiment = 'neutral'
                
            # Check keywords for each group
            for group_name, keywords in DISHES_AND_ASPECTS.items():
                matched = False
                for kw in keywords:
                    if kw in text_lower:
                        matched = True
                        break
                if matched:
                    insights[group_name][sentiment] += 1
                    
        # Format response
        result = []
        for name, counts in insights.items():
            total = counts['positive'] + counts['negative'] + counts['neutral']
            if total > 0:
                result.append({
                    'name': name,
                    'count': total,
                    'sentiment': counts
                })
                
        # Sort by total mentions descending
        result.sort(key=lambda x: x['count'], reverse=True)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews/<review_id>', methods=['DELETE'])
def delete_review(review_id):
    """Delete a review"""
    try:
        db_data = load_data()
        if review_id not in [r['id'] for r in db_data['reviews']]:
            return jsonify({'error': 'Review not found'}), 404
            
        delete_review_db(review_id)
        return jsonify({'message': 'Review deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting server on http://localhost:5000")
    app.run(debug=True, port=5000)
