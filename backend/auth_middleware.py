import os
import json
from functools import wraps
from flask import request, jsonify
import firebase_admin
from firebase_admin import credentials, auth

# Firebase configuration - replace with your actual Firebase service account key path
# You need to download serviceAccountKey.json from Firebase Console:
# Project Settings > Service Accounts > Generate New Private Key
FIREBASE_SERVICE_ACCOUNT_KEY = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')

# Initialize Firebase Admin SDK
firebase_initialized = False

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global firebase_initialized
    
    if firebase_initialized:
        return True
    
    # Try to load service account key if it exists
    if os.path.exists(FIREBASE_SERVICE_ACCOUNT_KEY):
        try:
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_KEY)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print("Firebase Admin SDK initialized successfully")
            return True
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
            return False
    else:
        print(f"Firebase service account key not found at {FIREBASE_SERVICE_ACCOUNT_KEY}")
        print("Auth will be in bypass mode for development")
        return False

# Initialize on module load
initialize_firebase()

def verify_firebase_token(token):
    """Verify Firebase ID token and return decoded claims"""
    if not firebase_initialized:
        # Development mode - return mock owner user to allow all features
        return {
            'uid': 'dev_user',
            'email': 'dev@example.com',
            'role': 'owner'
        }
    
    try:
        # Verify the token
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

def get_token_from_header():
    """Extract token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return None
    
    # Expect format: "Bearer <token>"
    parts = auth_header.split()
    
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    return parts[1]

def require_auth(f):
    """Decorator to require authentication for a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return jsonify({'error': 'No authorization token provided'}), 401
        
        user = verify_firebase_token(token)
        
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user info to request context
        request.user = user
        request.uid = user.get('uid')
        request.email = user.get('email')
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(role):
    """Decorator to require specific role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = get_token_from_header()
            
            if not token:
                return jsonify({'error': 'No authorization token provided'}), 401
            
            user = verify_firebase_token(token)
            
            if not user:
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            # Check role - support both custom claims and local role mapping
            user_role = user.get('role', '')
            user_email = user.get('email', '')
            
            # For development mode (when firebase is initialized but no custom claims)
            # Allow access if user has a valid Firebase email
            if not user_role and firebase_initialized:
                # Development mode: check if user has a valid email
                # In production, you would set custom claims in Firebase
                if user_email and user_email != 'dev@example.com':
                    # User is logged in but no role claim - assume owner for now
                    user_role = 'owner'
            
            if user_role != role:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            # Add user info to request context
            request.user = user
            request.uid = user.get('uid')
            request.email = user.get('email')
            request.role = user_role
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
