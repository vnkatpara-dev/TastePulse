import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAek58iwC7oe6ZzC1fY5dBqAfMuVDEy6Qs",
  authDomain: "tastepulse.firebaseapp.com",
  projectId: "tastepulse",
  storageBucket: "tastepulse.firebasestorage.app",
  messagingSenderId: "962400828502",
  appId: "1:962400828502:web:e5402b8adb8fe59282cff7"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization warning (Shields/offline mode):", error);
  app = {} as any;
  auth = {} as any;
  db = {} as any;
}

export { app, auth, db };
export default app;


