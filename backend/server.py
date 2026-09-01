from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import json
from datetime import datetime, timezone
import uuid
import math

from auth_middleware import (
    firebase_initialized,
    require_auth,
    require_role,
    set_user_role_claim,
    verify_firebase_token,
    get_token_from_header
)
import firebase_admin
from firebase_admin import firestore, auth as admin_auth, app_check

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Flask-Limiter for rate limiting public inference and APIs (Phase 6)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://"
)

# Initialize Firestore client if Firebase is active
db = None
if firebase_initialized:
    try:
        db = firestore.client()
        print("Firestore client initialized successfully!")
    except Exception as e:
        print(f"Could not initialize Firestore client: {e}")
        db = None

# Load ML model and vectorizer
MODEL_PATH = os.path.join(os.path.dirname(__file__), "restaurant_sentiment_model.pkl")
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), "tfidf_vectorizer.pkl")

model = None
vectorizer = None

try:
    print("Loading model and vectorizer...")
    import joblib
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Could not load ML model: {e}")
    print("Using fallback rule-based sentiment classifier")
    model = None
    vectorizer = None


# ─── PHASE 5: Refined Fallback Sentiment Classifier ────────────────────────────

def simple_sentiment(text):
    """
    Refined rule-based sentiment classifier (Phase 5).
    - Removed 'okay', 'decent', 'difficult', 'waited', 'lost' from negative list
      (these are neutral or context-dependent).
    - Requires at least 2 keyword matches or a net score >= 2 to classify as
      strongly positive/negative, reducing false positives on ambiguous text.
    """
    text_lower = text.lower()
    
    pos_words = [
        "good", "great", "excellent", "amazing", "love", "delicious",
        "friendly", "awesome", "best", "nice", "fantastic", "wonderful",
        "perfect", "stunning", "phenomenal", "impressive", "warm",
        "welcoming", "fresh", "divine", "outstanding", "superb", "tasty"
    ]
    
    # Cleaned negative list: removed 'okay', 'decent', 'difficult', 'waited', 'lost'
    neg_words = [
        "bad", "terrible", "awful", "hate", "horrible", "rude",
        "slow", "worst", "poor", "disgusting", "dirty", "cold",
        "overpriced", "dismissive", "hair", "undercooked", "stale"
    ]
    
    pos_count = sum(1 for word in pos_words if word in text_lower)
    neg_count = sum(1 for word in neg_words if word in text_lower)
    
    # Net keyword differential requirement
    net_score = pos_count - neg_count
    
    if pos_count >= 2 and net_score >= 1:
        return "positive"
    elif neg_count >= 2 and net_score <= -1:
        return "negative"
    elif pos_count == 1 and neg_count == 0:
        return "positive"
    elif neg_count == 1 and pos_count == 0:
        return "negative"
    
    return "neutral"


def calculate_sentiment_score(prediction, confidence=0.8):
    """Convert sentiment prediction to a normalized score between 0 and 1"""
    if prediction == "positive":
        return round(0.5 + (confidence * 0.5), 2)
    elif prediction == "negative":
        return round(0.5 - (confidence * 0.5), 2)
    else:
        return 0.5


def serialize_doc(doc_dict):
    """Serialize Firestore document dictionary, converting timestamps to ISO strings"""
    if not isinstance(doc_dict, dict):
        return doc_dict
    result = {}
    for k, v in doc_dict.items():
        if isinstance(v, datetime):
            result[k] = v.isoformat()
        elif hasattr(v, 'isoformat'):
            result[k] = v.isoformat()
        else:
            result[k] = v
    # Ensure date string exists for frontend compatibility
    if 'createdAt' in result and 'date' not in result:
        created_str = str(result['createdAt'])
        result['date'] = created_str[:10]
    return result


FALLBACK_RESTAURANTS = [
    {"id": "1", "name": "The Golden Fork", "cuisine": "Italian", "averageRating": 4.2, "totalReviews": 5, "ownerUid": "demo_owner_1"},
    {"id": "2", "name": "Spice Route", "cuisine": "Indian", "averageRating": 4.1, "totalReviews": 4, "ownerUid": "demo_owner_2"},
    {"id": "3", "name": "Ocean Breeze", "cuisine": "Seafood", "averageRating": 4.4, "totalReviews": 3, "ownerUid": "demo_owner_3"},
    {"id": "burger-shack-id", "name": "Burger Shack", "cuisine": "Fast Food", "averageRating": 3.8, "totalReviews": 2, "ownerUid": "demo_owner_4"},
    {"id": "sakura-sushi-id", "name": "Sakura Sushi", "cuisine": "Japanese", "averageRating": 4.6, "totalReviews": 2, "ownerUid": "demo_owner_5"}
]

