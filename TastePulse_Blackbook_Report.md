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

## 2.1 Background

The restaurant industry is highly competitive, where customer satisfaction can make or break a business. With the rise of online review platforms like Yelp, Google, and TripAdvisor, customers now share their dining experiences extensively, influencing the decisions of countless other potential patrons. These online reviews contain valuable feedback about food quality, service, ambiance, hygiene, and value for money. However, the sheer volume of reviews makes manual analysis impractical for restaurant owners who need timely insights to improve their operations. An automated sentiment analysis system that processes reviews and identifies customer opinions can help restaurant owners understand their strengths and weaknesses, respond proactively to customer concerns, and make data-driven decisions to enhance the overall dining experience.

## 2.2 Problem Definition

The problem at hand is to detect potential customer sentiments from restaurant reviews in real-time. Traditional monitoring methods rely on manual tracking or delayed reporting, which may fail to capture early warning signals. Hence, a machine learning-based approach is explored to automatically analyze reviews, quantify sentiment levels, and present insights to users through a secure and interactive dashboard.

## 2.3 Objectives

The primary objectives of this project are:

- To collect restaurant review data from the Yelp Polarity Dataset for sentiment analysis training and testing purposes.
- To clean, normalize, and preprocess textual data for Natural Language Processing (NLP) tasks.
- To implement machine learning-based sentiment analysis using TF-IDF vectorization with LinearSVC classifier.
- To develop an interactive web dashboard using React and Flask that displays model predictions and integrates Firebase authentication for secure sign-in and sign-out.
- To evaluate the performance of the machine learning model and deliver an operational prototype for real-time sentiment alerting.

## 2.4 Scope

This project focuses on:

- Analyzing restaurant review text only, without processing full articles or multimedia content.
- Working exclusively with English-language data from the Yelp Polarity Dataset.
- Implementing classical machine learning methods (TF-IDF + LinearSVC) instead of pre-trained transformer models.
- Applying supervised learning trained on labeled restaurant review data for sentiment classification.

The system is designed for real-time sentiment analysis of restaurant reviews and does not consider multilingual data, visual content analysis, or advanced deep learning models at this stage.

## 2.5 Applications

The developed system can be applied in:

- Restaurant Management: Providing early detection of potential customer dissatisfaction to help restaurant owners improve service quality.
- Customer Experience Enhancement: Analyzing feedback to identify specific areas such as food quality, service, ambiance, hygiene, and value for targeted improvements.
- Business Decision-Making: Assisting managers in evaluating customer sentiment from review data and taking timely corrective action.
- Competitive Analysis: Benchmarking restaurant performance against industry standards through quantitative sentiment metrics.
- Real-Time Monitoring: Continuous tracking of customer reviews to detect emerging trends and maintain high satisfaction levels.

## 2.6 Achievements

- Successfully collected and pre-processed restaurant review data from the Yelp Polarity Dataset, performing tokenization, normalization, and cleaning for NLP.
- Implemented sentiment analysis using TF-IDF vectorization with LinearSVC classifier for accurate sentiment classification.
- Developed a classical machine learning model achieving approximately 95% accuracy for detecting positive and negative sentiments in restaurant reviews.
- Built an operational web application with React frontend and Flask backend, integrated with Firebase authentication for secure user access.
- Evaluated model performance and produced a functional prototype demonstrating practical utility for restaurant sentiment analysis.

## 2.7 Organization of the Report

The report is structured as follows:

1. Introduction – Covers background, problem definition, objectives, scope, applications, and achievements of the project.
2. Dataset Description – Details the training dataset (Yelp Polarity) and application data structures.
3. Method and Algorithm – Explains the sentiment analysis approach including TF-IDF vectorization and LinearSVC classification.
4. Implementation – Describes the full-stack development including frontend, backend, authentication, and security implementations.
5. Final Result – Presents the model performance metrics and application features implemented.
6. Conclusion – Summarizes key findings and the practical utility of the system.
7. Future Scope and Improvements – Discusses potential enhancements including advanced ML models and additional features.
8. References – Lists all research papers, technical documentation, and resources used.

---

# 3. DATA DESCRIPTION

## 3.1 Important Attributes

### 1. Yelp Polarity Dataset (Training Data)
This dataset is used to train the machine learning model for sentiment classification. It contains restaurant reviews with polarity labels.

| Column Name | Description | Type |
|-------------|-------------|------|
| text | Text of the restaurant review in English | String |
| label | Sentiment label (0 = Negative, 1 = Positive) | Categorical |
| sentiment | Human-readable sentiment (negative/positive) | String |

