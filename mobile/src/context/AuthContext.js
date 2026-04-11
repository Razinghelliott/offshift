import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth, db } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Google auth request - configure with your Firebase project's client IDs
  // You can find these in Firebase Console > Authentication > Sign-in method > Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: '168641222703-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    expoClientId: '168641222703-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleCredential(id_token);
    }
  }, [response]);

  const handleGoogleCredential = async (idToken) => {
    try {
      setLoading(true);
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const parts = (userCredential.user.displayName || 'User').split(' ');
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          firstName: parts[0],
          lastName: parts.slice(1).join(' '),
          displayName: userCredential.user.displayName || '',
          photoURL: userCredential.user.photoURL || null,
          role: null,
          bio: null,
          location: 'Charleston, SC',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await loadUserProfile(userCredential.user);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Load user profile from Firestore
  const loadUserProfile = async (firebaseUser) => {
    if (!firebaseUser) {
      setUserProfile(null);
      return;
    }
    try {
      const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await loadUserProfile(firebaseUser);
      if (initializing) setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  // Sign in with Google (triggers the OAuth flow)
  const signInWithGoogle = async () => {
    await promptAsync();
  };

  // Sign in with email and password
  const signInWithEmail = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await loadUserProfile(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email, password, firstName, lastName) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        firstName: firstName || '',
        lastName: lastName || '',
        displayName: `${firstName} ${lastName}`.trim(),
        photoURL: null,
        role: null,
        bio: null,
        location: 'Charleston, SC',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await loadUserProfile(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    initializing,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    loadUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
