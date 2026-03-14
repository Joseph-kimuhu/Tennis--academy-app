import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function CreateJohnMakumi() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('TempPassword123!');

  const createJohnMakumi = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // First try to sign in to get his user ID
      let user;
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          'johnmakumi106@gmail.com', 
          password
        );
        user = userCredential.user;
        setMessage('🔐 Found John Makumi in Firebase Auth!');
      } catch (signInError) {
        if (signInError.code === 'auth/user-not-found') {
          // Create Firebase Auth user if doesn't exist
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            'johnmakumi106@gmail.com', 
            password
          );
          user = userCredential.user;
          
          // Update profile
          await updateProfile(user, {
            displayName: 'johnmakumi'
          });
          setMessage('📝 Created John Makumi in Firebase Auth!');
        } else {
          throw signInError;
        }
      }
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setMessage(`✅ John Makumi already exists in Firestore with role: ${userData.role}`);
        
        // Update role to admin if not already
        if (userData.role !== 'admin') {
          await setDoc(userDocRef, {
            ...userData,
            role: 'admin',
            updated_at: serverTimestamp()
          }, { merge: true });
          setMessage(`✅ Updated John Makumi's role to admin! Was: ${userData.role}`);
        }
      } else {
        // Create user document in Firestore
        await setDoc(userDocRef, {
          id: user.uid,
          username: 'johnmakumi',
          email: 'johnmakumi106@gmail.com',
          role: 'admin',
          skill_level: 'advanced',
          wins: 0,
          losses: 0,
          ranking_points: 0,
          is_active: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        setMessage('✅ Created John Makumi in Firestore with admin role!');
      }
      
      // Sign out the user
      await auth.signOut();
      
    } catch (error) {
      console.error('Error with John Makumi account:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const checkExistingUser = async () => {
    setMessage('Checking for existing John Makumi...');
    
    try {
      // This would require a custom API call to check if user exists
      // For now, let's just try to create and handle the error
      await createJohnMakumi();
    } catch (error) {
      console.error('Check failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Create John Makumi Account</h2>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h4>Purpose:</h4>
        <p>John Makumi can login to the app but doesn't appear in user lists. This tool ensures he exists in both Firebase Auth AND Firestore with admin role.</p>
        
        <h4>What This Does:</h4>
        <ul>
          <li>✅ Checks if John exists in Firebase Auth</li>
          <li>✅ Creates him in Auth if missing</li>
          <li>✅ Checks if John exists in Firestore</li>
          <li>✅ Creates/updates his Firestore document with admin role</li>
          <li>✅ Ensures he appears in message dropdown</li>
        </ul>
        
        <h4>Account Details:</h4>
        <ul>
          <li><strong>Email:</strong> johnmakumi106@gmail.com</li>
          <li><strong>Username:</strong> johnmakumi</li>
          <li><strong>Role:</strong> admin</li>
          <li><strong>Password:</strong> {password} (current login password)</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Temporary Password:
        </label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ 
            padding: '8px', 
            width: '200px',
            border: '1px solid #ddd',
            borderRadius: '3px'
          }}
        />
        <small style={{ display: 'block', color: '#666' }}>
          John can change this after first login
        </small>
      </div>

      <button
        onClick={createJohnMakumi}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? 'Creating Account...' : 'Create John Makumi'}
      </button>

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
        <h4>After Creation:</h4>
        <ol>
          <li>John Makumi will exist in Firebase Auth</li>
          <li>John Makumi will exist in Firestore users collection</li>
          <li>Players will be able to message him</li>
          <li>He can login with the email and password above</li>
          <li>Remove this component after use</li>
        </ol>
      </div>
    </div>
  );
}

export default CreateJohnMakumi;
