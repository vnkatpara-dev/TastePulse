"""
TastePulse Admin & Owner Bootstrapping Utility

Solves the bootstrapping chicken-and-egg problem on a fresh deployment:
Mints the first owner/admin account using Firebase Admin SDK, gated by BOOTSTRAP_ADMIN_SECRET.

Usage:
    python bootstrap_admin.py --email admin@tastepulse.com --role owner --secret <BOOTSTRAP_ADMIN_SECRET>
    or set environment variable BOOTSTRAP_ADMIN_SECRET in .env
"""

import sys
import os
import argparse
import firebase_admin
from firebase_admin import credentials, auth, firestore

FIREBASE_SERVICE_ACCOUNT_KEY = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')

def init_firebase():
    if len(firebase_admin._apps) > 0:
        return True
    
    key_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY_JSON')
    if key_json:
        try:
            import json
            cred = credentials.Certificate(json.loads(key_json))
            firebase_admin.initialize_app(cred)
            return True
        except Exception as e:
            print(f"Error loading FIREBASE_SERVICE_ACCOUNT_KEY_JSON: {e}")

    if os.path.exists(FIREBASE_SERVICE_ACCOUNT_KEY):
        try:
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_KEY)
            firebase_admin.initialize_app(cred)
            return True
        except Exception as e:
            print(f"Error loading serviceAccountKey.json: {e}")

    print("ERROR: No Firebase service account credentials found.")
    print("Please provide serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable.")
    return False

def bootstrap_user(email, role='owner', secret=None, is_admin=True):
    expected_secret = os.environ.get('BOOTSTRAP_ADMIN_SECRET', 'tastepulse-bootstrap-secret-2026')
    if secret != expected_secret:
        print("ERROR: Invalid or missing BOOTSTRAP_ADMIN_SECRET.")
        sys.exit(1)

    if not init_firebase():
        sys.exit(1)

    try:
        user = auth.get_user_by_email(email)
        uid = user.uid
        print(f"Found existing user: {email} (UID: {uid})")
    except auth.UserNotFoundError:
        print(f"User {email} does not exist in Firebase Auth.")
        print(f"Creating user {email}...")
        password = os.environ.get('BOOTSTRAP_USER_PASSWORD', 'TastePulseAdmin2026!')
        user = auth.create_user(email=email, password=password, display_name="System Admin")
        uid = user.uid
        print(f"Created user {email} (UID: {uid}) with temporary password.")

    # Assign custom claims
    claims = {'role': role, 'admin': is_admin}
    auth.set_custom_user_claims(uid, claims)
    # Revoke existing refresh tokens so new custom claim is immediately fetched on next request
    auth.revoke_refresh_tokens(uid)
    print(f"Successfully assigned custom claims to {email}: {claims}")
    print("Revoked old refresh tokens to guarantee immediate claim propagation.")

    # Sync Firestore users/{uid} document
    try:
        db = firestore.client()
        user_ref = db.collection('users').document(uid)
        user_ref.set({
            'uid': uid,
            'email': email,
            'displayName': user.display_name or 'System Owner',
            'role': role,
            'isAdmin': is_admin,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }, merge=True)
        print(f"Synced Firestore document: users/{uid}")
    except Exception as e:
        print(f"Note: Firestore sync: {e}")

    print(f"\n[SUCCESS] Successfully bootstrapped {role} account for {email}!")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Bootstrap the initial TastePulse owner/admin account.")
    parser.add_argument('--email', required=True, help="Email of the user to promote to owner/admin")
    parser.add_argument('--role', default='owner', choices=['owner', 'customer', 'admin'], help="Role to assign")
    parser.add_argument('--secret', default=os.environ.get('BOOTSTRAP_ADMIN_SECRET', 'tastepulse-bootstrap-secret-2026'), help="Bootstrap secret key")
    args = parser.parse_args()

    bootstrap_user(email=args.email, role=args.role, secret=args.secret)
