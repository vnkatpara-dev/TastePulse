# TastePulse - Restaurant Review Sentiment Analysis Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-blue" alt="React">
  <img src="https://img.shields.io/badge/Flask-3.0-green" alt="Flask">
  <img src="https://img.shields.io/badge/scikit--learn-1.3-orange" alt="scikit-learn">
  <img src="https://img.shields.io/badge/MIT License-blue" alt="License">
</p>

TastePulse is an AI-powered restaurant review sentiment analysis platform that helps restaurant owners understand customer feedback through advanced natural language processing. The platform uses machine learning to automatically analyze review sentiments, categorize feedback, and provide actionable insights.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Firebase Setup](#firebase-setup)
- [ML Model Information](#ml-model-information)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### For Customers
- **Browse Restaurants**: View all registered restaurants with ratings and sentiment summaries
- **Submit Reviews**: Write and submit reviews with automatic AI-powered sentiment analysis
- **Sentiment Display**: See real-time sentiment analysis results (positive/negative/neutral)
- **Star Ratings**: Rate restaurants on a 1-5 scale
- **Category-based Feedback**: Submit reviews categorized by Food Quality, Service, Ambiance, Hygiene, or Value

### For Restaurant Owners
- **Dashboard Analytics**: View comprehensive analytics with sentiment breakdowns
- **Review Management**: View, respond to, and delete customer reviews
- **Restaurant Management**: Add, update, and delete restaurant profiles
- **Sentiment Trends**: Track sentiment changes over time with monthly trend analysis
- **Category Breakdown**: Understand which aspects of the restaurant need improvement
- **PDF Export**: Export analytics reports for offline analysis

### Core Platform Features
- **AI-Powered Sentiment Analysis**: Automatic classification of reviews as positive, negative, or neutral
- **Real-time Processing**: Instant sentiment analysis when reviews are submitted
- **Role-Based Access Control**: Separate dashboards and permissions for owners and customers
- **Firebase Authentication**: Secure email/password authentication
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Fallback**: Rule-based sentiment classifier when ML models are unavailable

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI Framework |
| TypeScript | 5.8 | Type Safety |
| Vite | 5.4 | Build Tool & Dev Server |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | - | Component Library |
| React Router | 6.30 | Client-side Routing |
| React Query | 5.83 | Server State Management |
| Recharts | 2.15 | Data Visualization |
| Firebase | 12.9 | Authentication |
| Lucide React | 0.462 | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Flask | 3.0 | Web Framework |
| Flask-CORS | 4.0 | Cross-Origin Requests |
| scikit-learn | 1.3 | ML Model (LinearSVC) |
| joblib | 1.3 | Model Serialization |
| NumPy | 1.24 | Numerical Computing |
| Firebase Admin | 6.2 | Token Verification |

### Development Tools
- **Bun** - JavaScript package manager
- **ESLint** - Code linting
- **Vitest** - Testing framework

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Port 8080)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   React     │  │   Vite      │  │   shadcn/ui +           │ │
│  │   App       │  │   Proxy     │  │   Tailwind CSS          │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
│         │                │                      │              │
│         └────────────────┴──────────────────────┘              │
│                          │                                      │
│                   /api/* (Proxy)                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Backend (Port 5000)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Flask     │  │  ML Model   │  │   Firebase Admin        │ │
│  │   REST API  │  │  (LinearSVC)│  │   (Token Verification) │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                          │                                      │
│                          ▼                                      │
│                   ┌─────────────┐                               │
│                   │  reviews.json                              │
│                   │  (JSON Database)                           │
│                   └─────────────┘                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Firebase Account** (for authentication)

### Frontend Setup

```
bash
# Navigate to project root
cd TastePulse

# Install dependencies using bun (or npm)
npm install

# Start development server
npm run dev
```

The frontend will run at **http://localhost:8080**

### Backend Setup

```
bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python server.py
```

The backend will run at **http://localhost:5000**

### Running the Full Application

1. Start the backend server first (port 5000)
2. Start the frontend dev server (port 8080)
3. Open `http://localhost:8080` in your browser

The Vite proxy is configured to forward `/api` requests to the backend at `http://localhost:5000`.

### Environment Configuration

#### Frontend (src/lib/firebase.ts)
Configure your Firebase credentials:

```
typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

#### Backend (Optional - for production)
Place your Firebase service account key as `backend/serviceAccountKey.json`

---

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the prompts
3. Name your project (e.g., "tastepulse")

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click **Save**

### Step 3: Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click the **Web** icon (`</>`)
4. Register app (e.g., "tastepulse-web")
5. Copy the `firebaseConfig` object
6. Update `src/lib/firebase.ts` with your credentials

### Step 4: User Roles

The application uses two roles:
- **Owner**: Full access to owner dashboard, analytics, and restaurant management
- **Customer**: Access to customer dashboard, can browse restaurants and submit reviews

User roles are stored in localStorage after authentication and used for route protection.

---

## 🤖 ML Model Information

### Model Details

| Property | Value |
|----------|-------|
| Algorithm | LinearSVC (Support Vector Machine) |
| Training Data | Yelp Polarity Dataset |
| Vectorizer | TF-IDF (Term Frequency-Inverse Document Frequency) |
| Features | Text vectorization with n-grams |

### Model Files

The backend requires two model files in the `backend/` directory:

1. `restaurant_sentiment_model.pkl` - Trained LinearSVC model
2. `tfidf_vectorizer.pkl` - Fitted TF-IDF vectorizer

### Training the Model

To retrain the model, use the provided training script:

```
bash
cd backend
python model.py
```

### Fallback Classifier

If the ML model files are not available, the backend uses a rule-based sentiment classifier that analyzes keywords:

- **Positive keywords**: good, great, excellent, amazing, love, delicious, friendly, awesome, best, nice, fantastic, wonderful, perfect, stunning, phenomenal, impressive, warm, welcoming, fresh, divine, outstanding, superb
- **Negative keywords**: bad, terrible, awful, hate, horrible, rude, slow, worst, poor, disgusting, dirty, cold, overpriced, dismissive, lost, waited, hair, difficult, okay, decent

---

## 📡 API Documentation

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/predict` | POST | Predict sentiment for text | No |

### Review Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/reviews` | GET | Get all reviews | No |
| `/api/reviews` | POST | Add a new review | Yes |
| `/api/reviews/<restaurant>` | GET | Get reviews for a restaurant | No |
| `/api/reviews/<review_id>` | DELETE | Delete a review | Yes |

### Restaurant Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/restaurants` | GET | Get all restaurants | No |
| `/api/restaurants` | POST | Add a new restaurant | Yes (Owner) |
| `/api/restaurants/<id>` | PUT | Update a restaurant | Yes (Owner) |
| `/api/restaurants/<id>` | DELETE | Delete a restaurant | Yes (Owner) |

### Analytics Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/analytics` | GET | Get overall analytics | Yes (Owner) |
| `/api/sentiment-trend` | GET | Get sentiment trend over time | Yes (Owner) |
| `/api/category-breakdown` | GET | Get sentiment by category | Yes (Owner) |

### Request/Response Examples

#### POST /api/predict
```
json
// Request
{
  "text": "The food was amazing and the service was excellent!"
}

// Response
{
  "sentiment": "positive",
  "sentimentScore": 0.92,
  "confidence": 0.85
}
```

#### POST /api/reviews
```
json
// Request
{
  "customerName": "John Doe",
  "restaurantName": "The Golden Fork",
  "rating": 5,
  "text": "Absolutely wonderful experience!",
  "category": "Food Quality"
}

// Response
{
  "id": "uuid-string",
  "customerName": "John Doe",
  "restaurantName": "The Golden Fork",
  "rating": 5,
  "text": "Absolutely wonderful experience!",
  "sentiment": "positive",
  "sentimentScore": 0.95,
  "date": "2024-01-15",
  "category": "Food Quality"
}
```

---

## 📁 Project Structure

```
TastePulse/
├── backend/
│   ├── server.py                  # Flask API server
│   ├── model.py                   # ML model training script
│   ├── test.py                    # Model testing script
│   ├── auth_middleware.py         # Firebase token verification
│   ├── requirements.txt           # Python dependencies
│   ├── restaurant_sentiment_model.pkl  # Trained ML model
│   ├── tfidf_vectorizer.pkl       # TF-IDF vectorizer
│   ├── reviews.json               # JSON database
│   └── serviceAccountKey.json     # Firebase admin credentials
│
├── src/
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles
│   │
│   ├── components/
│   │   ├── ProtectedRoute.tsx     # Route protection component
│   │   ├── SentimentBadge.tsx     # Sentiment display badge
│   │   ├── StarRating.tsx         # Star rating component
│   │   ├── StatCard.tsx           # Statistics card
│   │   ├── NavLink.tsx            # Navigation link
│   │   └── ui/                    # shadcn/ui components
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication context
│   │
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── OwnerLogin.tsx         # Owner login page
│   │   ├── CustomerLogin.tsx      # Customer login page
│   │   ├── OwnerDashboard.tsx     # Owner dashboard
│   │   ├── CustomerDashboard.tsx  # Customer dashboard
│   │   └── NotFound.tsx           # 404 page
│   │
│   ├── services/
│   │   └── api.ts                 # API service layer
│   │
│   ├── lib/
│   │   ├── firebase.ts            # Firebase configuration
│   │   └── utils.ts               # Utility functions
│   │
│   ├── hooks/                     # Custom React hooks
│   ├── data/                      # Mock data
│   └── test/                      # Test files
│
├── public/
│   ├── placeholder.svg
│   └── robots.txt
│
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔒 Security

### Authentication & Authorization

- **Firebase Authentication** is used for secure email/password login
- All API calls include Firebase ID token in the `Authorization` header
- Backend verifies tokens using Firebase Admin SDK
- Role-based access control (owner vs customer)
- Protected routes on both frontend and backend

### Sensitive Data

⚠️ **Important**: The `serviceAccountKey.json` file contains sensitive Firebase credentials and has been removed from the repository to comply with GitHub secret scanning.

To add it back for production use:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate a new private key
3. Save as `backend/serviceAccountKey.json`
4. Add to `.gitignore` if not already there

### Development Mode

The backend runs in development mode (without Firebase token verification) if the service account key is not found. This allows testing without full Firebase setup.

---

## 🔧 Troubleshooting

### Frontend Issues

**Port already in use**
```
bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3000
```

**Module not found errors**
```
bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Backend Issues

**Module not found**
```
bash
# Activate virtual environment
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate
```

**Model files not found**
```
Could not load ML model: [Errno 2] No such file or directory
```
Make sure `restaurant_sentiment_model.pkl` and `tfidf_vectorizer.pkl` are in the `backend/` directory.

**Port 5000 already in use**
```
bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Firebase Issues

**Authentication errors**
- Ensure Firebase Authentication is enabled in console
- Check that `firebaseConfig` in `src/lib/firebase.ts` is correct
- Verify the app domain is authorized in Firebase Console

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [Yelp](https://www.yelp.com/) for the polarity dataset
- [Firebase](https://firebase.google.com/) for authentication
- [shadcn](https://ui.shadcn.com/) for the beautiful UI components
- [LinearSVC](https://scikit-learn.org/) for the machine learning model

---

## 📊 Project Status

- **Repository**: [vnkatpara-dev/TastePulse](https://github.com/vnkatpara-dev/TastePulse)
- **Version**: 1.0.0
- **Last Updated**: 2024

### Development Notes

- The application uses mock data initialized in `reviews.json` with sample restaurants and reviews
- Default test accounts can be created through the Firebase authentication UI
- The ML model is pre-trained and ready to use with the included `.pkl` files
