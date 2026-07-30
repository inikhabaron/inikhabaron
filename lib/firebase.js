// Firebase Client SDK Configuration
// TODO: Add your Firebase config in .env file

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier, OAuthProvider, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Auth Providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// `code` is carried alongside `error` because error.message alone is a
// developer-facing string ("Firebase: Error (auth/unauthorized-domain).") that
// used to be toasted verbatim at readers. The code is the stable, matchable
// fact; deciding what a reader should see belongs to the UI (see
// lib/auth/signInErrorMessage.js).
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null, code: null };
  } catch (error) {
    return { user: null, error: error.message, code: error.code || null };
  }
};

// Sign in with Apple
export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return { user: result.user, error: null, code: null };
  } catch (error) {
    return { user: null, error: error.message, code: error.code || null };
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

// Push notification registration lives in lib/notifications/registerPush.js
// (uses `app` below) — keeps `firebase/messaging` out of every page that
// only needs auth.

export { app, auth };
