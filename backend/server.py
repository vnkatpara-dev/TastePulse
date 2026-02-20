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

# Load model and vectorizer
MODEL_PATH = os.path.join(os.path.dirname(__file__), "restaurant_sentiment_model.pkl")
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), "tfidf_vectorizer.pkl")
DATA_PATH = os.path.join(os.path.dirname(__file__), "reviews.json")

# Load model and vectorizer at startup
print("Loading model and vectorizer...")
model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)
print("Model loaded successfully!")

# Initialize data file if it doesn't exist
if not os.path.exists(DATA_PATH):
    initial_data = {
        "reviews": [
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
        ],
        "restaurants": [
            {"id": "1", "name": "The Golden Fork", "cuisine": "Italian", "averageRating": 3.8, "totalReviews": 234},
            {"id": "2", "name": "Spice Route", "cuisine": "Indian", "averageRating": 4.1, "totalReviews": 189},
            {"id": "3", "name": "Ocean Breeze", "cuisine": "Seafood", "averageRating": 4.3, "totalReviews": 156}
        ]
    }
    with open(DATA_PATH, 'w') as f:
        json.dump(initial_data, f, indent=2)

def load_data():
    """Load data from JSON file"""
    with open(DATA_PATH, 'r') as f:
        return json.load(f)

def save_data(data):
    """Save data to JSON file"""
    with open(DATA_PATH, 'w') as f:
        json.dump(data, f, indent=2)

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
        
        # Transform text and predict
        text_vector = vectorizer.transform([text])
        prediction = model.predict(text_vector)[0]
        
        # Get decision function score for confidence
        decision_score = model.decision_function(text_vector)[0]
        
        # Normalize to 0-1 range using sigmoid-like transformation
        confidence = 1 / (1 + abs(decision_score))
        
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
    """Get all reviews"""
    try:
        data = load_data()
        return jsonify(data['reviews'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews/<restaurant_name>', methods=['GET'])
def get_reviews_by_restaurant(restaurant_name):
    """Get reviews for a specific restaurant"""
    try:
        data = load_data()
        reviews = [r for r in data['reviews'] if r['restaurantName'] == restaurant_name]
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
        text_vector = vectorizer.transform([text])
        prediction = model.predict(text_vector)[0]
        
        decision_score = model.decision_function(text_vector)[0]
        confidence = 1 / (1 + abs(decision_score))
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
        
        # Load existing data and add review
        db_data = load_data()
        db_data['reviews'].append(review)
        save_data(db_data)
        
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

if __name__ == '__main__':
    print("Starting server on http://localhost:5000")
    app.run(debug=True, port=5000)
