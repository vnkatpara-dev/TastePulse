# TastePulse

<p align="center">
  <a href="https://tastepulse.onrender.com"><img src="https://img.shields.io/badge/Live%20App-tastepulse.onrender.com-blue?style=flat-square" alt="Live App"></a>
  <img src="https://img.shields.io/badge/React-18.3-blue?style=flat-square" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/Flask-3.0-green?style=flat-square" alt="Flask">
  <img src="https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square" alt="Firestore">
  <img src="https://img.shields.io/badge/scikit--learn-LinearSVC-yellow?style=flat-square" alt="scikit-learn">
</p>

TastePulse is a restaurant review and sentiment analysis web application. It combines an ML-based sentiment classifier with Firebase Authentication, Firestore database storage, and role-based dashboards for customers and restaurant owners.

---

## 🌐 Live Application & Authors

* **Live Deployment**: [https://tastepulse.onrender.com](https://tastepulse.onrender.com)
* **Authors**:
  * **Vivek Katpara** — [github.com/vnkatpara-dev](https://github.com/vnkatpara-dev)
  * **Adarsh Kore** — [github.com/Adarsh-GPT](https://github.com/Adarsh-GPT)

---

## 📌 Project Overview

TastePulse provides two primary user flows:

1. **Customer Portal**:
   * Browse restaurants and their average ratings.
   * Filter reviews by category (Food Quality, Service, Ambiance, Value, Hygiene, General).
   * Submit reviews with rating (1–5 stars) and review text.
   * Real-time sentiment prediction displayed upon review submission.
   * View owner responses to reviews.

2. **Owner Dashboard**:
   * Sentiment overview (positive, neutral, negative review counts and percentages).
   * Sentiment trend chart over time.
   * Category breakdown chart (sentiment split per operational aspect).
   * Menu & aspect breakdown based on review text keyword extraction.
   * Predictive churn warning panel estimating diner return risk.
   * Menu lifecycle tracker categorizing item momentum (star, rising, mature, declining).
   * 5-dimension competitor benchmark comparison across registered restaurants.
   * Restaurant profile management (add, edit, delete).
   * PDF report export using `html2canvas` and `jspdf`.

---

## 🔒 Security & Data Architecture

The application uses Firebase Auth and Cloud Firestore as its sole database, with specific security controls:

* **Role Verification**: User roles (`customer`, `owner`) are stored and verified as **Firebase Custom User Claims**. Roles are verified server-side with `auth.verify_id_token(token, check_revoked=True)`.
* **Deterministic Document IDs**: Review documents are keyed by `{restaurantId}_{authorUid}`. Firestore rules enforce `allow update: if false;` to prevent duplicate review submissions by the same user for a given restaurant.
* **IDOR Protection**: Reviews and restaurants can only be modified or deleted by the resource author (`authorUid == auth.uid`) or authorized owners.
* **Atomic Transactions**: Rating calculations (`totalReviews`, `ratingSum`, `averageRating`) use Firestore transactions (`runTransaction` / `@firestore.transactional`) to prevent race conditions during concurrent submissions or deletions.
* **Fail-Closed Policy**: If Firebase Admin credentials are uninitialized, protected backend endpoints fail closed with `503 Service Unavailable`.
* **Rate Limiting**: The ML prediction endpoint (`/api/predict`) is throttled with Flask-Limiter (`30 per minute; 500 per day`).
* **Composite Indexes**: Declared in `firestore.indexes.json` for queries combining equality filters with timestamp ordering (`restaurantId + createdAt`, `restaurantName + createdAt`, `authorUid + createdAt`).

---

## 🛠 Tech Stack

* **Frontend**: React 18.3, TypeScript 5.8, Vite 5.4, Tailwind CSS 3.4, shadcn/ui, Recharts 2.15, Firebase Web SDK 12.9
* **Backend**: Python 3.11, Flask 3.0, Flask-Limiter 3.0, scikit-learn 1.3 (LinearSVC), joblib, Firebase Admin SDK 6.2
* **Database & Auth**: Google Cloud Firestore & Firebase Authentication

---

## 🚀 Setup & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/vnkatpara-dev/TastePulse.git
cd TastePulse
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```
The Vite development server runs at `http://localhost:8080`.

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python server.py
```
The Flask backend runs at `http://localhost:5000`.

---

## 🔥 Firebase Configuration

1. **Frontend**: Update `src/lib/firebase.ts` with your Firebase project configuration:
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

2. **Backend**: Provide your Firebase Admin service account key as `backend/serviceAccountKey.json` or set `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` environment variable.

3. **Bootstrap Initial Owner Account**:
```bash
cd backend
python bootstrap_admin.py --email owner@yourrestaurant.com --role owner --secret <YOUR_BOOTSTRAP_SECRET>
```

4. **Deploy Firestore Rules & Indexes**:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 🧪 Testing

### Backend Security & Concurrency Tests
```bash
python backend/test_security_and_concurrency.py
```
Runs 7 test cases covering role spoofing rejection, IDOR prevention, fail-closed handling, multithreaded concurrent transactions, sentiment keyword classification, composite index validation, and token revocation.

### Frontend Unit Tests
```bash
npx vitest run
```

### Production Build
```bash
npm run build
```

---

## 📡 API Reference

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/predict` | POST | Sentiment inference for review text | No (Rate-limited) |
| `/api/reviews` | GET | List reviews (supports pagination) | No |
| `/api/reviews` | POST | Add a review | Yes (Customer/Owner) |
| `/api/reviews/<id>` | DELETE | Delete review (author or owner) | Yes |
| `/api/restaurants` | GET | List restaurants | No |
| `/api/restaurants` | POST | Add restaurant | Yes (Owner) |
| `/api/restaurants/<id>` | PUT | Update restaurant | Yes (Owner) |
| `/api/restaurants/<id>` | DELETE | Delete restaurant | Yes (Owner) |
| `/api/analytics` | GET | Overall sentiment statistics | Yes (Owner) |
| `/api/sentiment-trend` | GET | Sentiment trend over time | Yes (Owner) |
| `/api/category-breakdown` | GET | Sentiment split per category | Yes (Owner) |
| `/api/auth/sync-user` | POST | Sync user profile and role | Yes |
