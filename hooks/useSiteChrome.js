'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteChromeContext } from '@/lib/news-contexts';
import useNewsletterSubscribe from './useNewsletterSubscribe';

// Shared header/footer chrome so utility pages like /my-city and /settings
// match the rest of the site. Dark mode, language, and logged-in user state
// come from the app-wide SiteChromeProvider (mounted in app/layout.js) so
// they never reset or flash across page navigation; everything else here
// (categories, breaking news, search, mobile view, newsletter, computed
// theme tokens) stays local per page exactly as before.
export default function useSiteChrome() {
  const router = useRouter();
  const shared = useContext(SiteChromeContext);

  const [categories, setCategories] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { newsletterEmail, setNewsletterEmail, newsletterLoading, handleNewsletterSubscribe } = useNewsletterSubscribe(shared.selectedLanguage);

  useEffect(() => {
    let timeout;
    const onResize = () => { clearTimeout(timeout); timeout = setTimeout(() => setIsMobileView(window.innerWidth <= 1159), 150); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    (async () => {
      try { const d = await fetch('/api/categories').then(r => r.json()); setCategories(d.categories || []); } catch (e) { console.error(e); }
      try { const d = await fetch('/api/news/breaking').then(r => r.json()); setBreakingNews(d.news || []); } catch (e) { console.error(e); }
    })();
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/?search=${encodeURIComponent(searchQuery)}`);
  };

  const bg = shared.dark ? '#0D1117' : '#F6F7F9';
  const surface = shared.dark ? '#161B27' : '#FFFFFF';
  const bdr = shared.dark ? '#252E40' : '#E8EAED';
  const T1 = shared.dark ? '#E8ECF0' : '#111827';
  const T2 = shared.dark ? '#9BA5B4' : '#4B5563';
  const T3 = '#8A8F98';
  const HEADER_H = isMobileView ? 105 : 204;

  return {
    router, ...shared,
    categories, breakingNews, selectedCategory, setSelectedCategory,
    isMobileView, isSearchActive, setIsSearchActive,
    searchQuery, setSearchQuery, handleSearch,
    newsletterEmail, setNewsletterEmail, newsletterLoading, handleNewsletterSubscribe,
    bg, surface, bdr, T1, T2, T3, HEADER_H,
  };
}
