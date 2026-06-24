# TastePulse Deployment Guide

This guide describes how to deploy the TastePulse application (Flask backend + Vite React frontend) online using **Render** (free hosting).

## Prerequisites
1. A **GitHub** account.
2. A **Render** account (sign up at [render.com](https://render.com)).
3. A **Firebase** project with a configured Firestore database.

---

## 🐍 1. Deploy the Backend (Flask API) on Render

We will host the Flask API as a **Render Web Service**.

1. **Commit and push** all your latest code changes to your GitHub repository (ensure `backend/requirements.txt` has `gunicorn` and the latest code is pushed).
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. Configure the Web Service settings:
   - **Name**: `tastepulse-api`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn --chdir backend server:app`
6. Scroll down and click **Advanced** to add Environment Variables:
   - **`FIREBASE_SERVICE_ACCOUNT_KEY_JSON`**: Paste the entire JSON content of your local `backend/serviceAccountKey.json` credential file here.
7. Click **Create Web Service** at the bottom.
8. Wait for the build and deployment to complete. Render will display a live URL (e.g., `https://tastepulse-api.onrender.com`). **Copy this URL**.

---

## ⚛️ 2. Deploy the Frontend (Vite/React) on Render

We will host the React frontend as a **Render Static Site**.

1. In the Render Dashboard, click **New +** and select **Static Site**.
2. Connect your GitHub repository.
3. Configure the Static Site settings:
   - **Name**: `tastepulse`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Click **Advanced** to add Environment Variables:
   - **`VITE_API_URL`**: Paste the URL of your deployed backend (e.g., `https://tastepulse-api.onrender.com/api` - make sure to append `/api` at the end).
5. Click **Create Static Site**.
6. Once deployed, click the provided site link to open your live application!

---

## 🔒 3. Configure Firebase Authorized Domains

To allow Google Sign-in to work from your new live website URL:
1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Navigate to **Authentication** > **Settings** tab.
3. Under **Authorized domains**, click **Add domain**.
4. Paste the domain of your newly deployed frontend site (e.g., `tastepulse.onrender.com`).
5. Click **Add**.
