# TastePulse — Enterprise Restaurant Review Sentiment Intelligence Platform

<p align="center">
  <a href="https://tastepulse.onrender.com"><img src="https://img.shields.io/badge/Live%20Demo-tastepulse.onrender.com-success?style=for-the-badge&logo=render" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Flask-3.0-green?style=for-the-badge&logo=flask" alt="Flask">
  <img src="https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/scikit--learn-1.3-yellow?style=for-the-badge&logo=scikit-learn" alt="scikit-learn">
  <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License">
</p>

---

🌐 **Live Application**: [https://tastepulse.onrender.com](https://tastepulse.onrender.com)  
👥 **Authors & Core Developers**: **Vivek Katpara** & **Adarsh Kore**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Zero-Trust Security & Production Architecture](#-zero-trust-security--production-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Firebase & Firestore Configuration](#-firebase--firestore-configuration)
- [Admin Bootstrapping](#-admin-bootstrapping)
- [ML Sentiment & Rate Limiting](#-ml-sentiment--rate-limiting)
- [Testing & Verification](#-testing--verification)
- [API Documentation](#-api-documentation)
- [Authors & License](#-authors--license)

---

## 🌟 Overview

**TastePulse** is an AI-powered hospitality intelligence and sentiment platform designed to bridge dining guest feedback with revenue growth. By utilizing natural language processing (NLP), real-time polarity scoring, predictive churn early warning systems, and 5-dimension competitor benchmarking, TastePulse transforms everyday reviews into actionable operational directives.

The platform is backed by a **Zero-Trust Firebase Architecture**, combining Google Cloud Firestore NoSQL storage, cryptographically verified Firebase Custom User Claims, atomic Optimistic Concurrency Control (OCC) transactions, and deterministic document security rules.

---

## ✨ Key Features

### For Diners & Customers
- **Restaurant Explorer**: Discover culinary spots with real-time average ratings and sentiment progress bars.
- **Aspect-Categorized Reviews**: Submit feedback across Food Quality, Service, Ambiance, Value, Hygiene, or General dining.
- **Verified Review Storage**: Direct, authenticated writes into Cloud Firestore with cryptographic author verification.
- **Owner Response Viewing**: View official management responses directly on review cards.

### For Restaurant Operators & Owners
- **Executive Analytics Dashboard**: Comprehensive KPIs, including positive/negative sentiment splits, total volume, and rating trends.
- **Predictive Churn Detection**: Algorithmic scoring (0–100) combining rating trends, sentiment drift, and recency to identify at-risk diners with automated win-back action plans.
- **Menu Item Lifecycle Tracker**: Week-over-week sentiment velocity and momentum sparklines tracking *Star*, *Rising*, *Mature*, and *Declining* dishes.
- **5-Dimension Competitor Benchmarking Radar**: Cross-restaurant radar comparison across Food Quality, Service, Hygiene, Value, and Ambiance metrics.
- **Operational Action Plans**: Automatically generated action items prioritizing high-severity customer complaints.
- **Single-Click PDF Export**: High-resolution executive report generation.

---

## 🔒 Zero-Trust Security & Production Architecture

TastePulse implements enterprise-grade, non-bypassable security principles across both database and API layers:

| Layer / Mechanism | Implementation | Security Guarantee |
| :--- | :--- | :--- |
| **Role Authorization** | Firebase Custom User Claims | `localStorage` is **never** trusted; roles are verified on backend and database rules. |
| **Duplicate Prevention** | Deterministic Doc ID `{restaurantId}_{authorUid}` | Firestore Rule `allow update: if false;` rejects duplicate reviews at the database engine level. |
| **IDOR Protection** | Server Token & Security Rules | Only resource owners can modify or delete their reviews/venues (`resource.data.authorUid == request.auth.uid`). |
| **Atomic Aggregates** | `@firestore.transactional` / `runTransaction` | Concurrently submitted reviews maintain exact `ratingSum`, `totalReviews`, and `averageRating` without race conditions. |
| **Fail-Closed Backend** | `auth_middleware.py` | Returns `503 Service Unavailable` if Firebase credentials are missing or uninitialized. |
| **Immediate Revocation** | `check_revoked=True` | `auth.revoke_refresh_tokens(uid)` ensures revoked credentials cannot be used during their 1-hour JWT window. |
| **Composite Indexes** | `firestore.indexes.json` | Indexes declared for `restaurantId + createdAt`, `restaurantName + createdAt`, and `authorUid + createdAt` to prevent `FAILED_PRECONDITION` errors. |

---

## 🛠 Tech Stack

### Frontend
- **React 18.3** & **TypeScript 5.8**
- **Vite 5.4** (Fast HMR & Optimized Production Build)
- **Tailwind CSS 3.4** & **shadcn/ui**
- **Recharts 2.15** (Responsive Area, Line, Donut & Radar Charts)
- **Firebase Web SDK 12.9** (Firestore, Auth)
- **Lucide React** (Icons)
- **html2canvas** & **jspdf** (PDF Export)

### Backend
- **Python 3.11** & **Flask 3.0**
- **Firebase Admin SDK 6.2** (Firestore & Auth Custom Claims)
- **Flask-Limiter 3.0** (Rate Limiting)
- **scikit-learn 1.3** & **joblib** (LinearSVC & TF-IDF Vectorizer)
- **Gunicorn** (Production WSGI)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Firebase Project with Authentication & Cloud Firestore enabled

### 1. Clone the Repository
```bash
git clone https://github.com/vnkatpara-dev/TastePulse.git
cd TastePulse
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start Vite dev server (runs at http://localhost:8080)
npm run dev
```

### 3. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask server (runs at http://localhost:5000)
python server.py
```

---

## 🔥 Firebase & Firestore Configuration

### 1. Configure Web Credentials (`src/lib/firebase.ts`)
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2. Configure Backend Service Account Key
Save your private key from Firebase Console as `backend/serviceAccountKey.json` or set the environment variable:
```bash
export FIREBASE_SERVICE_ACCOUNT_KEY_JSON='{"type": "service_account", ...}'
```

### 3. Deploy Firestore Rules & Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 🔑 Admin Bootstrapping

To mint the initial Owner/Admin account without an existing superuser:

```bash
cd backend
export BOOTSTRAP_ADMIN_SECRET="your-secure-secret"
python bootstrap_admin.py --email admin@tastepulse.com --role owner --secret your-secure-secret
```

---

## 🤖 ML Sentiment & Rate Limiting

The sentiment engine uses a trained LinearSVC model with TF-IDF vectorization. When ML models are initializing, a refined rule-based classifier handles aspect detection without misclassifying neutral words.

Inference endpoints are rate-limited via Flask-Limiter:
- **`POST /api/predict`**: Limited to `30 requests per minute` and `500 per day`.

---

## 🧪 Testing & Verification

### Run Python Security & Concurrency Test Suite
```bash
python backend/test_security_and_concurrency.py
```
*Validates role spoofing rejection, IDOR blocking, fail-closed handling, 20-thread concurrency, token revocation lag prevention, and composite index declarations.*

### Run Frontend Vitest Suite
```bash
npx vitest run
```

### Run Production Build Validation
```bash
npm run build
```

---

## 👥 Authors & Core Team

* **Vivek Katpara** — [GitHub: @vnkatpara-dev](https://github.com/vnkatpara-dev)
* **Adarsh Kore** — [GitHub: @adarshkore](https://github.com/adarshkore)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
