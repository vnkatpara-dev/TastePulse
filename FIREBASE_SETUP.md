# TastePulse Production Firebase Architecture & Setup Guide

This guide details the production architecture, security model, Firestore indexes, and bootstrapping procedures for TastePulse.

---

## 1. Security & Authorization Model

### A. Custom Claims (Zero Trust for Client State)
- Roles (`customer`, `owner`, `admin`) are strictly stored as **Firebase Custom User Claims** on Firebase Auth tokens.
- `localStorage` is **never** used or trusted for authorization.
- Token claims are decoded and verified on the server side (`auth.verify_id_token(token, check_revoked=True)`).
- **Fail-Closed Policy**: If Firebase Admin credentials are not configured, all authenticated backend endpoints fail closed with `503 Service Unavailable`.

### B. Firestore Security Rules (`firestore.rules`)
- **Direct Client Writes**: Review creation, updates, and deletes are protected at the database layer:
  - `reviews/{reviewId}`:
    - Author must match `request.auth.uid`.
    - Document ID must be deterministic: `{restaurantId}_{authorUid}`.
    - `allow update: if false;` enforces strict review immutability and makes duplicate review creation impossible.
  - `restaurants/{restaurantId}`:
    - Only users with `request.auth.token.role == 'owner'` can create restaurants.
    - Only `resource.data.ownerUid == request.auth.uid` can modify or delete.

---

## 2. Bootstrapping the Initial Owner Account

To solve the initial deployment chicken-and-egg problem (where promoting a user requires an existing owner/admin), use the secure bootstrap CLI tool:

```bash
# 1. Set your secret in your environment (never commit this)
export BOOTSTRAP_ADMIN_SECRET="your-secure-secret"

# 2. Run the bootstrap script
cd backend
python bootstrap_admin.py --email admin@tastepulse.com --role owner --secret your-secure-secret
```

This will:
1. Find or create the user in Firebase Auth.
2. Mint the `role: 'owner'` and `admin: true` custom claims via Firebase Admin SDK.
3. Call `auth.revoke_refresh_tokens(uid)` to immediately invalidate old sessions and force instant token refresh.
4. Sync the Firestore `users/{uid}` profile document.

---

## 3. Firestore Composite Indexes

For paginated queries that combine equality filters with timestamp ordering (`where('restaurantId', '==', id).orderBy('createdAt', 'desc')`), Firestore requires composite indexes defined in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantName", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "restaurants",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy indexes to Firebase:
```bash
firebase deploy --only firestore:indexes
```

---

## 4. Running Local Firebase Emulators

To run and test the complete system locally against real Firebase Firestore and Auth emulators without affecting production data:

```bash
# Start Auth and Firestore emulators
firebase emulators:start

# In your .env or backend environment:
export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"
```

---

## 5. Architectural Division of Responsibilities

| Responsibility | Authoritative Layer | Mechanism |
| :--- | :--- | :--- |
| **Review Creation & Storage** | Firestore Client SDK | Direct write with atomic `runTransaction` + `firestore.rules` |
| **Duplicate Prevention** | Firestore Security Rules | Deterministic Doc ID `{restaurantId}_{authorUid}` + `allow update: if false` |
| **AI Sentiment Inference** | Flask Backend Microservice | `POST /api/predict` (Flask-Limiter rate-limited + App Check) |
| **Role Management** | Firebase Admin SDK | `POST /api/auth/set-role` + `bootstrap_admin.py` |
| **Aggregates Maintenance** | Firestore Transactions | Atomic increment/decrement of `totalReviews` & `ratingSum` |
