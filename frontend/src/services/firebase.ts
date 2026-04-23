import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBKkswYgjIDTlUyxW3cG1DCU8HWNGbEPzM",
  authDomain: "foodredistribution-35d95.firebaseapp.com",
  projectId: "foodredistribution-35d95",
  storageBucket: "foodredistribution-35d95.firebasestorage.app",
  messagingSenderId: "1016132983834",
  appId: "1:1016132983834:web:af00db51cc792d303185a3",
  measurementId: "G-002827BY37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