FALLBACK_REVIEWS = [
    {"id": "seed-1", "restaurantId": "1", "restaurantName": "The Golden Fork", "customerName": "Alice M.", "rating": 5, "text": "Absolutely stunning food and ambiance. The truffle pasta was divine!", "sentiment": "positive", "sentimentScore": 0.95, "date": "2026-02-18", "category": "Food Quality"},
    {"id": "seed-2", "restaurantId": "1", "restaurantName": "The Golden Fork", "customerName": "Bob T.", "rating": 2, "text": "Service was incredibly slow. Waited 45 minutes for appetizers.", "sentiment": "negative", "sentimentScore": 0.15, "date": "2026-02-17", "category": "Service"},
    {"id": "seed-3", "restaurantId": "1", "restaurantName": "The Golden Fork", "customerName": "Carol S.", "rating": 4, "text": "Great food but the noise level made conversation difficult.", "sentiment": "neutral", "sentimentScore": 0.6, "date": "2026-02-16", "category": "Ambiance"},
    {"id": "seed-4", "restaurantId": "1", "restaurantName": "The Golden Fork", "customerName": "Frank H.", "rating": 4, "text": "Lovely date night spot. Wine selection is impressive.", "sentiment": "positive", "sentimentScore": 0.82, "date": "2026-02-13", "category": "Ambiance"},
    {"id": "seed-5", "restaurantId": "1", "restaurantName": "The Golden Fork", "customerName": "Jack R.", "rating": 4, "text": "Rich flavorful lasagna and delicious dessert.", "sentiment": "positive", "sentimentScore": 0.88, "date": "2026-02-09", "category": "Food Quality"},
    {"id": "seed-6", "restaurantId": "2", "restaurantName": "Spice Route", "customerName": "David L.", "rating": 5, "text": "Best Indian food I've had! The butter chicken is phenomenal.", "sentiment": "positive", "sentimentScore": 0.92, "date": "2026-02-15", "category": "Food Quality"},
    {"id": "seed-7", "restaurantId": "2", "restaurantName": "Spice Route", "customerName": "Irene D.", "rating": 4, "text": "Warm and welcoming staff. The naan bread was perfectly crispy.", "sentiment": "positive", "sentimentScore": 0.85, "date": "2026-02-10", "category": "Service"},
    {"id": "seed-8", "restaurantId": "2", "restaurantName": "Spice Route", "customerName": "Leo M.", "rating": 3, "text": "Decent curry but nothing extraordinary given the hype.", "sentiment": "neutral", "sentimentScore": 0.5, "date": "2026-02-07", "category": "Food Quality"},
    {"id": "seed-9", "restaurantId": "2", "restaurantName": "Spice Route", "customerName": "Priya S.", "rating": 5, "text": "Authentic spice blends and quick hospitable service.", "sentiment": "positive", "sentimentScore": 0.94, "date": "2026-02-05", "category": "Food Quality"},
    {"id": "seed-10", "restaurantId": "3", "restaurantName": "Ocean Breeze", "customerName": "Grace K.", "rating": 5, "text": "The freshest seafood in town. Lobster bisque was out of this world!", "sentiment": "positive", "sentimentScore": 0.97, "date": "2026-02-12", "category": "Food Quality"},
    {"id": "seed-11", "restaurantId": "3", "restaurantName": "Ocean Breeze", "customerName": "Henry P.", "rating": 3, "text": "Food was okay but slightly overpriced for the portion size.", "sentiment": "neutral", "sentimentScore": 0.45, "date": "2026-02-11", "category": "Value"},
    {"id": "seed-12", "restaurantId": "3", "restaurantName": "Ocean Breeze", "customerName": "Karen B.", "rating": 5, "text": "The sunset view paired with amazing fresh oysters. Unforgettable experience!", "sentiment": "positive", "sentimentScore": 0.94, "date": "2026-02-08", "category": "Ambiance"},
    {"id": "seed-13", "restaurantId": "burger-shack-id", "restaurantName": "Burger Shack", "customerName": "Tom C.", "rating": 5, "text": "Juicy smash burgers, hot crispy fries, and excellent milkshakes!", "sentiment": "positive", "sentimentScore": 0.91, "date": "2026-02-14", "category": "Food Quality"},
    {"id": "seed-14", "restaurantId": "burger-shack-id", "restaurantName": "Burger Shack", "customerName": "Sam W.", "rating": 2, "text": "Buns were cold and burger was overcooked. Disappointing visit.", "sentiment": "negative", "sentimentScore": 0.18, "date": "2026-02-02", "category": "Food Quality"},
    {"id": "seed-15", "restaurantId": "sakura-sushi-id", "restaurantName": "Sakura Sushi", "customerName": "Yuki T.", "rating": 5, "text": "Mastercrafted sashimi and fresh nigiri with impeccable presentation.", "sentiment": "positive", "sentimentScore": 0.96, "date": "2026-02-18", "category": "Food Quality"},
    {"id": "seed-16", "restaurantId": "sakura-sushi-id", "restaurantName": "Sakura Sushi", "customerName": "Rachel G.", "rating": 5, "text": "Great dining atmosphere, polite servers, and delicious dragon rolls.", "sentiment": "positive", "sentimentScore": 0.93, "date": "2026-02-15", "category": "Service"}
]

def seed_firestore_if_empty():
    """Seed initial demo restaurants if Firestore collection is empty"""
    if db is None:
        return
    try:
        docs = list(db.collection('restaurants').limit(1).stream())
        if len(docs) == 0:
            print("Seeding initial Firestore demo restaurants...")
            for r in FALLBACK_RESTAURANTS:
                db.collection('restaurants').document(r['id']).set({**r, 'createdAt': firestore.SERVER_TIMESTAMP})
            print("Seeded Firestore demo restaurants successfully.")
    except Exception as e:
        print(f"Error seeding Firestore: {e}")