### 2. Application Reviews Dataset
This dataset stores user-generated restaurant reviews in the application. It includes customer feedback with sentiment analysis results.

| Column Name | Description | Type |
|-------------|-------------|------|
| id | Unique identifier for the review | String (UUID) |
| customerName | Name of the customer who submitted the review | String |
| restaurantName | Name of the restaurant being reviewed | String |
| rating | Star rating from 1 to 5 | Integer |
| text | Full text content of the review | String |
| sentiment | Predicted sentiment (positive/negative/neutral) | Categorical |
| sentimentScore | Normalized sentiment score from 0.0 to 1.0 | Float |
| date | Date of review submission (YYYY-MM-DD format) | Date |
| category | Review category (Food Quality, Service, Ambiance, Hygiene, Value) | String |

### 3. Restaurants Dataset
This dataset contains information about registered restaurants in the system.

| Column Name | Description | Type |
|-------------|-------------|------|
| id | Unique identifier for the restaurant | String (UUID) |
| name | Name of the restaurant | String |
| cuisine | Type of cuisine served | String |
| averageRating | Average star rating (0.0 to 5.0) | Float |
| totalReviews | Total number of reviews received | Integer |

---

## 3.2 Algorithm Used

### Algorithm: Support Vector Machine (SVM) with TF-IDF for Restaurant Review Sentiment Analysis

Restaurant review sentiment analysis requires an efficient text classification approach that can handle high-dimensional sparse data from restaurant reviews. Support Vector Machine (SVM), specifically the Linear Support Vector Classifier (LinearSVC), provides a powerful and scalable solution for binary sentiment classification. Combined with TF-IDF (Term Frequency-Inverse Document Frequency) feature extraction, this approach achieves excellent performance on restaurant review sentiment detection.

#### Core Algorithm

Support Vector Machine is a supervised learning algorithm that finds the optimal hyperplane that maximally separates different classes in the feature space. For text classification tasks like sentiment analysis, LinearSVC is particularly effective because:

1. **High-Dimensional Efficiency:** Text data transformed via TF-IDF creates high-dimensional sparse vectors, which LinearSVC handles efficiently.
2. **Maximum Margin Classification:** SVM finds the hyperplane with the maximum margin between classes, providing better generalization.
3. **Kernel Trick:** While non-linear kernels can be used, the linear kernel works exceptionally well for text classification with TF-IDF features.

The algorithm works by:
- Mapping input text (TF-IDF vectors) to a high-dimensional feature space
- Finding the optimal separating hyperplane that maximizes the margin between positive and negative sentiment classes
- Using support vectors (critical data points) to define the decision boundary

#### Feature Engineering with TF-IDF

Text data must be converted to numerical features before machine learning classification. TF-IDF (Term Frequency-Inverse Document Frequency) is used to transform restaurant review text into meaningful numerical vectors:

**TF-IDF Formula:**
```
TF(t,d) = (Number of times term t appears in document d) / (Total terms in document d)

IDF(t) = log(Total documents / Documents containing term t)

TF-IDF(t,d) = TF(t,d) × IDF(t)
```

Where:
- `t` = term (word)
- `d` = document (review)
- `TF` = Term Frequency - measures how often a term appears in a document
- `IDF` = Inverse Document Frequency - measures how important a term is across all documents

**Configuration Used:**
```
python
TfidfVectorizer(
    max_features=50000,
    ngram_range=(1, 2),
    stop_words="english"
)
```

- `max_features=50000`: Limits vocabulary to top 50,000 most important terms
- `ngram_range=(1,2)`: Uses unigrams (single words) and bigrams (word pairs) for better context
- `stop_words="english"`: Removes common English words that don't carry sentiment meaning

#### Model Training with LinearSVC

LinearSVC is configured with balanced class weights to handle any class imbalance in the training data:

```
python
LinearSVC(class_weight="balanced")
```

The `class_weight="balanced"` parameter automatically adjusts weights inversely proportional to class frequencies, ensuring the model doesn't bias toward the majority class.

#### Prediction Process

1. **Input Processing:** New review text is preprocessed (lowercased, cleaned)
2. **Vectorization:** Text is transformed using the fitted TF-IDF vectorizer
3. **Prediction:** LinearSVC predicts sentiment (positive/negative) based on which side of the hyperplane the point falls
4. **Confidence Calculation:** The decision function score is converted to confidence:
```
confidence = 1 / (1 + |decision_score|)
```

#### Advantages and Real-World Applicability

