// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAuBnCG7d4EeQh3UQtRk-uch4atSxHHmW4",
  authDomain: "nibblenow-658c6.firebaseapp.com",
  projectId: "nibblenow-658c6",
  storageBucket: "nibblenow-658c6.firebasestorage.app",
  messagingSenderId: "690436478345",
  appId: "1:690436478345:web:c809361871edb5ad637d58",
  measurementId: "G-8BDCPEL1BN"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

export { app, auth };
