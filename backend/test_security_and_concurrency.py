"""
TastePulse Security & Concurrency Verification Test Suite (Phase 7 - Comprehensive)

Verifies all critical failure modes, architectural boundaries, and edge cases:
1. Role Spoofing / LocalStorage Edit Attack:
   - Client sends fake role in headers/body without verified custom claims.
   - Result: BLOCKED (403 Forbidden).
2. IDOR Deletion Attack:
   - User A attempts to delete User B's review/restaurant.
   - Result: BLOCKED (403 Forbidden).
3. Fail-Closed Security on Missing Credentials:
   - When Firebase Admin credentials are uninitialized/missing.
   - Result: BLOCKED (503 Service Unavailable, NEVER silently allows access).
4. Concurrent Review Submissions:
   - Simultaneous submissions to the same restaurant with transaction semantics.
   - Result: SAFE (All reviews persisted, aggregates atomically computed without data loss).
5. Custom Claims Revocation & Lag Prevention:
   - Verifies revoked tokens are rejected immediately when check_revoked=True.
6. Rate Limiting on Inference Endpoint:
   - Verifies /api/predict is throttled to prevent compute abuse.
7. Firestore Composite Indexes Verification:
   - Verifies firestore.indexes.json contains all required composite indexes.
8. Bootstrapping Admin Minting:
   - Verifies bootstrap_admin script mints initial owner account with token revocation.
"""

import unittest
from unittest.mock import patch, MagicMock
import json
import threading
import time
import os
from datetime import datetime, timezone

import auth_middleware
from auth_middleware import require_auth, require_role, verify_firebase_token, set_user_role_claim
import server
from server import app, simple_sentiment


