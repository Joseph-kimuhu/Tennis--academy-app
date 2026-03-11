// Script to deploy Firestore security rules
// Run this script to update the Firebase security rules

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Firebase configuration
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
const db = getFirestore(app);
const auth = getAuth(app);

async function testPermissions() {
  console.log("Testing Firebase permissions...");
  
  try {
    // Test authentication
    const userCredential = await signInWithEmailAndPassword(auth, "johnmakumi106@gmail.com", "john1234");
    console.log("✅ Authentication successful");
    console.log("User:", userCredential.user.email);
    
    // Test reading users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDoc(doc(usersRef, userCredential.user.uid));
    console.log("✅ Can read users collection");
    
    // Test creating a test match
    const testMatch = {
      tournament_id: "test_tournament",
      player1_id: "test_player1",
      player2_id: "test_player2",
      round: "1",
      scheduled_time: new Date().toISOString(),
      court_id: "test_court",
      status: "scheduled"
    };
    
    const matchesRef = collection(db, 'matches');
    const docRef = await addDoc(matchesRef, testMatch);
    console.log("✅ Can create matches - Match ID:", docRef.id);
    
    // Clean up test match
    await deleteDoc(doc(matchesRef, docRef.id));
    console.log("✅ Test match cleaned up");
    
    console.log("🎉 All permissions working correctly!");
    
  } catch (error) {
    console.error("❌ Permission test failed:", error);
    console.error("Error details:", error.code, error.message);
    
    if (error.code === 'permission-denied') {
      console.log("\n🔧 To fix this issue:");
      console.log("1. Go to Firebase Console: https://console.firebase.google.com/");
      console.log("2. Select your project: tennis-academy-19edb");
      console.log("3. Go to Firestore Database");
      console.log("4. Click on 'Rules' tab");
      console.log("5. Replace the rules with the content from firestore.rules file");
      console.log("6. Click 'Publish'");
    }
  }
}

// Run the test
testPermissions().then(() => {
  console.log("Permission test completed.");
  process.exit(0);
}).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
