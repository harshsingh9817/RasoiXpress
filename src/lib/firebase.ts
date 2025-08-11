// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-lbYRzDMQCfAYUniT4ec-jkZ_okUWpW0",
  authDomain: "rasoi-express-bd581.firebaseapp.com",
  projectId: "rasoi-express-bd581",
  storageBucket: "rasoi-express-bd581.appspot.com",
  messagingSenderId: "344874952353",
  appId: "1:344874952353:web:20309745abe5f0eab872e0",
  measurementId: "G-QX9VFYXNB4"
};


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
