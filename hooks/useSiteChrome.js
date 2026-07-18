'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, signInWithGoogle, signInWithApple, logOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { translations } from '@/lib/news-utils';
import useNewsletterSubscribe from './useNewsletterSubscribe';

// Shared header/footer chrome (auth, theme, language, categories, breaking news)
// so utility pages like /my-city and /settings match the rest of the site.
export default function useSiteChrome() {
  const router = useRouter();

  const [dark, setDark] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { newsletterEmail, setNewsletterEmail, newsletterLoading, handleNewsletterSubscribe } = useNewsletterSubscribe(selectedLanguage);

  const t = translations[selectedLanguage];

  useEffect(() => {
    let timeout;
    const onResize = () => { clearTimeout(timeout); timeout = setTimeout(() => setIsMobileView(window.innerWidth <= 1159), 150); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('news_language');
    setSelectedLanguage(saved || 'hi');
    if (!saved) localStorage.setItem('news_language', 'hi');
    setLanguageLoaded(true);
  }, []);

  useEffect(() => { if (languageLoaded) localStorage.setItem('news_language', selectedLanguage); }, [selectedLanguage, languageLoaded]);

  useEffect(() => {
    const d = localStorage.getItem('newsdesk_dark');
    if (d === 'true') setDark(true);
  }, []);

  useEffect(() => { const unsub = onAuthStateChanged(auth, setUser); return unsub; }, []);

  useEffect(() => {
    (async () => {
      try { const d = await fetch('/api/categories').then(r => r.json()); setCategories(d.categories || []); } catch (e) { console.error(e); }
      try { const d = await fetch('/api/news/breaking').then(r => r.json()); setBreakingNews(d.news || []); } catch (e) { console.error(e); }
    })();
  }, []);

  const toggleDark = () => setDark(p => { localStorage.setItem('newsdesk_dark', String(!p)); return !p; });

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/?search=${encodeURIComponent(searchQuery)}`);
  };

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

  const completeSignIn = async (result) => {
    if (result.error) { toast.error(result.error); return; }
    const idToken = await result.user.getIdToken();
    const response = await fetch('/api/auth/session', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const session = await response.json();
    if (!session.success) { toast.error(session.message || 'Unable to create session'); return; }
    setUser(result.user);
    setAuthDialogOpen(false);
    toast.success('Signed in!');
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try { await completeSignIn(await signInWithGoogle()); }
    catch (err) { console.error(err); toast.error('Unable to sign in'); }
    finally { setAuthLoading(false); }
  };

  const handleAppleSignIn = async () => {
    setAuthLoading(true);
    try { await completeSignIn(await signInWithApple()); }
    catch (err) { console.error(err); toast.error('Unable to sign in'); }
    finally { setAuthLoading(false); }
  };

  const bg = dark ? '#0D1117' : '#F6F7F9';
  const surface = dark ? '#161B27' : '#FFFFFF';
  const bdr = dark ? '#252E40' : '#E8EAED';
  const T1 = dark ? '#E8ECF0' : '#111827';
  const T2 = dark ? '#9BA5B4' : '#4B5563';
  const T3 = '#8A8F98';
  const HEADER_H = isMobileView ? 105 : 204;

  return {
    router, dark, toggleDark, selectedLanguage, setSelectedLanguage, translations, t,
    user, authLoading, authDialogOpen, setAuthDialogOpen, handleGoogleSignIn, handleAppleSignIn, handleSignOut,
    categories, breakingNews, selectedCategory, setSelectedCategory,
    isMobileView, isSearchActive, setIsSearchActive,
    searchQuery, setSearchQuery, handleSearch,
    newsletterEmail, setNewsletterEmail, newsletterLoading, handleNewsletterSubscribe,
    bg, surface, bdr, T1, T2, T3, HEADER_H,
  };
}
