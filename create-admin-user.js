// Script to create admin user in Firebase
const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to download service account key from Firebase Console)
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  const email = 'johnmakumi106@gmail.com';
  const password = 'password123'; // Change this to your desired password
  
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: 'John Makumi'
    });
    
    console.log('✅ User created in Firebase Auth:', userRecord.uid);
    
    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      username: 'John Makumi',
      role: 'coach',
      skill_level: 'advanced',
      ranking_points: 0,
      wins: 0,
      losses: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ User document created in Firestore');
    console.log('\nYou can now login with:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  }
  
  process.exit();
}

createAdminUser();
