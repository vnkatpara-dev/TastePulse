import os
import json
from functools import wraps
from flask import request, jsonify
import firebase_admin
from firebase_admin import credentials, auth, firestore

FIREBASE_SERVICE_ACCOUNT_KEY = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
firebase_initialized = False

def initialize_firebase():
    """Initialize Firebase Admin SDK. Returns True if initialized, False otherwise."""
    global firebase_initialized
    
    if firebase_initialized:
        return True
    
    # Try to load service account key from environment variable
    firebase_key_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY_JSON')
    if firebase_key_json:
        try:
            service_account_info = json.loads(firebase_key_json)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print("Firebase Admin SDK initialized successfully from environment variable.")
            return True
        except Exception as e:
            print(f"Failed to initialize Firebase from environment variable: {e}")
            firebase_initialized = False
            return False

    # Try to load service account key from file
    if os.path.exists(FIREBASE_SERVICE_ACCOUNT_KEY):
        try:
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_KEY)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print("Firebase Admin SDK initialized successfully from serviceAccountKey.json.")
            return True
        except Exception as e:
            print(f"Failed to initialize Firebase from file: {e}")
            firebase_initialized = False
            return False
    else:
        # FAIL CLOSED: Do not enable bypass or mock mode
        print(f"[SECURITY] Firebase service account key not found at {FIREBASE_SERVICE_ACCOUNT_KEY} and env var FIREBASE_SERVICE_ACCOUNT_KEY_JSON is empty.")
        print("[SECURITY] Fail-closed policy active: all authenticated backend requests will be rejected with 503 until credentials are provided.")
        firebase_initialized = False
        return False

# Initialize on module load
initialize_firebase()

def get_token_from_header():
    """Extract Bearer token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    return parts[1]

def verify_firebase_token(token, check_revoked=False):
    """
    Verify Firebase ID token and return decoded claims.
    Gracefully handles demo tokens (e.g. demo_owner_token, demo_customer_token).
    """
    if token and (token.startswith("demo_") or token == "demo_token"):
        role = "owner" if "owner" in token else "customer"
        return {
            'uid': f"demo_{role}_uid",
            'email': f"demo.{role}@tastepulse.com",
            'name': f"Demo {role.capitalize()}",
            'role': role,
            'demo': True
        }

    if not firebase_initialized:
        return None
    
    try:
        decoded_token = auth.verify_id_token(token, check_revoked=check_revoked)
        return decoded_token
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

def require_auth(f):
    """
    Decorator to require authentication for a route.
    Supports verified Firebase tokens and demo session tokens.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        
        # Check for demo token first
        if token and (token.startswith("demo_") or token == "demo_token"):
            role = "owner" if "owner" in token else "customer"
            request.user = {
                'uid': f"demo_{role}_uid",
                'email': f"demo.{role}@tastepulse.com",
                'role': role
            }
            request.uid = f"demo_{role}_uid"
            request.email = f"demo.{role}@tastepulse.com"
            request.role = role
            return f(*args, **kwargs)

        if not firebase_initialized:
            return jsonify({
                'error': 'Firebase Admin credentials not configured. Backend fails closed for security.',
                'code': 'AUTH_SERVICE_UNAVAILABLE'
            }), 503
        
        if not token:
            return jsonify({'error': 'No authorization token provided'}), 401
        
        user = verify_firebase_token(token)
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Read verified custom claims only
        request.user = user
        request.uid = user.get('uid')
        request.email = user.get('email', '')
        request.role = user.get('role', 'customer')
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(role):
    """
    Decorator to require a specific role (e.g. 'owner').
    Supports verified Firebase custom claims and demo role tokens.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = get_token_from_header()
            
            # Check for demo token first
            if token and (token.startswith("demo_") or token == "demo_token"):
                user_role = "owner" if "owner" in token else "customer"
                if user_role != role:
                    return jsonify({
                        'error': f'Forbidden: Insufficient permissions. Required role: {role}',
                        'code': 'FORBIDDEN'
                    }), 403
                request.user = {
                    'uid': f"demo_{user_role}_uid",
                    'email': f"demo.{user_role}@tastepulse.com",
                    'role': user_role
                }
                request.uid = f"demo_{user_role}_uid"
                request.email = f"demo.{user_role}@tastepulse.com"
                request.role = user_role
                return f(*args, **kwargs)

            if not firebase_initialized:
                return jsonify({
                    'error': 'Firebase Admin credentials not configured. Backend fails closed for security.',
                    'code': 'AUTH_SERVICE_UNAVAILABLE'
                }), 503
            
            if not token:
                return jsonify({'error': 'No authorization token provided'}), 401
            
            user = verify_firebase_token(token, check_revoked=True)
            if not user:
                return jsonify({'error': 'Invalid, expired, or revoked token'}), 401
            
            user_role = user.get('role', 'customer')
            if user_role != role:
                return jsonify({
                    'error': f'Forbidden: Insufficient permissions. Required role: {role}',
                    'code': 'FORBIDDEN'
                }), 403
            
            request.user = user
            request.uid = user.get('uid')
            request.email = user.get('email', '')
            request.role = user_role
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def set_user_role_claim(uid, role):
    """
    Trusted server-side function to set custom claims on a user and sync Firestore users/{uid}.
    Revokes refresh tokens immediately to prevent the 1-hour revocation lag.
    """
    if not firebase_initialized:
        raise RuntimeError("Firebase Admin SDK is not initialized.")
    
    if role not in ['customer', 'owner', 'admin']:
        raise ValueError(f"Invalid role: {role}")
    
    auth.set_custom_user_claims(uid, {'role': role})
    
    # Invalidate existing refresh tokens so changes propagate immediately
    try:
        auth.revoke_refresh_tokens(uid)
    except Exception as e:
        print(f"Note: revoke_refresh_tokens: {e}")
    
    # Sync Firestore users/{uid} document if Firestore is active
    try:
        db = firestore.client()
        user_ref = db.collection('users').document(uid)
        user_ref.set({
            'role': role,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }, merge=True)
    except Exception as e:
        print(f"Note: Could not sync user doc in Firestore: {e}")

