'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, signInWithGoogle, signInWithApple, logOut } from '@/lib/firebase';
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
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) return;
      try {
        const idToken = await firebaseUser.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } catch (err) {
        // Non-critical — worst case the cookie stays stale until the next
        // auth-state refresh (e.g. token refresh, next reload).
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
      setUser(null);
      toast.success('Signed out');
    } catch (err) {
      toast.error('Unable to sign out');
    }
  };

  // Returns true/false so callers that need to react only on a successful
  // sign-in (e.g. redirecting back to whatever page required login) can.
  const completeSignIn = async (result) => {
    if (result.error) { toast.error(result.error); return false; }
    const idToken = await result.user.getIdToken();
    const response = await fetch('/api/auth/session', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const session = await response.json();
    if (!session.success) { toast.error(session.message || 'Unable to create session'); return false; }
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
      user, authLoading, authDialogOpen, setAuthDialogOpen,
      handleGoogleSignIn, handleAppleSignIn, handleSignOut,
    }}>
      {children}
      <LocationDetectPrompt isSignedIn={!!user} dark={dark} isHindi={selectedLanguage === 'hi'} />
    </SiteChromeContext.Provider>
  );
}
