import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              username: userData.username || firebaseUser.displayName || firebaseUser.email.split('@')[0],
              role: userData.role || 'player',
              skill_level: userData.skill_level || 'beginner',
              ranking_points: userData.ranking_points || 0,
              wins: userData.wins || 0,
              losses: userData.losses || 0,
              ...userData
            });
          } else {
            // Create user document if it doesn't exist
            const newUserData = {
              email: firebaseUser.email,
              username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              role: 'player',
              skill_level: 'beginner',
              ranking_points: 0,
              wins: 0,
              losses: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
            setUser({ id: firebaseUser.uid, ...newUserData });
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          // Still set basic user info from Firebase
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            role: 'player'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return false;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      // Create Firebase auth user
      const result = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );

      // Update display name
      if (userData.username) {
        await updateProfile(result.user, {
          displayName: userData.username
        });
      }

      // Create user document in Firestore
      const newUserData = {
        email: userData.email,
        username: userData.username || userData.email.split('@')[0],
        role: userData.role || 'player',
        skill_level: userData.skill_level || 'beginner',
        ranking_points: 0,
        wins: 0,
        losses: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', result.user.uid), newUserData);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCoach: user?.role === 'coach',
    isPlayer: user?.role === 'player',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
