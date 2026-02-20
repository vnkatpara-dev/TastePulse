# TastePulse - Restaurant Review Sentiment Analysis

AI-powered restaurant review sentiment analysis platform built with React (frontend) and Flask (backend).

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn-ui
- **Backend**: Python Flask + scikit-learn (Sentiment Analysis Model)
- **ML Model**: LinearSVC with TF-IDF vectorizer trained on Yelp polarity dataset

## Features

- **Customer Dashboard**: Browse restaurants, write reviews with AI-powered sentiment analysis
- **Owner Dashboard**: View analytics, sentiment trends, and recent reviews

## Getting Started

### Prerequisites

- Node.js & npm (for frontend)
- Python 3.8+ (for backend)

### Frontend Setup

```
bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run at `http://localhost:8080` (Vite's configured port)

### Backend Setup

```
bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python server.py
```

The backend will run at `http://localhost:5000`

**Note**: Make sure the model files (`restaurant_sentiment_model.pkl` and `tfidf_vectorizer.pkl`) are in the backend directory.

### Running the Full Application

1. Start the backend server first (port 5000)
2. Start the frontend dev server (port 8080)
3. Open `http://localhost:8080` in your browser

The Vite proxy is configured to forward `/api` requests to the backend at `http://localhost:5000`.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predict` | POST | Predict sentiment for text |
| `/api/reviews` | GET | Get all reviews |
| `/api/reviews` | POST | Add a new review |
| `/api/reviews/<restaurant>` | GET | Get reviews for a restaurant |
| `/api/restaurants` | GET | Get all restaurants with sentiment data |
| `/api/analytics` | GET | Get overall analytics |
| `/api/sentiment-trend` | GET | Get sentiment trend over time |
| `/api/category-breakdown` | GET | Get sentiment by category |

## Project Structure

```
├── backend/
│   ├── server.py           # Flask API server
│   ├── model.py            # Model training script
│   ├── test.py             # Test script for model
│   ├── requirements.txt   # Python dependencies
│   ├── restaurant_sentiment_model.pkl
│   └── tfidf_vectorizer.pkl
├── src/
│   ├── pages/
│   │   ├── CustomerDashboard.tsx
│   │   ├── OwnerDashboard.tsx
│   │   └── Index.tsx
│   ├── services/
│   │   └── api.ts         # API service layer
│   └── ...
└── package.json
```

## License

MIT