1. **High Accuracy:** Achieves approximately 95-97% accuracy on restaurant review sentiment classification
2. **Fast Inference:** LinearSVC is computationally efficient, making it suitable for real-time sentiment prediction
3. **Scalable:** Handles large vocabulary sizes and high-dimensional data efficiently
4. **Interpretable:** The decision function provides confidence scores for predictions
5. **Robust:** Works well with TF-IDF features that capture term importance
6. **Low Memory:** Compared to deep learning models, requires minimal resources

---

## 3.3 Mathematical Representation

### Linear Support Vector Machine (LinearSVC)

The LinearSVC algorithm finds the optimal separating hyperplane that maximizes the margin between classes. Here's the mathematical formulation:

#### Linear Decision Function

For a given input vector **X** (TF-IDF features of a review), the decision function computes:

```
f(x) = w · x + b
```

Where:
- **w** = weight vector (learned by the model, perpendicular to the hyperplane)
- **x** = input feature vector (TF-IDF values of the review)
- **b** = bias term (offsets the hyperplane from origin)

#### Classification Decision

The predicted class is determined by the sign of the decision function:

```
Predicted Class = +1 (positive) if w · x + b > 0
                  -1 (negative) if w · x + b < 0
```

#### Maximum Margin Optimization

The SVM finds the optimal **w** and **b** by solving the following optimization problem:

```
Minimize: ||w||² / 2

Subject to: y_i(w · x_i + b) ≥ 1 for all training samples i
```

Where:
- `y_i` = actual label (+1 for positive, -1 for negative)
- The constraint ensures all points are on the correct side of the margin

This optimization maximizes the margin (distance between the hyperplane and nearest support vectors), leading to better generalization.

#### Hinge Loss Function

LinearSVC uses the hinge loss (linear SVM loss) for training:

```
L = (1/N) × Σ max(0, 1 - y_i(w · x_i + b))
```

Where:
- N = number of training samples
- y_i = actual label
- w · x_i + b = predicted decision value

The loss is 0 if the sample is correctly classified with margin > 1, otherwise it's proportional to the violation.

#### Regularization

The `class_weight="balanced"` parameter adds regularization by weighting the loss:

```
L = (1/N) × Σ c_i × max(0, 1 - y_i(w · x_i + b))

Where c_i = class_weight for the class of sample i
```

---

### TF-IDF Mathematical Representation

#### Term Frequency (TF)

```
TF(t,d) = (Count of term t in document d) / (Total terms in document d)
```

Example: If document d has 100 words and the word "excellent" appears 3 times, TF("excellent", d) = 3/100 = 0.03

#### Inverse Document Frequency (IDF)

```
IDF(t) = log(Total documents / Documents containing term t)
```

Example: If there are 10,000 documents and "excellent" appears in 50 documents, IDF("excellent") = log(10,000/50) = log(200) ≈ 5.3

#### TF-IDF Score

```
TF-IDF(t,d) = TF(t,d) × IDF(t)
```

This formula ensures:
- High TF (term appears often in document) → Higher score
- High DF (term appears in many documents) → Lower score (common words get penalized)

#### Vectorization Process

For a vocabulary of V terms, each document d is represented as a V-dimensional vector:

```
Document Vector(d) = [TF-IDF(t_1, d), TF-IDF(t_2, d), ..., TF-IDF(t_V, d)]
```

With max_features=50,000, the vector dimension is 50,000, creating a high-dimensional sparse feature space.

---

### Sentiment Score Calculation

The raw SVM prediction is converted to a normalized sentiment score (0-1 scale):

```
if prediction == "positive":
    sentiment_score = 0.5 + (confidence × 0.5)
    // Range: 0.5 to 1.0

elif prediction == "negative":
    sentiment_score = 0.5 - (confidence × 0.5)
    // Range: 0.0 to 0.5

else:
    sentiment_score = 0.5
    // Neutral
```

The confidence is derived from the decision function:

```
confidence = 1 / (1 + |decision_function|)
           = 1 / (1 + |w · x + b|)
```

This maps the unbounded decision function output to a [0, 1] confidence range.

---

## 3.4 Tools and Libraries Utilized

### 3.4.1 Programming Languages

- **Python** – Utilized for data preprocessing, model development, evaluation, and backend API development.

### 3.4.2 Libraries and Frameworks

