'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, signInWithGoogle, signInWithApple, logOut } from '@/lib/firebase';
import { signInErrorMessage } from '@/lib/auth/signInErrorMessage';
import {
  markFirebaseAuthResolved,
  markSessionRequestStart,
  markSessionRequestEnd,
  markSessionReady,
} from '@/lib/auth/sessionTiming';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { translations } from '@/lib/news-utils';
import { SiteChromeContext } from '@/lib/news-contexts';
import { registerServiceWorkerAndToken, listenForegroundMessages } from '@/lib/notifications/registerPush';
import LocationDetectPrompt from '@/components/location/LocationDetectPrompt';

// Single source of truth for dark mode, language, and logged-in user state
// across the public site, so navigating between pages never re-reads
// localStorage or re-subscribes to Firebase auth from scratch.
export default function SiteChromeProvider({ children }) {
  const [dark, setDark] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  // See the onAuthStateChanged comment: gates authenticated fetches, not the UI.
  const [sessionReady, setSessionReady] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const router = useRouter();
  const registeredUidRef = useRef(null);

  const t = translations[selectedLanguage];

  useEffect(() => {
    const saved = localStorage.getItem('news_language');
    setSelectedLanguage(saved || 'hi');
    if (!saved) localStorage.setItem('news_language', 'hi');
    setLanguageLoaded(true);
  }, []);

  useEffect(() => {
    if (languageLoaded) localStorage.setItem('news_language', selectedLanguage);
  }, [selectedLanguage, languageLoaded]);

  useEffect(() => {
    const d = localStorage.getItem('newsdesk_dark');
    if (d === 'true') setDark(true);
  }, []);

  // Firebase persists sign-in across reloads on its own (independent of this
  // app's server), but the httpOnly `khabaron_session` cookie that every
  // authenticated API route actually checks was previously only ever set
  // once, inside completeSignIn()'s interactive click handler. If that
  // cookie ever went missing (cleared cookies, its 7-day expiry lapsing,
  // etc.) while Firebase still remembered the user, the client kept
  // believing it was signed in and every authenticated request 401ed
  // forever, with nothing to re-establish the cookie. Re-exchanging the ID
  // token here, on every auth-state hydration (not just interactive
  // sign-in), keeps the server session in sync with Firebase automatically.
  /**
   * `user` and `sessionReady` answer two different questions, and conflating
   * them is what caused the post-login 401s:
   *
   *   user         — Firebase says someone is signed in. Drives UI (avatar,
   *                  menus). Published immediately so the UI is not laggy.
   *   sessionReady — the httpOnly `khabaron_session` cookie now exists, so
   *                  authenticated API calls will actually be authorised.
   *
   * Every data fetch keyed only on `user` fired the instant Firebase resolved,
   * which on a first sign-in (or after cleared cookies / a lapsed 7-day
   * expiry) was *before* the cookie existed — producing a burst of 401s on
   * /api/users/bookmarks/ids, /api/users/following and /api/users/location
   * while authentication itself was perfectly healthy. Those fetches now gate
   * on `sessionReady` instead.
   */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      markFirebaseAuthResolved(firebaseUser?.uid);

      // Publish the user immediately: the UI should reflect sign-in at once.
      setUser(firebaseUser);

      if (!firebaseUser) {
        setSessionReady(false);
        return;
      }

      // A new auth event means the cookie for the *previous* identity must not
      // be treated as valid for this one.
      setSessionReady(false);

      try {
        const idToken = await firebaseUser.getIdToken();
        markSessionRequestStart();
        const res = await fetch('/api/auth/session', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        markSessionRequestEnd(res.status);

        // Only open the gate when the server actually issued a session. A
        // non-2xx here means the cookie was not set, so unblocking would just
        // reproduce the 401s this gate exists to prevent.
        if (res.ok) {
          setSessionReady(true);
          markSessionReady();
        } else {
          console.error('Session establishment failed with status', res.status);
        }
      } catch (err) {
        // Non-critical — the cookie stays stale until the next auth-state
        // refresh (token refresh, next reload). The gate stays shut, so
        // dependent fetches simply don't run rather than 401ing.
        console.error('Session refresh failed on auth-state change:', err);
      }
    });
    return unsub;
  }, []);

  // Register the push token once per signed-in user (not on every render/tab
  // focus) — guarded by a ref rather than state so it never re-triggers a
  // permission prompt for the same uid across re-renders.
  useEffect(() => {
    if (!user || registeredUidRef.current === user.uid) return;
    registeredUidRef.current = user.uid;
    registerServiceWorkerAndToken();
  }, [user]);

  // Foreground pushes (tab open + focused) never reach the service worker's
  // background handler, so surface them as a toast with the same deep-link
  // behavior as a background notification click.
  useEffect(() => {
    const unsubscribe = listenForegroundMessages((payload) => {
      const notification = payload.notification || {};
      const deepLink = payload.data?.deepLink || '/';
      toast(notification.title || 'KhabarON', {
        description: notification.body,
        action: { label: 'Open', onClick: () => router.push(deepLink) },
      });
    });
    return unsubscribe;
  }, [router]);

  const toggleDark = () => setDark(p => {
    localStorage.setItem('newsdesk_dark', String(!p));
    return !p;
  });

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      const r = await logOut();
      if (r.error) { toast.error(r.error); return; }
      setSessionReady(false);
      setUser(null);
      toast.success('Signed out');
    } catch (err) {
      toast.error('Unable to sign out');
    }
  };

  // Returns true/false so callers that need to react only on a successful
  // sign-in (e.g. redirecting back to whatever page required login) can.
  const completeSignIn = async (result) => {
    if (result.error) {
      // Keep the raw SDK string in the console for diagnosis, but show the
      // reader the mapped message instead of "Firebase: Error (auth/...)".
      console.error('Sign-in failed:', result.code, result.error);
      const message = signInErrorMessage(result.code);
      if (message) toast.error(message);
      return false;
    }
    const idToken = await result.user.getIdToken();
    const response = await fetch('/api/auth/session', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const session = await response.json();
    if (!session.success) { toast.error(session.message || 'Unable to create session'); return false; }
    setSessionReady(true);
    markSessionReady();
    setUser(result.user);
    setAuthDialogOpen(false);
    toast.success('Signed in!');
    return true;
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try { return await completeSignIn(await signInWithGoogle()); }
    catch (err) { console.error(err); toast.error('Unable to sign in'); return false; }
    finally { setAuthLoading(false); }
  };

  const handleAppleSignIn = async () => {
    setAuthLoading(true);
    try { return await completeSignIn(await signInWithApple()); }
    catch (err) { console.error(err); toast.error('Unable to sign in'); return false; }
    finally { setAuthLoading(false); }
  };

  return (
    <SiteChromeContext.Provider value={{
      dark, toggleDark,
      selectedLanguage, setSelectedLanguage, translations, t,
      user, sessionReady, authLoading, authDialogOpen, setAuthDialogOpen,
      handleGoogleSignIn, handleAppleSignIn, handleSignOut,
    }}>
      {children}
      <LocationDetectPrompt isSignedIn={!!user} dark={dark} isHindi={selectedLanguage === 'hi'} />
    </SiteChromeContext.Provider>
  );
}
