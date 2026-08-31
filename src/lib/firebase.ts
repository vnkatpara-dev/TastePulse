// Firebase Configuration
// TODO: Replace these values with your actual Firebase config from https://console.firebase.google.com
// Go to Project Settings > General > Your apps > Web app

export const firebaseConfig = {
  apiKey: "AIzaSyAek58iwC7oe6ZzC1fY5dBqAfMuVDEy6Qs",
  authDomain: "tastepulse.firebaseapp.com",
  projectId: "tastepulse",
  storageBucket: "tastepulse.firebasestorage.app",
  messagingSenderId: "962400828502",
  appId: "1:962400828502:web:e5402b8adb8fe59282cff7"
};

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