- **pandas, numpy** – For efficient data handling, cleaning, and numerical computation during data preprocessing.
- **scikit-learn (sklearn)** – For TF-IDF vectorization, LinearSVC model training, and evaluation metrics (accuracy, precision, recall, F1-score).
- **joblib** – A library optimized for saving and loading large Python objects efficiently; used to store the trained LinearSVC model and TF-IDF vectorizer for fast real-time predictions.
- **Flask** – A lightweight web framework used to build the REST API backend for serving sentiment predictions and managing restaurant data.
- **Flask-CORS** – A Flask extension for handling Cross-Origin Resource Sharing (CORS), enabling the frontend to communicate with the backend API.
- **firebase_admin** – Used for secure user authentication and backend token verification for role-based access control.
- **React** – A JavaScript library for building the interactive frontend user interface with component-based architecture.
- **Recharts** – A charting library for React used to visualize sentiment trends, pie charts, and bar charts in the dashboard.
- **TypeScript** – A typed superset of JavaScript used for frontend development to ensure type safety and better developer experience.
- **Tailwind CSS** – A utility-first CSS framework used for styling the React frontend components.
- **shadcn/ui** – A collection of re-usable components built with Radix UI and Tailwind CSS for the frontend.
- **Vite** – A next-generation frontend build tool used for fast development and optimized production builds.
- **ESLint** – A static code analysis tool for identifying problematic patterns in JavaScript/TypeScript code.
- **uuid** – A library for generating unique identifiers for reviews and restaurants in the application.
- **json** – Built-in Python library for handling JSON data storage and serialization.

### 3.4.3 Development Environment

- **Visual Studio Code (VS Code)** – Integrated development environment for coding, debugging, and project management.
- **Node.js 18+** – JavaScript runtime environment for running the React frontend development server.
- **Python 3.8+** – Python runtime environment for running the Flask backend and ML model training.
- **CPU** – Hardware used for model training and inference (vectorized computations).

### 3.4.4 Summary

TastePulse is implemented in Python using a combination of data science, natural language processing, and deployment libraries. Core libraries like pandas and numpy handle data preprocessing and computation, while scikit-learn is applied for TF-IDF vectorization, LinearSVC modeling, and evaluation. For deployment, Flask provides a REST API backend, and firebase_admin ensures secure user authentication with role-based access control. Additionally, the json library enables smooth data handling and storage. The project is developed and tested in Visual Studio Code (VS Code), with CPU acceleration to optimize performance for model training and inference.

---

## 3.5 Dataset Summary

### 1. Yelp Polarity Dataset (Model Training)
- **Total Records:** 560,000 reviews (280,000 positive, 280,000 negative)
- **Training Split:** 100,000 samples (50,000 positive, 50,000 negative - balanced sampling)
- **Test Split:** 38,000 samples (full test set)
- **Total Columns:** 3 (text, label, sentiment)
- **Data Source:** Yelp Dataset from Hugging Face datasets
- **Domain:** Restaurant/Food reviews in English

### 2. Application Reviews Dataset
- **Total Records:** 12 (initial sample data)
- **Total Columns:** 9 (id, customerName, restaurantName, rating, text, sentiment, sentimentScore, date, category)
- **Data Format:** JSON

### 3. Restaurants Dataset
- **Total Records:** 3 (initial sample data)
- **Total Columns:** 5 (id, name, cuisine, averageRating, totalReviews)
- **Sample Restaurants:** The Golden Fork (Italian), Spice Route (Indian), Ocean Breeze (Seafood)

**Summary:** The datasets together provide both raw review data and labeled training information to build a machine learning system capable of detecting customer sentiments from restaurant reviews in near real-time.

---

## 3.5 Data Limitations

- **Review Length Variability:** Customer reviews vary significantly in length (10-500+ words), which may affect consistent sentiment detection.
- **Sentiment Ambiguity:** Short reviews may lack sufficient context, making some sentiments ambiguous or difficult to interpret accurately.
- **Domain-Specific Vocabulary:** The Yelp dataset contains domain-specific restaurant terminology that may not generalize perfectly to all restaurant contexts.
- **Class Imbalance in Raw Data:** Although balanced sampling is applied during training, the original dataset exhibits class imbalance that requires careful handling.
- **English Language Only:** The dataset is limited to English language reviews; multilingual coverage is not implemented.

---

# 4. METHOD AND ALGORITHM

## 4.1 Methodology

The methodology follows a structured approach, including data collection, preprocessing, feature extraction, model training, and evaluation. The key steps are:

### Step 1: Data Collection
- Restaurant reviews are collected from the Yelp Polarity Dataset, a publicly available benchmark dataset for sentiment analysis.
- The dataset contains 560,000 reviews (280,000 positive and 280,000 negative) sourced from the Yelp website.
- Reviews are obtained in raw text format with polarity labels (0 = negative, 1 = positive) from Hugging Face datasets.

### Step 2: Data Preprocessing
- **Cleaning:** Removed special characters, URLs, extra whitespace, and converted all text to lowercase for consistency.
- **Tokenization:** Headlines (reviews) are split into individual words/tokens for analysis.
- **Stop Word Removal:** Common English words (the, is, at, which, and, etc.) that do not carry sentiment meaning are removed.
- **N-gram Generation:** Both unigrams and bigrams (1,2) are extracted to capture single words and word pairs for better context.