if db is not None:
    seed_firestore_if_empty()


# ─── PHASE 1: User Sync & Role Management Endpoints ──────────────────────────

@app.route('/api/auth/sync-user', methods=['POST'])
@require_auth
def sync_user():
    """
    Sync user document in Firestore and set custom claims (role='customer' or requested initial role)
    if not already assigned.
    """
    try:
        uid = request.uid
        email = request.email
        data = request.get_json(silent=True) or {}
        display_name = data.get('displayName', '')
        requested_role = data.get('requestedRole')

        # Check existing custom claims on Firebase user
        user_record = admin_auth.get_user(uid)
        current_claims = user_record.custom_claims or {}
        role = current_claims.get('role')

        if not role:
            # If user requested owner upon signup (e.g. from owner portal) or customer
            role = requested_role if requested_role in ['owner', 'customer'] else 'customer'
            admin_auth.set_custom_user_claims(uid, {'role': role})

        if db is not None:
            user_ref = db.collection('users').document(uid)
            user_doc = user_ref.get()
            if not user_doc.exists:
                user_ref.set({
                    'uid': uid,
                    'email': email,
                    'displayName': display_name,
                    'role': role,
                    'createdAt': firestore.SERVER_TIMESTAMP
                })
            else:
                user_ref.update({
                    'role': role,
                    'email': email,
                    'displayName': display_name or user_doc.to_dict().get('displayName', '')
                })

        return jsonify({
            'uid': uid,
            'email': email,
            'role': role,
            'displayName': display_name
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/set-role', methods=['POST'])
def set_role_admin():
    """
    Trusted server-side role upgrade endpoint.
    Requires ADMIN_API_KEY header or authenticated admin caller.
    Never accepts untrusted client claims.
    """
    try:
        admin_key = request.headers.get('X-Admin-Key')
        expected_key = os.environ.get('ADMIN_API_KEY', 'tastepulse-secure-admin-key')
        
        is_authorized_admin = False
        if admin_key and admin_key == expected_key:
            is_authorized_admin = True
        else:
            token = get_token_from_header()
            if token:
                decoded = verify_firebase_token(token)
                if decoded and decoded.get('admin') is True:
                    is_authorized_admin = True

        if not is_authorized_admin:
            return jsonify({'error': 'Unauthorized: Admin authentication required to set user roles'}), 403

        data = request.get_json() or {}
        target_uid = data.get('uid')
        new_role = data.get('role')

        if not target_uid or new_role not in ['customer', 'owner', 'admin']:
            return jsonify({'error': 'Invalid uid or role. Role must be customer, owner, or admin.'}), 400

        set_user_role_claim(target_uid, new_role)
        return jsonify({
            'success': True,
            'message': f'Role for user {target_uid} set to {new_role}',
            'uid': target_uid,
            'role': new_role
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── PHASE 6: Rate Limited Public Sentiment Inference ─────────────────────────

@app.route('/api/predict', methods=['POST'])
@limiter.limit("30 per minute; 500 per day")
def predict_sentiment():
    """
    Public inference endpoint rate limited via Flask-Limiter.
    Optionally verifies Firebase App Check token if header present.
    """
    try:
        # Optional Firebase App Check verification
        app_check_token = request.headers.get('X-Firebase-AppCheck')
        if app_check_token and firebase_initialized:
            try:
                app_check.verify_token(app_check_token)
            except Exception as ac_err:
                return jsonify({'error': f'Invalid App Check token: {ac_err}'}), 401

        data = request.get_json(silent=True) or {}
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'Text is required'}), 400

        if model is not None and vectorizer is not None:
            text_vector = vectorizer.transform([text])
            prediction = model.predict(text_vector)[0]
            decision_score = model.decision_function(text_vector)[0]
            confidence = 1 / (1 + abs(decision_score))
            sentiment_score = calculate_sentiment_score(prediction, confidence)
        else:
            prediction = simple_sentiment(text)
            confidence = 0.75 if prediction != "neutral" else 0.5
            sentiment_score = calculate_sentiment_score(prediction, confidence)

        return jsonify({
            'sentiment': prediction,
            'sentimentScore': sentiment_score,
            'confidence': confidence
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── PHASE 2 & 4: Paginated Reviews with Duplicate & Concurrency Guards ───────

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    """
    Get reviews from Firestore with query cursor pagination and date filtering (Phase 4).
    """
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        limit_param = min(int(request.args.get('limit', 20)), 100)
        start_after_doc_id = request.args.get('startAfter')
        restaurant_id = request.args.get('restaurantId')
        restaurant_name = request.args.get('restaurantName')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')

        query = db.collection('reviews')

        if restaurant_id:
            query = query.where('restaurantId', '==', restaurant_id)
        elif restaurant_name:
            query = query.where('restaurantName', '==', restaurant_name)

        query = query.order_by('createdAt', direction=firestore.Query.DESCENDING)

        if start_after_doc_id:
            cursor_doc = db.collection('reviews').document(start_after_doc_id).get()
            if cursor_doc.exists:
                query = query.start_after(cursor_doc)

        query = query.limit(limit_param)
        docs = list(query.stream())

        reviews = []
        for doc in docs:
            r = serialize_doc(doc.to_dict())
            r['id'] = doc.id
            
            # Apply date filter if provided
            rev_date = r.get('date', '')
            if start_date and rev_date < start_date:
                continue
            if end_date and rev_date > end_date:
                continue
            reviews.append(r)

        return jsonify(reviews), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reviews/<restaurant_name>', methods=['GET'])
def get_reviews_by_restaurant(restaurant_name):
    """Get reviews for a specific restaurant name with pagination"""
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        limit_param = min(int(request.args.get('limit', 50)), 100)
        query = db.collection('reviews').where('restaurantName', '==', restaurant_name)
        query = query.order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit_param)
        
        docs = query.stream()
        reviews = []
        for doc in docs:
            r = serialize_doc(doc.to_dict())
            r['id'] = doc.id
            reviews.append(r)

        return jsonify(reviews), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reviews', methods=['POST'])
@require_auth
def add_review():
    """
    Add a new review to Firestore (Phase 2 & 5).
    - Requires authenticated user; authorUid is bound to request.uid.
    - Duplicate Guard: Rejects if authorUid has already reviewed this restaurant.
    - Transactional: Atomically updates the restaurant's totalReviews and averageRating.
    """
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        data = request.get_json() or {}
        required_fields = ['restaurantName', 'rating', 'text', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        author_uid = request.uid
        customer_name = data.get('customerName') or request.user.get('name') or request.email.split('@')[0] or 'Diner'
        restaurant_name = data['restaurantName']
        restaurant_id = data.get('restaurantId')
        rating = float(data['rating'])
        text = data['text']
        category = data['category']

        if rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400

        # Find matching restaurant if restaurantId not explicitly passed
        restaurant_ref = None
        if restaurant_id:
            restaurant_ref = db.collection('restaurants').document(restaurant_id)
        else:
            r_docs = list(db.collection('restaurants').where('name', '==', restaurant_name).limit(1).stream())
            if r_docs:
                restaurant_ref = r_docs[0].reference
                restaurant_id = r_docs[0].id

        # PHASE 5: Duplicate-review guard
        # Query whether authorUid already reviewed this restaurant
        dup_query = db.collection('reviews').where('authorUid', '==', author_uid)
        if restaurant_id:
            dup_query = dup_query.where('restaurantId', '==', restaurant_id)
        else:
            dup_query = dup_query.where('restaurantName', '==', restaurant_name)
        
        existing_reviews = list(dup_query.limit(1).stream())
        if len(existing_reviews) > 0:
            return jsonify({
                'error': 'You have already reviewed this restaurant. Duplicate reviews are not permitted.',
                'code': 'DUPLICATE_REVIEW'
            }), 409

        # Sentiment Analysis
        if model is not None and vectorizer is not None:
            text_vector = vectorizer.transform([text])
            prediction = model.predict(text_vector)[0]
            decision_score = model.decision_function(text_vector)[0]
            confidence = 1 / (1 + abs(decision_score))
            sentiment_score = calculate_sentiment_score(prediction, confidence)
        else:
            prediction = simple_sentiment(text)
            confidence = 0.75 if prediction != "neutral" else 0.5
            sentiment_score = calculate_sentiment_score(prediction, confidence)

        review_id = str(uuid.uuid4())
        review_doc_ref = db.collection('reviews').document(review_id)
        
        review_data = {
            'id': review_id,
            'restaurantId': restaurant_id or '',
            'restaurantName': restaurant_name,
            'authorUid': author_uid,
            'customerName': customer_name,
            'rating': rating,
            'text': text,
            'category': category,
            'sentiment': prediction,
            'sentimentScore': sentiment_score,
            'confidence': confidence,
            'createdAt': firestore.SERVER_TIMESTAMP
        }

        # Atomic Firestore Transaction to update aggregate stats safely
        @firestore.transactional
        def create_review_and_update_aggregate(transaction):
            if restaurant_ref is not None:
                r_snapshot = restaurant_ref.get(transaction=transaction)
                if r_snapshot.exists:
                    r_data = r_snapshot.to_dict()
                    current_total = r_data.get('totalReviews', 0)
                    current_sum = r_data.get('ratingSum', r_data.get('averageRating', 0.0) * current_total)
                    new_total = current_total + 1
                    new_sum = round(current_sum + rating, 2)
                    new_avg = round(new_sum / new_total, 2)
                    transaction.update(restaurant_ref, {
                        'totalReviews': new_total,
                        'ratingSum': new_sum,
                        'averageRating': new_avg
                    })
            transaction.set(review_doc_ref, review_data)

        transaction = db.transaction()
        create_review_and_update_aggregate(transaction)

        # Return serialized review for immediate frontend display
        response_review = serialize_doc({**review_data, 'createdAt': datetime.now(timezone.utc)})
        return jsonify(response_review), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reviews/<review_id>', methods=['DELETE'])
@require_auth
def delete_review(review_id):
    """
    Delete a review (Phase 3 IDOR Protection).
    Only the review's authorUid OR a verified restaurant owner can delete.
    """
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        review_ref = db.collection('reviews').document(review_id)
        review_doc = review_ref.get()

        if not review_doc.exists:
            return jsonify({'error': 'Review not found'}), 404

        review_data = review_doc.to_dict()
        author_uid = review_data.get('authorUid')
        caller_uid = request.uid
        caller_role = request.role

        # IDOR Authorization check
        if author_uid != caller_uid and caller_role != 'owner':
            return jsonify({
                'error': 'Forbidden: You do not have permission to delete this review',
                'code': 'IDOR_PREVENTED'
            }), 403

        # Transactional delete with aggregate decrement
        restaurant_id = review_data.get('restaurantId')
        rating = review_data.get('rating', 0)

        @firestore.transactional
        def delete_and_decrement(transaction):
            if restaurant_id:
                r_ref = db.collection('restaurants').document(restaurant_id)
                r_snap = r_ref.get(transaction=transaction)
                if r_snap.exists:
                    r_data = r_snap.to_dict()
                    curr_total = r_data.get('totalReviews', 0)
                    curr_sum = r_data.get('ratingSum', r_data.get('averageRating', 0.0) * curr_total)
                    if curr_total > 1:
                        new_total = curr_total - 1
                        new_sum = max(0.0, round(curr_sum - rating, 2))
                        new_avg = round(new_sum / new_total, 2)
                    else:
                        new_total = 0
                        new_sum = 0.0
                        new_avg = 0.0
                    transaction.update(r_ref, {
                        'totalReviews': new_total,
                        'ratingSum': new_sum,
                        'averageRating': new_avg
                    })
            transaction.delete(review_ref)

        transaction = db.transaction()
        delete_and_decrement(transaction)

        return jsonify({'message': 'Review deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reviews/<review_id>', methods=['PUT', 'PATCH'])
def update_review(review_id):
    """
    Phase 5: Reviews are immutable once created.
    """
    return jsonify({
        'error': 'Reviews are immutable once created. In-place updates are not permitted.',
        'code': 'REVIEW_IMMUTABLE'
    }), 405


@app.route('/api/reviews/<review_id>/reply', methods=['POST'])
@require_role('owner')
def reply_to_review(review_id):
    """Add owner reply to a review"""
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        data = request.get_json() or {}
        reply = data.get('reply', '')
        if not reply:
            return jsonify({'error': 'Reply text is required'}), 400

        review_ref = db.collection('reviews').document(review_id)
        review_doc = review_ref.get()
        if not review_doc.exists:
            return jsonify({'error': 'Review not found'}), 404

        review_ref.update({
            'ownerReply': reply,
            'ownerReplyDate': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            'ownerUid': request.uid
        })
        return jsonify({'message': 'Reply added successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── PHASE 2 & 3: Restaurants with Ownership & IDOR Protection ────────────────

@app.route('/api/restaurants', methods=['GET'])
def get_restaurants():
    """
    Get restaurants from Firestore (Phase 2 & 4).
    If owner is logged in, optionally filter to their owned restaurants.
    """
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        token = get_token_from_header()
        owner_uid = None
        if token:
            decoded = verify_firebase_token(token)
            if decoded and decoded.get('role') == 'owner':
                owner_uid = decoded.get('uid')

        limit_param = min(int(request.args.get('limit', 50)), 100)
        query = db.collection('restaurants').limit(limit_param)
        
        # If requesting owner's view, filter by ownerUid
        if owner_uid and request.args.get('myRestaurants') == 'true':
            query = query.where('ownerUid', '==', owner_uid)

        docs = list(query.stream())
        restaurants = []
        for doc in docs:
            r = serialize_doc(doc.to_dict())
            r['id'] = doc.id
            restaurants.append(r)

        # Compute sentiment summary for each restaurant
        for restaurant in restaurants:
            r_name = restaurant.get('name', '')
            rev_docs = list(db.collection('reviews').where('restaurantName', '==', r_name).stream())
            total = len(rev_docs)
            if total > 0:
                pos = sum(1 for d in rev_docs if d.to_dict().get('sentiment') == 'positive')
                neg = sum(1 for d in rev_docs if d.to_dict().get('sentiment') == 'negative')
                neu = sum(1 for d in rev_docs if d.to_dict().get('sentiment') == 'neutral')
                avg_rat = sum(d.to_dict().get('rating', 0) for d in rev_docs) / total
                restaurant['sentimentSummary'] = {
                    'positive': pos,
                    'negative': neg,
                    'neutral': neu,
                    'total': total,
                    'averageRating': round(avg_rat, 1)
                }
            else:
                restaurant['sentimentSummary'] = {
                    'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0, 'averageRating': 0
                }

        return jsonify(restaurants), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/restaurants', methods=['POST'])
@require_role('owner')
def add_restaurant():
    """
    Create a new restaurant in Firestore.
    OwnerUid is strictly bound to request.uid from verified custom claim.
    """
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        data = request.get_json() or {}
        required_fields = ['name', 'cuisine']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        restaurant_id = str(uuid.uuid4())
        restaurant = {
            'id': restaurant_id,
            'name': data['name'],
            'cuisine': data['cuisine'],
            'averageRating': 0.0,
            'totalReviews': 0,
            'ownerUid': request.uid,
            'ownerEmail': request.email,
            'createdAt': firestore.SERVER_TIMESTAMP
        }

        db.collection('restaurants').document(restaurant_id).set(restaurant)

        response_restaurant = serialize_doc({**restaurant, 'createdAt': datetime.now(timezone.utc)})
        return jsonify(response_restaurant), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/restaurants/<restaurant_id>', methods=['PUT'])
@require_role('owner')
def update_restaurant(restaurant_id):
    """
    Update a restaurant (Phase 3 IDOR Protection).
    Verifies caller is the ownerUid of the restaurant before updating.
    """
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        data = request.get_json() or {}
        restaurant_ref = db.collection('restaurants').document(restaurant_id)
        doc = restaurant_ref.get()

        if not doc.exists:
            return jsonify({'error': 'Restaurant not found'}), 404

        restaurant_data = doc.to_dict()
        
        # IDOR Guard: Verify ownership
        if restaurant_data.get('ownerUid') != request.uid:
            return jsonify({
                'error': 'Forbidden: You do not own this restaurant',
                'code': 'IDOR_PREVENTED'
            }), 403

        updated_fields = {}
        if 'name' in data:
            updated_fields['name'] = data['name']
        if 'cuisine' in data:
            updated_fields['cuisine'] = data['cuisine']

        if updated_fields:
            restaurant_ref.update(updated_fields)

        return jsonify({'message': 'Restaurant updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/restaurants/<restaurant_id>', methods=['DELETE'])
@require_role('owner')
def delete_restaurant(restaurant_id):
    """
    Delete a restaurant (Phase 3 IDOR Protection).
    Verifies caller is the ownerUid of the restaurant before deleting.
    """
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        restaurant_ref = db.collection('restaurants').document(restaurant_id)
        doc = restaurant_ref.get()

        if not doc.exists:
            return jsonify({'error': 'Restaurant not found'}), 404

        restaurant_data = doc.to_dict()
        
        # IDOR Guard: Verify ownership
        if restaurant_data.get('ownerUid') != request.uid:
            return jsonify({
                'error': 'Forbidden: You do not own this restaurant',
                'code': 'IDOR_PREVENTED'
            }), 403

        # Delete restaurant and its reviews
        restaurant_name = restaurant_data.get('name')
        restaurant_ref.delete()

        if restaurant_name:
            rev_docs = db.collection('reviews').where('restaurantName', '==', restaurant_name).stream()
            for r_doc in rev_docs:
                r_doc.reference.delete()

        return jsonify({'message': 'Restaurant deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── Analytics & Advanced AI Insights ─────────────────────────────────────────

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get overall analytics data from Firestore"""
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        reviews_docs = list(db.collection('reviews').stream())
        reviews = [d.to_dict() for d in reviews_docs]

        total_reviews = len(reviews)
        positive = len([r for r in reviews if r.get('sentiment') == 'positive'])
        negative = len([r for r in reviews if r.get('sentiment') == 'negative'])
        neutral = len([r for r in reviews if r.get('sentiment') == 'neutral'])
        avg_rating = sum([r.get('rating', 0) for r in reviews]) / total_reviews if total_reviews > 0 else 0

        return jsonify({
            'totalReviews': total_reviews,
            'positive': positive,
            'negative': negative,
            'neutral': neutral,
            'positivePercent': round((positive / total_reviews) * 100, 1) if total_reviews > 0 else 0,
            'negativePercent': round((negative / total_reviews) * 100, 1) if total_reviews > 0 else 0,
            'averageRating': round(avg_rating, 1)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sentiment-trend', methods=['GET'])
def get_sentiment_trend():
    """Get sentiment trend over time from Firestore"""
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        reviews_docs = list(db.collection('reviews').stream())
        monthly_data = {}

        for doc in reviews_docs:
            r = serialize_doc(doc.to_dict())
            date_str = r.get('date', '')
            if len(date_str) >= 7:
                month = date_str[:7]
            else:
                month = '2026-02'

            if month not in monthly_data:
                monthly_data[month] = {'positive': 0, 'negative': 0, 'neutral': 0}

            sentiment = r.get('sentiment', 'neutral')
            if sentiment in monthly_data[month]:
                monthly_data[month][sentiment] += 1

        trend_data = [
            {'month': month, **counts}
            for month, counts in sorted(monthly_data.items())
        ]
        return jsonify(trend_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/category-breakdown', methods=['GET'])
def get_category_breakdown():
    """Get sentiment breakdown by category"""
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        reviews_docs = list(db.collection('reviews').stream())
        category_data = {}

        for doc in reviews_docs:
            r = doc.to_dict()
            category = r.get('category', 'General')
            if category not in category_data:
                category_data[category] = {'positive': 0, 'negative': 0}

            if r.get('sentiment') == 'positive':
                category_data[category]['positive'] += 1
            else:
                category_data[category]['negative'] += 1

        breakdown = [
            {'name': category, **counts}
            for category, counts in category_data.items()
        ]
        return jsonify(breakdown), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/dish-insights', methods=['GET'])
def get_dish_insights():
    """Get sentiment breakdown for specific dishes and aspects"""
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        restaurant = request.args.get('restaurant')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')

        query = db.collection('reviews')
        if restaurant:
            query = query.where('restaurantName', '==', restaurant)

        reviews_docs = list(query.stream())

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

        insights = {name: {'positive': 0, 'negative': 0, 'neutral': 0} for name in DISHES_AND_ASPECTS}

        for doc in reviews_docs:
            r = serialize_doc(doc.to_dict())
            rev_date = r.get('date', '')
            if start_date and rev_date < start_date:
                continue
            if end_date and rev_date > end_date:
                continue

            text_lower = r.get('text', '').lower()
            sentiment = r.get('sentiment', 'neutral')
            if sentiment not in ['positive', 'negative', 'neutral']:
                sentiment = 'neutral'

            for group_name, keywords in DISHES_AND_ASPECTS.items():
                if any(kw in text_lower for kw in keywords):
                    insights[group_name][sentiment] += 1

        result = []
        for name, counts in insights.items():
            total = counts['positive'] + counts['negative'] + counts['neutral']
            if total > 0:
                result.append({
                    'name': name,
                    'count': total,
                    'sentiment': counts
                })

        result.sort(key=lambda x: x['count'], reverse=True)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/churn-risk', methods=['GET'])
def get_churn_risk():
    """Predictive Churn Warning"""
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        restaurant = request.args.get('restaurant')
        query = db.collection('reviews')
        if restaurant:
            query = query.where('restaurantName', '==', restaurant)

        reviews_docs = list(query.stream())
        customers = {}
        for doc in reviews_docs:
            r = serialize_doc(doc.to_dict())
            name = r.get('customerName', 'Unknown')
            if name not in customers:
                customers[name] = []
            customers[name].append(r)

        today = datetime.now().date()
        results = []

        for name, cust_reviews in customers.items():
            sorted_reviews = sorted(cust_reviews, key=lambda x: x.get('date', ''), reverse=True)
            latest = sorted_reviews[0]

            try:
                last_date = datetime.strptime(latest.get('date', '2026-01-01')[:10], '%Y-%m-%d').date()
                days_ago = (today - last_date).days
            except Exception:
                days_ago = 999

            if days_ago < 10:
                continue

            last_rating = latest.get('rating', 3)
            last_sentiment = latest.get('sentiment', 'neutral')

            base_score = (5 - last_rating) * 15
            if last_sentiment == 'negative':
                base_score += 25
            elif last_sentiment == 'neutral':
                base_score += 10

            recency_multiplier = min(1.0 + math.log(days_ago / 30 + 1) * 0.5, 2.0)
            score = base_score * recency_multiplier
            prior_positives = sum(1 for r in sorted_reviews[1:] if r.get('sentiment') == 'positive')
            score = max(0, min(100, round(score - min(prior_positives * 5, 20))))

            if score >= 65:
                risk_level = 'high'
            elif score >= 35:
                risk_level = 'medium'
            else:
                risk_level = 'low'

            results.append({
                'customerName': name,
                'lastVisit': latest.get('date', ''),
                'lastRating': last_rating,
                'lastSentiment': last_sentiment,
                'lastReviewText': latest.get('text', ''),
                'churnScore': score,
                'riskLevel': risk_level,
                'daysSinceVisit': days_ago,
                'totalReviews': len(sorted_reviews),
                'priorPositives': prior_positives
            })

        results.sort(key=lambda x: x['churnScore'], reverse=True)
        return jsonify(results[:20]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/menu-lifecycle', methods=['GET'])
def get_menu_lifecycle():
    """Menu Item Lifecycle Tracker"""
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        restaurant = request.args.get('restaurant')
        query = db.collection('reviews')
        if restaurant:
            query = query.where('restaurantName', '==', restaurant)

        reviews_docs = list(query.stream())

        DISHES_AND_ASPECTS = {
            'Pasta & Lasagna': ['pasta', 'lasagna', 'spaghetti', 'truffle pasta', 'ravioli'],
            'Steak & Beef': ['steak', 'beef', 'ribeye', 'sirloin'],
            'Seafood & Lobster': ['lobster', 'bisque', 'seafood', 'crab', 'fish', 'oysters', 'sushi'],
            'Indian Cuisine': ['chicken', 'tikka', 'vindaloo', 'curry', 'samosa', 'naan'],
            'Service Quality': ['service', 'waiter', 'waitress', 'staff', 'server', 'reservation'],
            'Ambiance & Music': ['ambiance', 'atmosphere', 'decor', 'noise', 'view'],
            'Value & Pricing': ['price', 'overpriced', 'value', 'expensive', 'cost'],
            'Hygiene Standards': ['hygiene', 'dirty', 'hair', 'cleanliness', 'clean']
        }

        dish_weeks = {name: {} for name in DISHES_AND_ASPECTS}

        for doc in reviews_docs:
            r = serialize_doc(doc.to_dict())
            try:
                date_obj = datetime.strptime(r.get('date', '')[:10], '%Y-%m-%d')
                week_key = date_obj.strftime('%Y-W%W')
            except Exception:
                continue

            text_lower = r.get('text', '').lower()
            sentiment = r.get('sentiment', 'neutral')

            for dish_name, keywords in DISHES_AND_ASPECTS.items():
                if any(kw in text_lower for kw in keywords):
                    if week_key not in dish_weeks[dish_name]:
                        dish_weeks[dish_name][week_key] = {'positive': 0, 'negative': 0, 'neutral': 0}
                    dish_weeks[dish_name][week_key][sentiment] += 1

        results = []
        for dish_name, week_data in dish_weeks.items():
            if not week_data:
                continue

            sorted_weeks = sorted(week_data.items())
            week_series = []
            for week_key, counts in sorted_weeks:
                total = counts['positive'] + counts['negative'] + counts['neutral']
                pos_ratio = round(counts['positive'] / total * 100, 1) if total > 0 else 0
                week_series.append({
                    'week': week_key,
                    'positiveRatio': pos_ratio,
                    'mentions': total,
                    'positive': counts['positive'],
                    'negative': counts['negative'],
                    'neutral': counts['neutral']
                })

            if len(week_series) >= 2:
                recent = week_series[-2:]
                prior = week_series[-4:-2] if len(week_series) >= 4 else week_series[:max(1, len(week_series)-2)]
                recent_avg = sum(w['positiveRatio'] for w in recent) / len(recent)
                prior_avg = sum(w['positiveRatio'] for w in prior) / len(prior)
                momentum = round(recent_avg - prior_avg, 1)
            else:
                momentum = 0.0

            if momentum > 10:
                trend = 'rising'
            elif momentum < -10:
                trend = 'declining'
            else:
                trend = 'stable'

            total_mentions = sum(w['mentions'] for w in week_series)
            results.append({
                'name': dish_name,
                'weeks': week_series,
                'trend': trend,
                'momentum': momentum,
                'currentPositiveRatio': week_series[-1]['positiveRatio'] if week_series else 0,
                'totalMentions': total_mentions
            })

        order = {'declining': 0, 'stable': 1, 'rising': 2}
        results.sort(key=lambda x: (order[x['trend']], -x['totalMentions']))
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/competitor-benchmark', methods=['GET'])
def get_competitor_benchmark():
    """Competitor Benchmarking across key dimensions"""
    if db is None:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        r_docs = list(db.collection('restaurants').stream())
        restaurants = [serialize_doc(d.to_dict()) for d in r_docs]
        reviews_docs = list(db.collection('reviews').stream())
        reviews = [serialize_doc(d.to_dict()) for d in reviews_docs]

        DIMENSION_KEYWORDS = {
            'foodQuality': ['food', 'pasta', 'steak', 'seafood', 'lobster', 'chicken', 'tikka',
                           'curry', 'burger', 'sushi', 'naan', 'lasagna', 'dish', 'meal',
                           'flavor', 'delicious', 'taste', 'fresh', 'menu'],
            'service': ['service', 'waiter', 'waitress', 'staff', 'server', 'reservation',
                       'booking', 'slow', 'quick', 'fast', 'friendly', 'rude', 'attentive'],
            'hygiene': ['hygiene', 'dirty', 'hair', 'clean', 'cleanliness', 'plastic',
                       'sanitation', 'wash', 'table'],
            'value': ['price', 'overpriced', 'value', 'expensive', 'cost', 'portion',
                     'bill', 'worth', 'cheap', 'affordable'],
            'ambiance': ['ambiance', 'atmosphere', 'decor', 'noise', 'view', 'music',
                        'cozy', 'loud', 'quiet', 'romantic', 'lighting', 'vibe']
        }

        results = []
        for restaurant in restaurants:
            r_name = restaurant.get('name', '')
            r_reviews = [r for r in reviews if r.get('restaurantName') == r_name]
            if not r_reviews:
                continue

            total_reviews = len(r_reviews)
            overall_positive = len([r for r in r_reviews if r.get('sentiment') == 'positive'])
            overall_ratio = overall_positive / total_reviews if total_reviews > 0 else 0.5

            dimensions = {}
            for dim_name, keywords in DIMENSION_KEYWORDS.items():
                matching = [r for r in r_reviews if any(kw in r.get('text', '').lower() for kw in keywords)]
                if matching:
                    pos = len([r for r in matching if r.get('sentiment') == 'positive'])
                    dim_score = round((pos / len(matching)) * 100, 1)
                else:
                    dim_score = round(overall_ratio * 100, 1)
                dimensions[dim_name] = dim_score

            composite = round(
                dimensions['foodQuality'] * 0.30 +
                dimensions['service'] * 0.175 +
                dimensions['hygiene'] * 0.175 +
                dimensions['value'] * 0.175 +
                dimensions['ambiance'] * 0.175,
                1
            )

            results.append({
                'name': r_name,
                'cuisine': restaurant.get('cuisine', ''),
                'totalReviews': total_reviews,
                'dimensions': dimensions,
                'overallScore': composite,
                'averageRating': restaurant.get('averageRating', 0)
            })

        results.sort(key=lambda x: x['overallScore'], reverse=True)
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting TastePulse server on http://0.0.0.0:{port}")
    app.run(debug=True, host='0.0.0.0', port=port)
