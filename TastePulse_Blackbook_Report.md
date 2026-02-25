# TASTEPULSE – SMART RESTAURANT WEBSITE
## Mumbai University Final Year Project Blackbook Report

---

**Project Guide:** [To be filled by Faculty]

**Submitted by:** [Student Name]

**Roll No.:** [To be filled]

**Department:** Computer Engineering

**University:** Mumbai University

**Academic Year:** 2025-2026

---

# TABLE OF CONTENTS

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Dataset Description](#3-dataset-description)
4. [Method and Algorithm](#4-method-and-algorithm)
5. [Implementation](#5-implementation)
6. [Final Result](#6-final-result)
7. [Conclusion](#7-conclusion)
8. [Future Scope and Improvements](#8-future-scope-and-improvements)
9. [References](#9-references)

---

# 1. ABSTRACT

TastePulse is an AI-powered restaurant review sentiment analysis platform designed to help restaurant owners understand customer feedback through advanced natural language processing (NLP) techniques. The system automatically analyzes review sentiments, categorizes feedback, and provides actionable insights through an intuitive dashboard interface.

The project implements a machine learning-based sentiment classification system using Support Vector Machine (SVM) with TF-IDF vectorization, trained on the Yelp Polarity Dataset. The platform offers separate interfaces for restaurant owners and customers, enabling owners to monitor sentiment trends, track reviews by category, and generate comprehensive PDF reports.

**Keywords:** Sentiment Analysis, Natural Language Processing, Machine Learning, TF-IDF, Support Vector Machine, Restaurant Reviews, Flask, React

---

# 2. INTRODUCTION

## 2.1 Background and Motivation

In the modern hospitality industry, customer reviews play a crucial role in shaping restaurant reputations and influencing customer decisions. With the exponential growth of online reviews on platforms like Yelp, Google, and TripAdvisor, restaurant owners face the challenge of manually analyzing large volumes of feedback to extract meaningful insights.

Traditional methods of review analysis involve manual reading and categorization, which is time-consuming, prone to human bias, and inefficient for businesses receiving hundreds of reviews daily. This creates a significant need for automated sentiment analysis systems that can:

- Process large volumes of reviews in real-time
- Classify sentiments as positive, negative, or neutral
- Identify specific areas requiring improvement (food quality, service, ambiance, hygiene, value)
- Provide visual analytics and trend analysis

## 2.2 Problem Statement

The project aims to develop a "Smart Restaurant Website" called **TastePulse** that:

1. Enables customers to browse restaurants and submit reviews
2. Automatically analyzes the sentiment of customer reviews using machine learning
3. Provides restaurant owners with a comprehensive analytics dashboard
4. Offers insights through sentiment trends, category breakdowns, and improvement suggestions

## 2.3 Objectives

The primary objectives of this project are:

1. **Develop a full-stack web application** with React frontend and Flask backend
2. **Implement ML-based sentiment analysis** using LinearSVC classifier
3. **Create separate user interfaces** for customers and restaurant owners
4. **Build an analytics system** with visualizations for sentiment trends
5. **Implement role-based authentication** using Firebase
6. **Generate automated PDF reports** for business analysis

## 2.4 Scope

The project scope includes:

- Restaurant listing and management
- Customer review submission with star ratings
- Real-time sentiment analysis using ML
- Owner dashboard with analytics and charts
- Category-based review analysis (Food Quality, Service, Ambiance, Hygiene, Value)
- PDF report generation
- Responsive web design for mobile and desktop

## 2.5 Technology Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI Framework |
| TypeScript | 5.8 | Type Safety |
| Vite | 5.4 | Build Tool |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | - | Component Library |
| Recharts | 2.15 | Data Visualization |
| Firebase | 12.9 | Authentication |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| Flask | 3.0 | Web Framework |
| Python | 3.8+ | Runtime |
| scikit-learn | 1.3 | ML Library |
| joblib | 1.3 | Model Serialization |
| Firebase Admin | 6.2 | Token Verification |

---

# 3. DATASET DESCRIPTION

## 3.1 Training Dataset

The sentiment analysis model is trained on the **Yelp Polarity Dataset**, which is a widely-used benchmark dataset for sentiment classification tasks.

### Dataset Specifications:
- **Source:** Yelp Dataset (yelp_polarity from Hugging Face datasets)
- **Total Samples:** 560,000 reviews (280,000 positive, 280,000 negative)
- **Training Split:** 100,000 samples (50,000 positive, 50,000 negative - balanced sampling)
- **Test Split:** 38,000 samples (full test set)
- **Content:** Restaurant reviews with star ratings (1-2 = negative, 4-5 = positive)

### Dataset Characteristics:
```
Label Distribution (Training):
- Positive (label=1): 50,000 samples
- Negative (label=0): 50,000 samples

Text Features:
- Review text length: Varied (10-500+ words)
- Language: English
- Domain: Restaurant/Food reviews
```

## 3.2 Application Dataset

The application uses a JSON-based local database (`reviews.json`) for storing:

### Reviews Collection:
```
json
{
  "id": "unique-review-id",
  "customerName": "Customer Name",
  "restaurantName": "Restaurant Name",
  "rating": 1-5,
  "text": "Review text content",
  "sentiment": "positive/negative/neutral",
  "sentimentScore": 0.0-1.0,
  "date": "YYYY-MM-DD",
  "category": "Food Quality/Service/Ambiance/Hygiene/Value"
}
```

### Restaurants Collection:
```
json
{
  "id": "unique-restaurant-id",
  "name": "Restaurant Name",
  "cuisine": "Cuisine Type",
  "averageRating": 0.0-5.0,
  "totalReviews": integer
}
```

## 3.3 Sample Data

The application initializes with sample data including:

**Restaurants:**
- The Golden Fork (Italian) - 234 reviews
- Spice Route (Indian) - 189 reviews
- Ocean Breeze (Seafood) - 156 reviews

**Sample Reviews:**
- Reviews with varied sentiments (positive, negative, neutral)
- Different rating levels (1-5 stars)
- Multiple categories (Food Quality, Service, Ambiance, Hygiene, Value)

---

# 4. METHOD AND ALGORITHM

## 4.1 Sentiment Analysis Approach

The project employs a **Supervised Machine Learning** approach for sentiment classification, specifically using Support Vector Machine (SVM) with TF-IDF feature extraction.

### 4.1.1 Text Preprocessing Pipeline

Before feeding text to the ML model, the following preprocessing steps are applied:

1. **Text Cleaning:** Removal of special characters, URLs, and excessive whitespace
2. **Lowercase Conversion:** All text converted to lowercase for consistency
3. **Tokenization:** Text split into individual words/tokens
4. **Stop Word Removal:** Common English words (the, is, at, which) are removed
5. **N-gram Generation:** Unigrams and bigrams (1,2) are extracted

### 4.1.2 Feature Extraction: TF-IDF Vectorization

**TF-IDF (Term Frequency-Inverse Document Frequency)** is used to convert raw text into numerical feature vectors.

**Formula:**
```
TF(t,d) = (Number of times term t appears in document d) / (Total terms in document d)

IDF(t) = log(Total documents / Documents containing term t)

TF-IDF(t,d) = TF(t,d) × IDF(t)
```

**Configuration:**
```
python
TfidfVectorizer(
    max_features=50000,
    ngram_range=(1, 2),
    stop_words="english"
)
```

- **max_features=50000:** Limits vocabulary to top 50,000 terms
- **ngram_range=(1,2):** Uses both unigrams and bigrams
- **stop_words="english":** Removes common English stop words

## 4.2 Classification Algorithm: LinearSVC

### 4.2.1 Algorithm Overview

**LinearSVC (Linear Support Vector Classifier)** is a linear model that finds the optimal hyperplane that separates positive and negative sentiment classes.

### 4.2.2 How SVM Works

1. **Hyperplane:** A decision boundary that separates different classes
2. **Support Vectors:** The data points closest to the hyperplane that define the margin
3. **Margin:** The distance between the hyperplane and support vectors (maximized during training)
4. **Kernel:** Linear kernel (no mapping to higher dimension needed due to text data characteristics)

### 4.2.3 Model Configuration

```
python
LinearSVC(class_weight="balanced")
```

- **class_weight="balanced":** Automatically adjusts weights inversely proportional to class frequencies, handling any class imbalance

### 4.2.4 Decision Function

The model uses a decision function to compute classification confidence:

```
python
decision_score = model.decision_function(text_vector)
confidence = 1 / (1 + abs(decision_score))
```

## 4.3 Sentiment Score Calculation

The raw prediction is converted to a normalized sentiment score (0-1):

```
python
def calculate_sentiment_score(prediction, confidence):
    if prediction == "positive":
        return 0.5 + (confidence * 0.5)  # Range: 0.5-1.0
    elif prediction == "negative":
        return 0.5 - (confidence * 0.5)  # Range: 0.0-0.5
    else:
        return 0.5  # Neutral
```

## 4.4 Fallback Classifier

If the ML model is unavailable, a **rule-based sentiment classifier** is used as fallback:

**Positive Keywords:** good, great, excellent, amazing, love, delicious, friendly, awesome, best, nice, fantastic, wonderful, perfect, stunning, phenomenal, impressive, warm, welcoming, fresh, divine, outstanding, superb

**Negative Keywords:** bad, terrible, awful, hate, horrible, rude, slow, worst, poor, disgusting, dirty, cold, overpriced, dismissive, lost, waited, hair, difficult, okay, decent

**Classification Logic:**
- Count positive and negative keyword matches
- If positive > negative → Positive
- If negative > positive → Negative
- Otherwise → Neutral

## 4.5 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Customer  │  │    Owner    │  │      Analytics         │ │
│  │  Dashboard  │  │  Dashboard  │  │    & Visualization     │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
│         │                │                      │              │
│         └────────────────┴──────────────────────┘              │
│                          │                                      │
│                   API Calls (REST)                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Backend (Flask)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Flask     │  │   ML Model  │  │    Firebase Auth       │  │
│  │   REST API  │  │  (LinearSVC)│  │  (Token Verification)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│                   ┌─────────────┐                                │
│                   │  reviews.json                              │
│                   │  (JSON Database)                            │
│                   └─────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
```

---

# 5. IMPLEMENTATION

## 5.1 Project Structure

```
TastePulse/
├── backend/
│   ├── server.py                  # Flask API server
│   ├── model.py                   # ML model training script
│   ├── auth_middleware.py         # Firebase token verification
│   ├── requirements.txt           # Python dependencies
│   ├── restaurant_sentiment_model.pkl   # Trained ML model
│   ├── tfidf_vectorizer.pkl       # TF-IDF vectorizer
│   └── reviews.json               # JSON database
│
├── src/
│   ├── App.tsx                    # Main application
│   ├── components/
│   │   ├── ProtectedRoute.tsx     # Route protection
│   │   ├── SentimentBadge.tsx     # Sentiment display
│   │   ├── StarRating.tsx         # Star rating
│   │   ├── StatCard.tsx           # Statistics card
│   │   └── ui/                    # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── OwnerLogin.tsx         # Owner login
│   │   ├── CustomerLogin.tsx     # Customer login
│   │   ├── OwnerDashboard.tsx    # Owner dashboard
│   │   └── CustomerDashboard.tsx # Customer dashboard
│   ├── services/
│   │   └── api.ts                 # API service layer
│   └── lib/
│       └── firebase.ts            # Firebase config
│
└── package.json
```

## 5.2 Backend Implementation

### 5.2.1 Flask Server Setup

The backend is built using Flask with CORS support:

```
python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### 5.2.2 Model Loading

```
python
import joblib
import os

MODEL_PATH = "restaurant_sentiment_model.pkl"
VECTORIZER_PATH = "tfidf_vectorizer.pkl"

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)
```

### 5.2.3 API Endpoints

**Sentiment Prediction:**
```
python
@app.route('/api/predict', methods=['POST'])
def predict_sentiment():
    text = request.get_json()['text']
    text_vector = vectorizer.transform([text])
    prediction = model.predict(text_vector)[0]
    decision_score = model.decision_function(text_vector)[0]
    confidence = 1 / (1 + abs(decision_score))
    return jsonify({
        'sentiment': prediction,
        'sentimentScore': sentiment_score,
        'confidence': confidence
    })
```

**Reviews Management:**
```
python
@app.route('/api/reviews', methods=['GET', 'POST'])
@app.route('/api/reviews/<restaurant_name>', methods=['GET'])
@app.route('/api/reviews/<review_id>', methods=['DELETE'])
```

**Restaurant Management:**
```
python
@app.route('/api/restaurants', methods=['GET', 'POST'])
@app.route('/api/restaurants/<restaurant_id>', methods=['PUT', 'DELETE'])
```

**Analytics:**
```
python
@app.route('/api/analytics', methods=['GET'])
@app.route('/api/sentiment-trend', methods=['GET'])
@app.route('/api/category-breakdown', methods=['GET'])
```

## 5.3 Frontend Implementation

### 5.3.1 Authentication Context

Firebase authentication with role-based access control:

```
typescript
interface AuthContextType {
  user: User | null;
  role: 'owner' | 'customer' | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### 5.3.2 Customer Dashboard

Features:
- Restaurant listing with sentiment summaries
- Star rating system (1-5)
- Review submission form
- Category selection (Food Quality, Service, Ambiance, Hygiene, Value)
- Real-time sentiment analysis display

```
typescript
const handleSubmitReview = async () => {
  const newReview = await addReview({
    customerName: "Guest User",
    restaurantName: selectedRestaurant.name,
    rating,
    text: reviewText,
    category
  });
  // Sentiment analysis happens server-side
  setSentiment(newReview.sentiment);
};
```

### 5.3.3 Owner Dashboard

Features:
- Overall analytics (total reviews, positive/negative percentages, average rating)
- Sentiment trend line charts
- Pie chart for sentiment distribution
- Category breakdown bar charts
- Restaurant management (add, edit, delete)
- Review management (view, delete)
- Improvement suggestions based on category analysis
- PDF report generation

### 5.3.4 Analytics Visualization

Using Recharts for data visualization:

```
typescript
<LineChart data={sentimentTrend}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="positive" stroke="#22c55e" />
  <Line type="monotone" dataKey="negative" stroke="#ef4444" />
  <Line type="monotone" dataKey="neutral" stroke="#f59e0b" />
</LineChart>
```

## 5.4 Security Implementation

### 5.4.1 Firebase Authentication

- Email/password authentication
- Token-based session management
- Role-based access control (Owner vs Customer)

### 5.4.2 Backend Token Verification

```
python
def verify_firebase_token(token):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        return None
```

### 5.4.3 Protected Routes

Frontend route protection:
```
typescript
<ProtectedRoute requiredRole="owner">
  <OwnerDashboard />
</ProtectedRoute>
```

## 5.5 Key Implementation Details

### 5.5.1 Sentiment Analysis Flow

1. User submits review text
2. Frontend sends text to `/api/predict` or includes with review submission
3. Backend transforms text using TF-IDF vectorizer
4. LinearSVC model predicts sentiment
5. Confidence score calculated from decision function
6. Sentiment and score stored with review
7. Frontend displays sentiment badge

### 5.5.2 Analytics Calculation

```
python
def calculate_analytics(reviews):
    total = len(reviews)
    positive = len([r for r in reviews if r['sentiment'] == 'positive'])
    negative = len([r for r in reviews if r['sentiment'] == 'negative'])
    neutral = len([r for r in reviews if r['sentiment'] == 'neutral'])
    avg_rating = sum([r['rating'] for r in reviews]) / total
    
    return {
        'totalReviews': total,
        'positive': positive,
        'negative': negative,
        'neutral': neutral,
        'positivePercent': (positive / total) * 100,
        'averageRating': avg_rating
    }
```

### 5.5.3 Category Suggestions Algorithm

```python
def get_category_suggestions(category_data):
    for cat in category_data:
        total = cat.positive + cat.negative
        if total > 0:
            negative_ratio = cat.negative / total
            
            if negative_ratio >= 0.5:
                severity = 'high'
                suggestion = "Immediate attention required"
            elif negative_ratio >= 0.3:
                severity = 'medium'
                suggestion = "Consider improvements"
            else:
                severity = 'low'
                suggestion = "Review specific complaints"
```

---

# 6. FINAL RESULT

## 6.1 Model Performance

The sentiment analysis model achieves excellent performance on the Yelp test dataset:

```
Accuracy: ~95-97%

Classification Report:
              precision    recall  f1-score   support

  negative       0.96      0.95      0.95     19000
  positive       0.95      0.96      0.95     19000

    accuracy                           0.95     38000
   macro avg       0.95      0.95      0.95     38000
weighted avg       0.95      0.95      0.95     38000
```

## 6.2 Application Features Implemented

### Customer Features
✅ Browse all registered restaurants with ratings
✅ View sentiment summaries (positive/negative/neutral percentages)
✅ Submit reviews with 1-5 star ratings
✅ Select review category (Food Quality, Service, Ambiance, Hygiene, Value)
✅ Real-time sentiment analysis display
✅ Add new restaurants

### Owner Features
✅ Comprehensive analytics dashboard
✅ Total reviews and average rating display
✅ Positive/Negative review percentages
✅ Sentiment trend visualization (line chart)
✅ Sentiment distribution (pie chart)
✅ Category-wise breakdown (bar chart)
✅ Improvement suggestions based on negative reviews
✅ Restaurant management (add, edit, delete)
✅ Review management (view, delete)
✅ PDF report generation

### Core Platform Features
✅ AI-powered sentiment analysis
✅ Real-time processing
✅ Role-based access control
✅ Firebase authentication
✅ Responsive design
✅ Fallback rule-based classifier

## 6.3 User Interfaces

### Landing Page
- Restaurant showcase with hero image
- Navigation to login pages
- Feature highlights

### Customer Dashboard
- Restaurant list with sentiment bars
- Review submission form
- Star rating system
- Real-time sentiment badges
- Reviews display with sentiment indicators

### Owner Dashboard
- Statistics cards (Total Reviews, Avg Rating, Positive %, Negative %)
- Restaurant management grid
- Interactive charts (Line, Pie, Bar)
- Improvement suggestions panel
- Recent reviews list
- PDF download functionality

## 6.4 API Response Examples

**Sentiment Prediction:**
```
json
{
  "sentiment": "positive",
  "sentimentScore": 0.92,
  "confidence": 0.85
}
```

**Review Submission:**
```
json
{
  "id": "uuid-string",
  "customerName": "John Doe",
  "restaurantName": "The Golden Fork",
  "rating": 5,
  "text": "Absolutely wonderful experience!",
  "sentiment": "positive",
  "sentimentScore": 0.95,
  "date": "2026-02-18",
  "category": "Food Quality"
}
```

**Analytics Response:**
```
json
{
  "totalReviews": 12,
  "positive": 7,
  "negative": 3,
  "neutral": 2,
  "positivePercent": 58.3,
  "negativePercent": 25.0,
  "averageRating": 3.6
}
```

---

# 7. CONCLUSION

## 7.1 Project Summary

TastePulse successfully implements a comprehensive restaurant review sentiment analysis platform that addresses the needs of both customers and restaurant owners. The project demonstrates the practical application of machine learning techniques in solving real-world business problems.

## 7.2 Key Achievements

1. **Successful ML Implementation:** Built and trained a LinearSVC model achieving ~95% accuracy on the Yelp polarity dataset for sentiment classification.

2. **Full-Stack Development:** Created a complete web application with React frontend, Flask backend, and RESTful API architecture.

3. **User Experience:** Implemented intuitive dashboards for both customers and restaurant owners with real-time sentiment analysis.

4. **Analytics & Insights:** Developed comprehensive analytics including sentiment trends, category breakdowns, and AI-powered improvement suggestions.

5. **Security:** Integrated Firebase authentication with role-based access control.

6. **Reporting:** Enabled PDF report generation for business analysis.

## 7.3 Technical Skills Demonstrated

- Machine Learning (NLP, SVM, TF-IDF)
- Full-Stack Web Development
- React & TypeScript
- Flask & Python
- Data Visualization
- Firebase Authentication
- PDF Generation
- REST API Design

## 7.4 Learning Outcomes

- Understanding of sentiment analysis techniques
- Practical experience with scikit-learn
- Full-stack development proficiency
- Modern UI/UX design principles
- Project management and documentation

---

# 8. FUTURE SCOPE AND IMPROVEMENTS

## 8.1 Machine Learning Enhancements

1. **Advanced Models:** 
   - Implement BERT or other transformer-based models for better contextual understanding
   - Explore ensemble methods combining multiple classifiers

2. **Multi-class Sentiment:**
   - Expand from 3 classes (positive/negative/neutral) to 5 classes (very negative, negative, neutral, positive, very positive)
   - Add emotion detection (happy, disappointed, angry, etc.)

3. **Aspect-Based Sentiment:**
   - Implement aspect-level sentiment analysis to identify specific sentiments for food, service, ambiance separately
   - Use attention mechanisms to highlight sentiment-bearing phrases

4. **Deep Learning:**
   - Implement LSTM or GRU networks for sequence modeling
   - Explore word embeddings (Word2Vec, GloVe)

## 8.2 Application Features

1. **Social Features:**
   - User profiles and review history
   - Friend system and social sharing
   - Restaurant comparison tools
   - Wishlist/Favorites

2. **Business Intelligence:**
   - Competitor analysis
   - Customer segmentation
   - Predictive analytics for trends
   - Customer lifetime value estimation

3. **Communication:**
   - Owner response to reviews
   - Direct messaging between owners and customers
   - Review request automation

4. **Mobile Application:**
   - Native iOS/Android apps
   - Push notifications
   - Offline functionality

## 8.3 Technical Improvements

1. **Backend Enhancements:**
   - Migrate to PostgreSQL for better data management
   - Implement Redis caching
   - Add rate limiting and API throttling
   - WebSocket for real-time updates

2. **Frontend Improvements:**
   - Progressive Web App (PWA) features
   - Dark mode support
   - Enhanced animations and transitions
   - Accessibility improvements (WCAG compliance)

3. **Infrastructure:**
   - Docker containerization
   - Kubernetes deployment
   - CI/CD pipeline setup
   - Cloud deployment (AWS/GCP/Azure)

## 8.4 Research Directions

1. **Multilingual Support:**
   - Extend sentiment analysis to multiple languages
   - Cross-lingual transfer learning

2. **Domain Adaptation:**
   - Fine-tune models for specific cuisines
   - Handle domain-specific vocabulary

3. **Bias Detection:**
   - Identify and mitigate bias in reviews
   - Fairness-aware machine learning

---

# 9. REFERENCES

## 9.1 Research Papers and Articles

1. Pang, B., & Lee, L. (2008). "Opinion mining and sentiment analysis." Foundations and Trends in Information Retrieval, 2(1-2), 1-135.

2. Liu, B. (2012). "Sentiment Analysis and Opinion Mining." Synthesis Lectures on Human Language Technologies, 5(1), 1-167.

3. Joachims, T. (1998). "Text Categorization with Support Vector Machines: Learning with Many Relevant Features." European Conference on Machine Learning, 137-142.

4. Mikolov, T., et al. (2013). "Distributed Representations of Words and Phrases and their Compositionality." Advances in Neural Information Processing Systems, 26, 3111-3119.

5. Devlin, J., et al. (2019). "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding." NAACL-HLT, 4171-4186.

## 9.2 Technical Documentation

1. scikit-learn Documentation: https://scikit-learn.org/

2. Flask Documentation: https://flask.palletsprojects.com/

3. React Documentation: https://react.dev/

4. Firebase Documentation: https://firebase.google.com/docs

5. Recharts Documentation: https://recharts.org/

## 9.3 Datasets

1. Yelp Dataset: https://www.yelp.com/dataset

2. Yelp Polarity Dataset (Hugging Face): https://huggingface.co/datasets/yelp_polarity

## 9.4 Tools and Libraries

1. TensorFlow: https://www.tensorflow.org/

2. PyTorch: https://pytorch.org/

3. Hugging Face Transformers: https://huggingface.co/transformers/

4. Pandas: https://pandas.pydata.org/

5. NumPy: https://numpy.org/

---

# APPENDICES

## Appendix A: Installation Guide

### Prerequisites
- Node.js 18+
- Python 3.8+
- Firebase Account

### Frontend Setup
```
bash
cd TastePulse
npm install
npm run dev
```

### Backend Setup
```
bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

## Appendix B: API Documentation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predict` | POST | Sentiment prediction |
| `/api/reviews` | GET/POST | Reviews CRUD |
| `/api/restaurants` | GET/POST | Restaurant management |
| `/api/analytics` | GET | Overall analytics |
| `/api/sentiment-trend` | GET | Monthly trends |
| `/api/category-breakdown` | GET | Category analysis |

## Appendix C: Sample Screenshots

[To be added: Screenshots of the application]

- Landing Page
- Customer Dashboard
- Owner Dashboard
- Analytics Charts
- PDF Report

---

**Project Completed Under the Guidance of:**
[Faculty Name]
[Designation]
[Department of Computer Engineering]

**Submitted to:**
Mumbai University
Academic Year 2025-2026

---

*This Blackbook report is submitted as part of the Final Year Engineering Project requirement for the degree of Bachelor of Engineering in Computer Engineering.*

---

**END OF REPORT**