### Step 3: Feature Extraction
- **TF-IDF Vectorization:** Applied to convert preprocessed text into numerical feature vectors.
- **TF-IDF Formula:**
  
```
  TF(t,d) = (Number of times term t appears in document d) / (Total terms in document d)
  IDF(t) = log(Total documents / Documents containing term t)
  TF-IDF(t,d) = TF(t,d) × IDF(t)
  
```
- **Configuration:**
  
```
python
  TfidfVectorizer(
      max_features=50000,
      ngram_range=(1, 2),
      stop_words="english"
  )
  
```
- **Parameters:** max_features=50000 limits vocabulary to top 50,000 terms; ngram_range=(1,2) uses unigrams and bigrams; stop_words="english" removes common English stop words.

### Step 4: Model Development
- A **LinearSVC (Linear Support Vector Classifier)** is trained on the TF-IDF vectors with labeled sentiment data.
- **How SVM Works:**
  1. **Hyperplane:** A decision boundary that separates positive and negative sentiment classes.
  2. **Support Vectors:** Data points closest to the hyperplane that define the margin.
  3. **Margin:** The distance between the hyperplane and support vectors (maximized during training).
  4. **Kernel:** Linear kernel used due to text data characteristics.
- **Model Configuration:**
  
```
python
  LinearSVC(class_weight="balanced")
  
```
- **class_weight="balanced":** Automatically adjusts weights inversely proportional to class frequencies, handling any class imbalance.
- The model learns to classify restaurant reviews into sentiment categories (positive/negative) indicating customer satisfaction levels.

### Step 5: Dashboard Integration
- A **React-based web dashboard** displays real-time sentiment analysis and predicted sentiment classifications.
- **Flask REST API** serves as the backend to handle requests and predictions.
- **Firebase Authentication** is used for secure sign-in/sign-out functionality with role-based access control (Owner vs Customer).
- Reviews and analytics data are stored in JSON format and served through RESTful endpoints.

### Step 6: Model Evaluation
- Model performance is evaluated using standard metrics: **Accuracy, Precision, Recall, and F1-Score**.
- Visualization of results on the dashboard helps assess reliability and operational utility.
- The model achieves approximately **95-97% accuracy** on the test dataset.

## 4.2 Sentiment Score Calculation

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

The confidence score is derived from the decision function:
```
python
decision_score = model.decision_function(text_vector)
confidence = 1 / (1 + abs(decision_score))
```

## 4.3 Fallback Classifier

If the ML model is unavailable, a **rule-based sentiment classifier** is used as fallback:

**Positive Keywords:** good, great, excellent, amazing, love, delicious, friendly, awesome, best, nice, fantastic, wonderful, perfect, stunning, phenomenal, impressive, warm, welcoming, fresh, divine, outstanding, superb

**Negative Keywords:** bad, terrible, awful, hate, horrible, rude, slow, worst, poor, disgusting, dirty, cold, overpriced, dismissive, lost, waited, hair, difficult, okay, decent

**Classification Logic:**
- Count positive and negative keyword matches in the review text.
- If positive keyword count > negative keyword count → Positive sentiment.
- If negative keyword count > positive keyword count → Negative sentiment.
- Otherwise → Neutral sentiment.

## 4.4 System Architecture

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

The system architecture follows a client-server model where the React frontend communicates with the Flask backend through RESTful API endpoints. The ML model (LinearSVC) and TF-IDF vectorizer are loaded at runtime for sentiment prediction. Firebase handles user authentication with role-based access control.

---

# 5. IMPLEMENTATION

## 5.1 Project Structure

The TastePulse project follows a modular architecture to separate concerns such as data storage, machine learning model serving, authentication, and frontend dashboard deployment. This structure enables maintainability, scalability, and clear separation of responsibilities between the backend API, machine learning components, and React-based frontend.