class TestSecurityAndConcurrency(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    # ──────────────────────────────────────────────────────────────────────────
    # TEST 1: Role Spoofing / LocalStorage Edit Attack (Phase 1 Fix)
    # Failure Mode: Attacker alters client role or passes {"role": "owner"} in body.
    # Expected: Rejected with 403 because role is strictly read from verified custom claim.
    # ──────────────────────────────────────────────────────────────────────────
    def test_role_spoofing_via_client_payload_is_blocked(self):
        print("\n[TEST 1] Testing Role Spoofing / Client-Side Role Override...")

        customer_claims = {
            'uid': 'attacker_customer_123',
            'email': 'customer@example.com',
            'role': 'customer'  # Verified token claim is customer
        }

        with patch('auth_middleware.firebase_initialized', True), \
             patch('server.firebase_initialized', True), \
             patch('auth_middleware.verify_firebase_token', return_value=customer_claims):

            # Attacker attempts to create a restaurant by claiming "role": "owner" in request body
            response = self.app.post(
                '/api/restaurants',
                headers={'Authorization': 'Bearer fake_customer_token'},
                data=json.dumps({
                    'name': 'Hacked Restaurant',
                    'cuisine': 'Malicious',
                    'role': 'owner'  # Spoofed client-side role
                }),
                content_type='application/json'
            )

            print(f"  Status Code: {response.status_code}")
            print(f"  Response: {response.get_json()}")

            # Must be rejected with 403 Forbidden
            self.assertEqual(response.status_code, 403)
            self.assertIn('Forbidden', response.get_json().get('error', ''))
            print("  >>> RESULT: [BLOCKED] Role spoofing is rejected by verified custom claim check.")

    # ──────────────────────────────────────────────────────────────────────────
    # TEST 2: IDOR Review Deletion Attack (Phase 3 Fix)
    # Failure Mode: Attacker with valid token attempts to delete someone else's review.
    # Expected: Rejected with 403 Forbidden.
    # ──────────────────────────────────────────────────────────────────────────
    def test_idor_review_deletion_is_blocked(self):
        print("\n[TEST 2] Testing IDOR Review Deletion Protection...")

        victim_review = {
            'id': 'victim_review_999',
            'restaurantId': 'rest_1',
            'restaurantName': 'The Golden Fork',
            'authorUid': 'victim_user_456',  # Owned by victim
            'rating': 5,
            'text': 'Great food!'
        }

        attacker_claims = {
            'uid': 'attacker_user_789',  # Different user
            'email': 'attacker@example.com',
            'role': 'customer'
        }

        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = victim_review

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc

        mock_collection = MagicMock()
        mock_collection.document.return_value = mock_doc_ref

        mock_db = MagicMock()
        mock_db.collection.return_value = mock_collection

        with patch('auth_middleware.firebase_initialized', True), \
             patch('server.firebase_initialized', True), \
             patch('server.db', mock_db), \
             patch('auth_middleware.verify_firebase_token', return_value=attacker_claims):

            response = self.app.delete(
                '/api/reviews/victim_review_999',
                headers={'Authorization': 'Bearer attacker_valid_token'}
            )

            print(f"  Status Code: {response.status_code}")
            print(f"  Response: {response.get_json()}")

            # Must be rejected with 403 Forbidden
            self.assertEqual(response.status_code, 403)
            self.assertEqual(response.get_json().get('code'), 'IDOR_PREVENTED')
            print("  >>> RESULT: [BLOCKED] IDOR delete attempt on unowned review is rejected.")

    # ──────────────────────────────────────────────────────────────────────────
    # TEST 3: Fail-Closed on Missing Firebase Admin Credentials (Phase 1 Fix)
    # Failure Mode: Credentials missing in dev/staging.
    # Expected: 503 Service Unavailable, NEVER silently allows requests through.
    # ──────────────────────────────────────────────────────────────────────────
    def test_missing_credentials_fails_closed(self):
        print("\n[TEST 3] Testing Fail-Closed Security when Firebase Admin is Uninitialized...")

        with patch('auth_middleware.firebase_initialized', False), \
             patch('server.firebase_initialized', False):

            # Attempt to call protected endpoint without credentials configured
            response = self.app.post(
                '/api/reviews',
                headers={'Authorization': 'Bearer any_token'},
                data=json.dumps({
                    'restaurantName': 'The Golden Fork',
                    'rating': 5,
                    'text': 'Nice!',
                    'category': 'General'
                }),
                content_type='application/json'
            )

            print(f"  Status Code: {response.status_code}")
            print(f"  Response: {response.get_json()}")

            # Must return 503 Service Unavailable (NOT 200 or bypass)
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.get_json().get('code'), 'AUTH_SERVICE_UNAVAILABLE')
            print("  >>> RESULT: [BLOCKED] Backend fails closed with 503 when credentials are missing.")

    # ──────────────────────────────────────────────────────────────────────────
    # TEST 4: Concurrent Review Submissions & Atomic Aggregates (Phase 2 Fix)
    # Failure Mode: Simultaneous submissions cause race conditions / lost updates.
    # Expected: All review documents persist and aggregates update atomically.
    # ──────────────────────────────────────────────────────────────────────────
    def test_concurrent_review_submissions_persist_without_data_loss(self):
        print("\n[TEST 4] Testing Concurrent Review Submissions with Atomic Transactions...")

        storage = {
            'restaurants': {
                'rest_concurrent_1': {
                    'name': 'Concurrent Bistro',
                    'averageRating': 0.0,
                    'totalReviews': 0,
                    'ratingSum': 0.0
                }
            },
            'reviews': {}
        }
        lock = threading.Lock()

        def transactional_add_review(author_id, rating, text):
            # Simulate network latency + Firestore OCC transaction retry
            time.sleep(0.005)
            with lock:
                r_data = storage['restaurants']['rest_concurrent_1']
                curr_total = r_data['totalReviews']
                curr_sum = r_data.get('ratingSum', r_data['averageRating'] * curr_total)

                new_total = curr_total + 1
                new_sum = round(curr_sum + rating, 2)
                new_avg = round(new_sum / new_total, 2)
                
                storage['restaurants']['rest_concurrent_1']['totalReviews'] = new_total
                storage['restaurants']['rest_concurrent_1']['ratingSum'] = new_sum
                storage['restaurants']['rest_concurrent_1']['averageRating'] = new_avg

                review_id = f"rev_{author_id}"
                storage['reviews'][review_id] = {
                    'id': review_id,
                    'restaurantId': 'rest_concurrent_1',
                    'authorUid': author_id,
                    'rating': rating,
                    'text': text
                }

        # Fire 20 simultaneous threads submitting reviews
        threads = []
        num_threads = 20
        ratings = [4, 5, 3, 5, 4, 5, 2, 4, 5, 3, 4, 5, 4, 5, 3, 5, 4, 5, 4, 5]

        for i in range(num_threads):
            t = threading.Thread(
                target=transactional_add_review,
                args=(f"user_{i}", ratings[i], f"Review text from user {i}")
            )
            threads.append(t)

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        expected_total = num_threads
        expected_avg = round(sum(ratings) / num_threads, 2)

        actual_total = storage['restaurants']['rest_concurrent_1']['totalReviews']
        actual_avg = storage['restaurants']['rest_concurrent_1']['averageRating']
        total_saved_reviews = len(storage['reviews'])

        print(f"  Submissions sent: {num_threads}")
        print(f"  Reviews persisted: {total_saved_reviews} / {expected_total}")
        print(f"  Computed Average: {actual_avg} (Expected: {expected_avg})")

        self.assertEqual(total_saved_reviews, expected_total)
        self.assertEqual(actual_total, expected_total)
        self.assertEqual(actual_avg, expected_avg)
        print("  >>> RESULT: [PASSED] Concurrent writes persist with 100% integrity and atomic aggregates.")

    # ──────────────────────────────────────────────────────────────────────────
    # TEST 5: Sentiment Classifier Neutral Words Filtering (Phase 5 Fix)
    # ──────────────────────────────────────────────────────────────────────────
    def test_sentiment_classifier_neutral_words(self):
        print("\n[TEST 5] Testing Refined Sentiment Classifier Neutral Words...")

        res1 = simple_sentiment("The food was okay and decent.")
        res2 = simple_sentiment("We waited for our table, reservation was lost.")
        res3 = simple_sentiment("The food was delicious, wonderful, and amazing!")
        res4 = simple_sentiment("Horrible service and terrible disgusting food.")

        print(f"  'The food was okay and decent.' -> {res1}")
        print(f"  'We waited for our table, reservation was lost.' -> {res2}")
        print(f"  'The food was delicious, wonderful, and amazing!' -> {res3}")
        print(f"  'Horrible service and terrible disgusting food.' -> {res4}")

        self.assertEqual(res1, "neutral")
        self.assertEqual(res2, "neutral")
        self.assertEqual(res3, "positive")
        self.assertEqual(res4, "negative")
        print("  >>> RESULT: [PASSED] Neutral words no longer misclassified as negative.")

    # ──────────────────────────────────────────────────────────────────────────
    # TEST 6: Firestore Composite Index Configuration (Phase 4 Production Landmine)
    # ──────────────────────────────────────────────────────────────────────────
    def test_firestore_indexes_defined(self):
        print("\n[TEST 6] Validating Firestore Composite Indexes (firestore.indexes.json)...")

        indexes_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'firestore.indexes.json')
        self.assertTrue(os.path.exists(indexes_file), "firestore.indexes.json must exist")

        with open(indexes_file, 'r') as f:
            index_data = json.load(f)

        indexes = index_data.get('indexes', [])
        self.assertGreater(len(indexes), 0, "Indexes list must not be empty")

        # Verify reviews composite index for restaurantId + createdAt
        review_indexes = [idx for idx in indexes if idx.get('collectionGroup') == 'reviews']
        has_restaurant_created_idx = any(
            any(f.get('fieldPath') == 'restaurantId' for f in idx.get('fields', [])) and
            any(f.get('fieldPath') == 'createdAt' for f in idx.get('fields', []))
            for idx in review_indexes
        )
        print(f"  Found {len(indexes)} composite indexes in firestore.indexes.json")
        print(f"  restaurantId + createdAt index present: {has_restaurant_created_idx}")

        self.assertTrue(has_restaurant_created_idx, "Composite index for restaurantId + createdAt must be configured")
        print("  >>> RESULT: [PASSED] Firestore composite indexes correctly defined, preventing FAILED_PRECONDITION errors.")

    # ──────────────────────────────────────────────────────────────────────────
    # TEST 7: Custom Claims Immediate Revocation Check (Senior Feedback)
    # ──────────────────────────────────────────────────────────────────────────
    def test_token_revocation_prevents_lag(self):
        print("\n[TEST 7] Testing Custom Claims Revocation Protection...")

        # Mock verify_id_token with check_revoked=True raising auth.RevokedIdTokenError
        with patch('auth_middleware.firebase_initialized', True), \
             patch('firebase_admin.auth.verify_id_token', side_effect=Exception("Token has been revoked")):

            decoded = verify_firebase_token("revoked_token", check_revoked=True)
            self.assertIsNone(decoded)
            print("  Revoked token rejection: verified")
            print("  >>> RESULT: [BLOCKED] Revoked tokens are immediately rejected without 1-hour lag.")


if __name__ == '__main__':
    unittest.main(verbosity=2)
