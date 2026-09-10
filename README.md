# TastePulse

<p align="center">
  <a href="https://tastepulse.onrender.com"><img src="https://img.shields.io/badge/Live%20App-tastepulse.onrender.com-blue?style=flat-square" alt="Live App"></a>
  <img src="https://img.shields.io/badge/React-18.3-blue?style=flat-square" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/Google%20Gemini-3.6%20Flash-orange?style=flat-square" alt="Google Gemini">
  <img src="https://img.shields.io/badge/Flask-3.0-green?style=flat-square" alt="Flask">
  <img src="https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square" alt="Firestore">
  <img src="https://img.shields.io/badge/scikit--learn-LinearSVC-yellow?style=flat-square" alt="scikit-learn">
</p>

TastePulse is an AI-powered restaurant intelligence and sentiment analytics platform. Beyond passive charts and traditional ML classification, TastePulse integrates **Action-Oriented AI** powered by **Google Gemini**—transforming guest sentiment into recovered revenue, kitchen recipe diagnostics, competitor vulnerability playbooks, and pre-inspection health audits.

---

## 🌐 Live Application & Authors

* **Live Deployment**: [https://tastepulse.onrender.com](https://tastepulse.onrender.com)
* **Authors**:
  * **Vivek Katpara** — [github.com/vnkatpara-dev](https://github.com/vnkatpara-dev)
  * **Adarsh Kore** — [github.com/Adarsh-GPT](https://github.com/Adarsh-GPT)

---

## 🧠 AI Operations & Intelligence Suite (Powered by Google Gemini)

TastePulse features 5 enterprise-tier operational engines built with Google Gemini Flash:

### 1. 🎯 Churn Win-Back Campaign Agent *(Revenue Recovery)*
* **Problem**: Owners flag high-risk customers who had a 1-star experience, but lack a clear strategy to win them back.
* **AI Action**: Reads the diner's exact complaint, visit history, and frequency. Formulates a psychologically sound 1-to-1 recovery email, tailored compensation offer (e.g. comped appetizer), and follow-up timeline.

### 2. 🍳 Culinary & Kitchen Recipe Diagnostic *(Kitchen Operations)*
* **Problem**: Menu item ratings drop, but the head chef cannot easily pinpoint whether it's seasoning, temperature, or portioning.
* **AI Action**: Scans negative guest mentions for declining dishes (e.g., *Truffle Pasta*). Pinpoints the exact root cooking flaw (*over-salting, soggy pasta, reheat issues*) and outputs step-by-step prep modifications for the line cooks.

### 3. 🛡️ Food Safety & Pre-Inspection Health Simulator *(Compliance)*
* **Problem**: Health department inspections can lead to severe fines or temporary shutdowns.
* **AI Action**: Analyzes reviews across all locations for critical health flags (*undercooked proteins, cross-contamination, pest sightings, sanitation lapses*). Computes an OSHA/Food Safety Inspection Risk Score (0–100) and drafts an immediate corrective action checklist.

### 4. ⚔️ Competitor Vulnerability Exploitation Playbook *(Strategic Marketing)*
* **Problem**: Owners lack actionable intelligence on where local rivals are falling short.
* **AI Action**: Evaluates multi-dimensional radar benchmarks (Food Quality, Service, Hygiene, Value, Ambiance). Identifies competitor weaknesses and generates an offensive marketing and hospitality playbook to capture their diners.

### 5. 👨‍🍳 Executive Chef Copilot ("Ask Your Restaurant Anything")
* **Problem**: Busy restaurateurs don't have time to slice and dice multi-tab reports.
* **AI Action**: Natural language query engine allowing owners to ask questions like *"Why is the dinner shift rating lower on weekends?"* or *"What are guests saying about portion sizes?"*, returning executive summaries with actionable recommendations.

### 6. ✨ 1-Click Smart Review Replies
* **Problem**: Writing manual responses to hundreds of reviews is time-consuming.
* **AI Action**: Generates personalized, empathetic public responses in 3 selectable brand voices (*Warm, Professional, Concise*), directly de-escalating grievances or thanking loyal regulars.

---

## 📌 User Portals & Features

### 1. 🍽️ Customer Feedback Terminal (Private & Unbiased)
* **Unbiased Rating Flow**: Rating stars start unselected (`0/5`, "Tap to rate"), requiring deliberate customer input.
* **Streamlined Category**: Default category set to `"General"` for fast, frictionless review submission.
* **Private Terminal Mode**: Public reviews and aggregate star ratings are hidden from customer view to prevent herd bias and protect guest privacy.
* **Instant Sentiment Analysis**: Real-time sentiment prediction displayed upon review submission.

### 2. 📊 Owner Intelligence Dashboard
* **Vast Reviews Feed (180+ Mock Reviews Pool)**:
  * Seed pool spanning 5 diverse restaurants (Italian, Indian, Seafood, Fast Casual, Japanese) with genuine customer commentary, dish mentions, and real owner reply threads.
  * **Quick Sentiment Filter Tabs**: Instant filtering by `All`, `Positive`, `Neutral`, and `Negative`.
  * **Keyword Search**: Search across dishes, server names, complaints, and compliments.
  * **Smooth Pagination**: Snappy initial 10-review render with `Load More (+10)` and `Show All` controls.
* **Dynamic Multi-Month Sentiment Trends**: Aggregates reviews across 6 calendar months (Sep to Feb).
* **Multi-Dimensional Competitor Benchmark**: Radar visualization comparing 5 core dimensions.
* **Menu Lifecycle Tracker**: Categorizes dish momentum (*Star, Rising, Mature, Declining*).
* **Executive PDF Export**: High-resolution downloadable reports for stakeholders.

---

## 🔒 Security & Data Architecture

* **Role-Based Access Control**: Verified server-side via Firebase Custom User Claims (`customer`, `owner`).
* **Deterministic Document IDs**: Review documents are keyed by `{restaurantId}_{authorUid}` to prevent duplicate submissions.
* **IDOR Protection**: Reviews and restaurants can only be modified or deleted by verified resource owners.
* **Atomic Transactions**: Ratings and counters use Firestore transactions (`runTransaction`) to eliminate race conditions.
* **Rate Limiting**: Prediction endpoints throttled via Flask-Limiter (`30 per minute; 500 per day`).
* **Environment Protection**: Sensitive keys (`VITE_GEMINI_API_KEY`, service account keys) are strictly ignored in `.gitignore`.

---

## 🛠 Tech Stack

* **Frontend**: React 18.3, TypeScript 5.8, Vite 5.4, Tailwind CSS 3.4, shadcn/ui, Recharts 2.15, Firebase Web SDK 12.9
* **AI & LLM**: Google Gemini 3.6 Flash (Structured JSON output mode via REST API)
* **Backend**: Python 3.11, Flask 3.0, Flask-Limiter 3.0, scikit-learn 1.3 (LinearSVC), Firebase Admin SDK 6.2
* **Database & Auth**: Cloud Firestore & Firebase Authentication

---

## 🚀 Setup & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/vnkatpara-dev/TastePulse.git
cd TastePulse
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Add your free Google Gemini API key:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
*(Get a free API key at [Google AI Studio](https://aistudio.google.com/))*

### 3. Frontend Setup
```bash
npm install
npm run dev
```
The Vite development server runs at `http://localhost:8080`.

### 4. Backend Setup (Optional for Demo Mode)
TastePulse features an automatic client-side demo store with 180 seed reviews. To run the Flask ML backend:
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python server.py
```
Backend runs at `http://localhost:5000`.

---

## 🧪 Testing & Verification

### Run Frontend Unit Tests
```bash
npm test
```

### TypeScript Validation
```bash
npx tsc --noEmit
```

### Backend Security & Concurrency Tests
```bash
python backend/test_security_and_concurrency.py
```

---

## 📡 API Reference

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/predict` | POST | Sentiment inference for review text | No (Rate-limited) |
| `/api/reviews` | GET | List reviews (supports pagination & filtering) | No |
| `/api/reviews` | POST | Add a review | Yes (Customer/Owner) |
| `/api/reviews/<id>` | DELETE | Delete review (author or owner) | Yes |
| `/api/restaurants` | GET | List registered restaurants | No |
| `/api/restaurants` | POST | Add restaurant | Yes (Owner) |
| `/api/restaurants/<id>` | PUT | Update restaurant | Yes (Owner) |
| `/api/restaurants/<id>` | DELETE | Delete restaurant | Yes (Owner) |
| `/api/analytics` | GET | Sentiment statistics summary | Yes (Owner) |
| `/api/sentiment-trend` | GET | Multi-month sentiment trends | Yes (Owner) |
| `/api/category-breakdown` | GET | Category sentiment breakdown | Yes (Owner) |
| `/api/auth/sync-user` | POST | Synchronize user role claims | Yes |