```
TastePulse/
├── backend/
│   ├── server.py                       # Flask REST API server
│   ├── model.py                        # ML model training script
│   ├── auth_middleware.py              # Firebase token verification
│   ├── requirements.txt                # Python dependencies
│   ├── restaurant_sentiment_model.pkl # Trained LinearSVC model
│   ├── tfidf_vectorizer.pkl           # TF-IDF vectorizer
│   └── reviews.json                    # JSON database
│
├── src/
│   ├── App.tsx                         # Main React application
│   ├── components/
│   │   ├── ProtectedRoute.tsx          # Route protection component
│   │   ├── SentimentBadge.tsx          # Sentiment display badge
│   │   ├── StarRating.tsx              # Star rating component
│   │   ├── StatCard.tsx                # Statistics card
│   │   └── ui/                         # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx             # Firebase authentication
│   ├── pages/
│   │   ├── Index.tsx                   # Landing page
│   │   ├── OwnerLogin.tsx              # Owner login page
│   │   ├── CustomerLogin.tsx           # Customer login page
│   │   ├── OwnerDashboard.tsx          # Owner dashboard
│   │   └── CustomerDashboard.tsx       # Customer dashboard
│   ├── services/
│   │   └── api.ts                      # API service layer
│   └── lib/
│       └── firebase.ts                  # Firebase configuration
│
├── package.json                         # Node.js dependencies
└── vite.config.ts                       # Vite build configuration
```

The backend directory contains the Flask server, machine learning model training script, authentication middleware, and persistent data storage in JSON format. The frontend directory follows a standard React project structure with components, pages, services, and utility libraries organized for clarity.

## 5.2 Data Loading and Exploration

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

TastePulse, an AI-powered restaurant review sentiment analysis platform, effectively identifies and classifies customer sentiments by analyzing reviews through advanced natural language processing. By combining text preprocessing, sentiment analysis, and machine learning, the system transforms raw review data into meaningful, actionable insights presented through an intuitive dual-dashboard interface designed for both restaurant owners and customers.

A major contributor to the system's success is the integration of comprehensive text preprocessing with a machine learning pipeline. Steps such as cleaning, lowercasing, tokenization, stop word removal, and vocabulary limitation ensure consistent text inputs for both feature extraction and model training. The use of TF-IDF vectorization with carefully selected parameters enabled efficient representation of review text, maximizing the extraction of sentiment-bearing linguistic features while minimizing computational overhead and overfitting risks.

The LinearSVC model, trained on TF-IDF-based features from the Yelp Polarity Dataset, achieved an accuracy of approximately 95% on the test set. Its focus on unigram and bigram features allowed the model to recognize both individual sentiment-bearing words and meaningful multi-word expressions linked to restaurant experiences, improving the precision of sentiment predictions. The use of balanced class weights ensured fair and effective classification across positive and negative sentiment categories.

The React and Firebase-based dashboard, secured with Firebase authentication, offers real-time visualization of sentiment distributions and category-based insights. By integrating the LinearSVC model with a fallback rule-based VADER classifier, the platform provides users with reliable sentiment analysis even under system constraints. This dual-classification approach enables decision-makers to respond quickly to customer feedback and identify areas requiring operational improvements.

While the system demonstrates strong performance, certain limitations persist, such as the English-only constraint, limited review context from TF-IDF's bag-of-words approach, and potential dataset bias from training on general Yelp data. Future improvements could involve integrating multilingual support, exploring transformer-based NLP models like BERT for better contextual understanding, and adding restaurant-specific domain features to further enhance accuracy and robustness.

Overall, this project highlights the practical potential of combining natural language processing and machine learning to create an operational, real-time sentiment analysis tool. TastePulse empowers restaurant owners and customers with timely insights, supporting data-driven decision-making to enhance service quality and customer satisfaction. The successful implementation demonstrates that thoughtful system design, from preprocessing to visualization, is essential for translating machine learning capabilities into business value in competitive industries like restaurant management.

---

# 8. FUTURE SCOPE AND IMPROVEMENTS

## 8.1 Model Optimization

To further improve prediction accuracy and robustness, the LinearSVC model can be systematically fine-tuned by adjusting critical hyperparameters such as:

- **Regularization Strength (C):** Experimenting with different C values to find the optimal balance between maximizing margin and minimizing classification error
- **Loss Function:** Exploring alternative loss functions (squared hinge loss vs. standard hinge loss) to improve convergence and generalization
- **Solver Type:** Comparing different solvers (liblinear, SAG, etc.) for different dataset sizes and configurations
- **Feature Scaling:** Implementing advanced normalization techniques (Log TF-IDF, L2 normalization) for better feature representation

Additionally, techniques such as feature selection using mutual information or chi-squared statistics, and dimensionality reduction via Principal Component Analysis (PCA), could help the model generalize better, reduce computational overhead, and make faster predictions while maintaining or improving accuracy on unseen restaurant review data.

## 8.2 Feature Engineering

Enhancing the quality and richness of input features can significantly boost sentiment prediction performance. Future improvements may include:

