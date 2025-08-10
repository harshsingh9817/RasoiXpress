// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration is now loaded from environment variables
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: any;
let db: any;
let storage: any;

// This check provides a clear error message if the environment variables are not set.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('REPLACE_WITH_')) {
    console.warn(`
      ********************************************************************************
      *                                                                              *
      *          Firebase configuration is missing or incomplete!                    *
      *                                                                              *
      *   Please update the NEXT_PUBLIC_FIREBASE_ variables in your .env file        *
      *   with the credentials from your Firebase project settings to enable         *
      *   database and authentication features.                                      *
      *                                                                              *
      ********************************************************************************
    `);
    // Initialize with dummy values to prevent app crash
    const dummyConfig = { apiKey: "dummy", authDomain: "dummy.firebaseapp.com", projectId: "dummy" };
    app = getApps().length ? getApps()[0] : initializeApp(dummyConfig);
} else {
  // Initialize Firebase
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
}

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (e) {
  console.error("Error initializing Firebase services. This may be due to missing configuration.");
  // Assign null or mock objects if initialization fails
  auth = null;
  db = null;
  storage = null;
}


export { app, auth, db, storage };
