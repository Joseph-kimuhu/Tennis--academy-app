// Firebase configuration for EPIC TENNIS ACADEMY
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBe6oqXZ_BJoe9IKTDXeaixcvwym6arNzw",
  authDomain: "tennis-academy-19edb.firebaseapp.com",
  projectId: "tennis-academy-19edb",
  storageBucket: "tennis-academy-19edb.firebasestorage.app",
  messagingSenderId: "559841736868",
  appId: "1:559841736868:web:d0d2fe293a6be4e84e8e31",
  measurementId: "G-2YK1X067VD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