- **Entity Extraction:** Extracting restaurant-specific named entities such as dish names ("Biryani," "Risotto"), service aspects ("seating," "reservation"), and experience descriptors ("ambiance," "cleanliness") to better capture sentiment-bearing information
- **Advanced N-grams:** Utilizing higher-order n-grams (trigrams, 4-grams) to capture multi-word expressions critical to restaurant reviews (e.g., "very poor service," "absolutely amazing food")
- **Temporal Features:** Incorporating publication dates, review frequency patterns, and seasonal variations to understand how sentiment evolves over time and identify emerging issues
- **Sentiment Lexicon Enhancement:** Developing a restaurant-specific sentiment lexicon augmenting VADER with domain-specific words and expressions unique to the food service industry
- **Contextual Features:** Adding metadata such as reviewer history, star rating correlation, and review length to provide additional context for predictions

## 8.3 Data Expansion and Augmentation

A larger, more diverse, and higher-quality dataset can substantially improve the model's robustness and generalization capability:

- **Multi-Source Integration:** Incorporating reviews from diverse platforms (Google Reviews, TripAdvisor, Zomato) and various geographical regions to capture real-world variability in review language and sentiment expression
- **Cuisine-Specific Datasets:** Collecting and labeling reviews from different cuisine types (Italian, Indian, Chinese, etc.) to create specialized models that better understand cuisine-specific terminology and expectations
- **Multilingual Support:** Extending the system to process reviews in multiple languages such as Hindi, Spanish, French, Chinese, and German, allowing global applicability and serving diverse restaurant customer bases
- **Historical Sentiment Data:** Incorporating historical disruption and sentiment correction data with verified outcomes to strengthen supervised training and improve prediction reliability on long-term sentiment trends
- **Review Augmentation:** Utilizing techniques such as back-translation, synonym replacement, and paraphrasing to artificially expand the training dataset and improve model robustness to linguistic variations

## 8.4 Advanced NLP Models

Exploring state-of-the-art transformer-based models can capture deeper contextual and semantic relationships within restaurant reviews:

- **BERT and Variants:** Implementing BERT (Bidirectional Encoder Representations from Transformers) or its variants like RoBERTa and DistilBERT to understand complex language patterns and contextual word meanings
- **Fine-Tuned Models:** Pre-training transformer models on domain-specific restaurant review corpora and fine-tuning for sentiment classification to leverage transfer learning
- **Ensemble Approaches:** Combining LinearSVC predictions with transformer model outputs through weighted voting or stacking to leverage strengths of both classical and modern approaches
- **Aspect-Based Models:** Implementing aspect-aware transformers to perform aspect-level sentiment analysis simultaneously (e.g., "Service was slow but food was excellent")
- **Emotion Detection:** Extending beyond sentiment (positive/negative/neutral) to detect specific emotions (joy, disappointment, anger, frustration) for more nuanced feedback analysis
- **Explainability:** Using attention visualization from transformers to highlight which phrases and words drive sentiment predictions, improving transparency and trust

## 8.5 Real-Time Integration and Applications

The system can be upgraded to support live data integration and proactive business intelligence:

- **Live Data Streaming:** Integrating with real-time APIs from review platforms to automatically ingest and analyze reviews as they are posted
- **Instant Alerts:** Delivering real-time notifications through multiple channels:
  - Email alerts for critical negative reviews requiring immediate response
  - SMS notifications for time-sensitive issues
  - In-app push notifications for dashboard users
  - Webhook-based custom alerts for third-party integrations
- **Sentiment Threshold Triggers:** Configurable alerts when sentiment drops below defined thresholds, enabling proactive management
- **Competitive Monitoring:** Real-time tracking of competitor reviews and sentiment trends for competitive intelligence and market positioning
- **API Integrations:** Exposing sentiment analysis capabilities through REST/GraphQL APIs for integration with:
  - Third-party restaurant management systems
  - POS (Point of Sale) systems for operational feedback
  - CRM platforms for customer relationship management
  - Supply chain systems for ingredient quality feedback correlation

## 8.6 Improved Labeling and Data Quality Strategies

Reducing noise from auto-generated sentiment labels and improving annotation consistency through advanced validation approaches:

- **Semi-Supervised Learning:** Leveraging unlabeled review data through techniques like pseudo-labeling, self-training, and consistency regularization to improve model learning from limited labeled data
- **Active Learning:** Implementing intelligent sampling strategies to identify uncertain predictions and strategically select samples for human expert annotation, maximizing labeling efficiency
- **Human-in-the-Loop Validation:** Establishing a system where:
  - Expert reviewers validate model predictions on uncertain or edge-case reviews
  - Restaurant owners provide feedback on sentiment accuracy for their specific context
  - Continuous refinement of model predictions based on human feedback
