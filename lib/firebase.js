// Firebase Client SDK Configuration
// TODO: Add your Firebase config in .env file

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier, OAuthProvider, signOut } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

import logger from '@/lib/logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Warn in dev if not configured
if (process.env.NODE_ENV !== 'production') {
  const missing = Object.entries(firebaseConfig).filter(([k, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    logger.warn('Firebase client config missing NEXT_PUBLIC_ env vars', { missing });
  }
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Auth Providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign in with Apple
export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Setup reCAPTCHA for phone auth
export const setupRecaptcha = (containerId) => {
  if (typeof window !== 'undefined') {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    });
    return window.recaptchaVerifier;
  }
  return null;
};

// Sign in with Phone Number
export const signInWithPhone = async (phoneNumber) => {
  try {
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    window.confirmationResult = confirmationResult;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Verify OTP
export const verifyOTP = async (otp) => {
  try {
    const result = await window.confirmationResult.confirm(otp);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get current user token
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

// Push Notifications
export const initializeMessaging = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        return { token, error: null };
      }
      return { token: null, error: 'Notification permission denied' };
    } catch (error) {
      return { token: null, error: error.message };
    }
  }
  return { token: null, error: 'Messaging not supported' };
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  if (typeof window !== 'undefined') {
    const messaging = getMessaging(app);
    return onMessage(messaging, callback);
  }
  return () => {};
};

export { app, auth };
