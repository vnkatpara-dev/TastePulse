# Firebase Authentication Setup Guide

Follow these steps to complete the Firebase authentication setup:

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the prompts
3. Name your project (e.g., "tastepulse")

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Optionally enable "Email link (passwordless sign-in)"
   - Click **Save**

## Step 3: Get Firebase Config

1. Go to **Project Settings** (gear icon next to Project Overview)
2. Scroll down to **Your apps**
3. Click the **Web** icon (`</>`)
4. Register app (e.g., "tastepulse-web")
5. Copy the `firebaseConfig` object

## Step 4: Update Frontend Config

Edit `src/lib/firebase.ts` and replace the placeholder values:

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

## Step 5: Setup Backend (Optional - for production)

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. Save the JSON file as `serviceAccountKey.json` in the `backend/` folder
4. The backend will use this for token verification

**Note**: The backend is configured to run in development mode (without Firebase verification) if the service account key is not found. This allows testing without full Firebase setup.

## How It Works

### User Roles
- **Owner**: Can access Owner Dashboard, manage restaurants, view analytics
- **Customer**: Can access Customer Dashboard, view restaurants, add reviews

### Authentication Flow
1. User signs up/login via Firebase Authentication
2. Role is stored in localStorage (simplified approach)
3. Frontend sends Firebase ID token with each API request
4. Backend verifies token and checks role for protected endpoints

### Protected Routes (Backend)
- `POST /api/reviews` - Requires authentication
- `POST /api/restaurants` - Requires owner role
- `DELETE /api/restaurants/<id>` - Requires owner role
- `PUT /api/restaurants/<id>` - Requires owner role
- `GET /api/analytics` - Requires owner role
- `GET /api/sentiment-trend` - Requires owner role
- `GET /api/category-breakdown` - Requires owner role

## Running the Application

### Frontend
```
bash
npm run dev
```

### Backend
```
bash
cd backend
pip install -r requirements.txt
python server.py
```

The app will be available at `http://localhost:5173` and the API at `http://localhost:5000`.