- **Crowdsourcing:** Utilizing crowdsourced annotation with inter-rater agreement metrics to ensure consistency and reduce individual bias in labels
- **Iterative Model Refinement:** Periodically retraining the model on newly validated data to continuously improve performance and adapt to evolving review language patterns

## 8.7 Platform and Infrastructure Enhancements

### Backend and Data Infrastructure
- **Database Migration:** Transitioning from JSON file storage to PostgreSQL with proper indexing for efficient querying of large-scale review data
- **Caching Layer:** Implementing Redis caching for frequently accessed analytics data and sentiment predictions to reduce latency
- **Message Queue:** Setting up Kafka or RabbitMQ for asynchronous processing of review analysis and real-time notifications
- **Rate Limiting:** Implementing API rate limiting and quota management to prevent abuse and ensure fair resource utilization
- **Batch Processing:** Introducing Apache Spark or similar frameworks for efficient processing of large historical datasets

### Frontend and User Experience
- **Progressive Web App (PWA):** Converting the application to a PWA for offline functionality, installability, and improved mobile experience
- **Dark Mode Support:** Implementing theme support for better accessibility and reduced eye strain during extended dashboard usage
- **Advanced Visualizations:** Adding interactive 3D charts, heatmaps, and geospatial visualizations for multi-dimensional sentiment analysis
- **Accessibility (WCAG):** Ensuring full WCAG 2.1 AA compliance for screen readers, keyboard navigation, and inclusive design

### Deployment and Operations
- **Containerization:** Dockerizing both frontend and backend services for consistent development and production environments
- **Orchestration:** Deploying with Kubernetes for auto-scaling, load balancing, and high availability
- **CI/CD Pipeline:** Implementing automated testing, deployment, and monitoring using GitHub Actions, GitLab CI, or Jenkins
- **Cloud Deployment:** Migrating to cloud platforms (AWS, Google Cloud, Azure) with serverless options for cost-effective scaling
- **Monitoring and Logging:** Implementing comprehensive monitoring with ELK stack (Elasticsearch, Logstash, Kibana) and alerting for system health

## 8.8 Business Intelligence and Enterprise Features

### Advanced Analytics
- **Predictive Analytics:** Forecasting future sentiment trends and identifying potential service quality issues before they escalate
- **Customer Segmentation:** Clustering customers based on review patterns, preferences, and frequency to enable targeted improvements
- **Competitive Benchmarking:** Comparing sentiment metrics against industry averages and competitor restaurants for performance evaluation
- **ROI Analysis:** Measuring the business impact of operational improvements implemented based on sentiment insights

### Owner and Management Tools
- **Review Response Management:** Automated tools for drafting and tracking owner responses to reviews with sentiment-aware suggestions
- **Review Request System:** Automated campaigns to encourage satisfied customers to leave positive reviews
- **Staff Performance Metrics:** Correlating reviews with specific staff or time periods to identify high/low performers
- **Inventory Correlation:** Linking sentiment feedback to inventory changes, pricing adjustments, or menu modifications

### Multi-Restaurant Management
- **Portfolio Analytics:** Consolidated dashboards for chains managing multiple restaurants with branch-specific comparisons
- **Centralized Control:** Bulk operations for managing consistent branding and response policies across locations
- **Knowledge Sharing:** Best practice recommendations based on high-performing locations within the same chain

## 8.9 Mobile and Omnichannel Expansion

- **Native Mobile Apps:** Developing dedicated iOS and Android applications with:
  - Offline review submission capabilities
  - Location-based restaurant discovery
  - Photo upload/gallery for reviews
  - Biometric authentication
- **Voice Integration:** Adding voice-based review submission and accessibility features
- **Social Integration:** Direct sharing to social media platforms with sentiment-aware hashtag suggestions
- **Loyalty Program Integration:** Connecting reviews with reward systems and loyalty points

---

# 9. REFERENCES

- **Yelp Polarity Dataset (Hugging Face):** https://huggingface.co/datasets/yelp_polarity
- **Yelp Dataset:** https://www.yelp.com/dataset
- **scikit-learn Documentation** (TF-IDF, LinearSVC, evaluation metrics): https://scikit-learn.org/
- **pandas Documentation:** https://pandas.pydata.org/
- **Flask Documentation:** https://flask.palletsprojects.com/
- **React Documentation:** https://react.dev/
- **Firebase Documentation:** https://firebase.google.com/docs
- **Recharts Documentation:** https://recharts.org/
- **Tailwind CSS:** https://tailwindcss.com/
- **Vite Documentation:** https://vitejs.dev/

*Additional libraries and tools cited in implementation include TensorFlow, PyTorch, Hugging Face Transformers, NumPy, and UUID libraries as per project requirements.*

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
