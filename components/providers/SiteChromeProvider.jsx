'use client';

import { useEffect, useState } from 'react';
import { auth, signInWithGoogle, signInWithApple, logOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { translations } from '@/lib/news-utils';
import { SiteChromeContext } from '@/lib/news-contexts';

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

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
    </SiteChromeContext.Provider>
  );
}
