// Maps Firebase Auth error codes to something a reader can act on.
//
// The popup sign-in helpers in lib/firebase.js report the raw `code`; this is
// where that fact becomes display text, so the news UI never shows an SDK
// string like "Firebase: Error (auth/unauthorized-domain)." to a reader.
//
// Codes that mean "the user closed/abandoned the popup" are deliberately
// mapped to null: they're a normal gesture, not a failure worth a toast.
const SILENT_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

const MESSAGES = {
  // A configuration fault, not anything the reader did — say so plainly rather
  // than implying they mistyped something. The fix lives in the Firebase
  // console (Authentication → Settings → Authorized domains).
  'auth/unauthorized-domain': 'Sign-in is not available on this site yet. Please contact support.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window. Please allow pop-ups and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/account-exists-with-different-credential':
    'This email is already registered with a different sign-in method.',
  'auth/user-disabled': 'This account has been disabled.',
};

/**
 * @returns {string|null} text to show the reader, or null to stay silent
 *   (the user simply dismissed the popup).
 */
export function signInErrorMessage(code) {
  if (code && SILENT_CODES.has(code)) return null;
  return (code && MESSAGES[code]) || 'Unable to sign in. Please try again.';
}
