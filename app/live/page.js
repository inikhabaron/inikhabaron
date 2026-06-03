'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, signInWithGoogle, signInWithApple, logOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import Image from 'next/image';
import { Newspaper, Crown, ChevronDown } from 'lucide-react';

// ─── Layout & UI components ───────────────────────────────────────────────────
import Header from '@/components/home/Header';
import TrendingBar from '@/components/home/TrendingBar';
import LiveCard from '@/components/home/LiveCard';
import HorizontalArticleCard from '@/components/home/HorizontalArticleCard';
import ArticleCard from '@/components/home/ArticleCard';
import LatestNews from '@/components/home/LatestNews';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import SiteFooter from '@/components/home/SiteFooter';
// import ArticleModal from '@/components/home/ArticleModal';
import AuthDialog from '@/components/home/AuthDialog';
import SubscriptionPlans from '@/components/home/SubscriptionPlans';
import MobileSearch from '@/components/home/MobileSearch';

// ─── Shared utilities & contexts ──────────────────────────────────────────────
import { DarkCtx, FontCtx } from '@/lib/news-contexts';
import { ACCENT, ACCENT_H, EDITORIAL_RED, FONT_OPTIONS, translations, getCatAccent, getCatLabel, formatDate } from '@/lib/news-utils';

// home.css is imported globally via layout.js — plain kn-* class names used below

// ─── Loader ───────────────────────────────────────────────────────────────────
const Loader = () => <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="loader" /></div>;

// ─── HomePage ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  // ── Data state ───────────────────────────────────────────────────────────
  const [news, setNews] = useState([]);
  const [breakingNews, setBreaking] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
//   const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // ── Auth state ───────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  // ── Preferences ──────────────────────────────────────────────────────────
  const [dark, setDark] = useState(false);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [textScale] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [languageLoaded, setLanguageLoaded] = useState(false);

  // ── Misc ─────────────────────────────────────────────────────────────────
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [youtubeLive, setYoutubeLive] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNLLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(null);

  const shareMenuRef = useRef(null);
  const router = useRouter();
  const goToArticle = (item) => router.push(`/news/${item.id}`);
  const t = translations[selectedLanguage];

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let timeout;
    const onResize = () => { clearTimeout(timeout); timeout = setTimeout(() => setIsMobileView(window.innerWidth <= 1159), 150); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isMobileView || !searchQuery.trim()) return;
    const t = setTimeout(() => fetchNews(selectedCategory, searchQuery, 1), 400);
    return () => clearTimeout(t);
  }, [searchQuery, selectedCategory, isMobileView]);

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
    const f = localStorage.getItem('newsdesk_font');
    if (f) { const found = FONT_OPTIONS.find(o => o.label === f); if (found) setSelectedFont(found); }
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) setShowShareMenu(null); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { const unsub = onAuthStateChanged(auth, setUser); return unsub; }, []);

  useEffect(() => {
    const saved = localStorage.getItem('newsdesk_user_id');
    if (saved) { setUserId(saved); return; }
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('newsdesk_user_id', id);
    setUserId(id);
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchNews = useCallback(async (cat = 'all', search = '', pageNum = 1) => {
    try {
      setLoading(true);
      let url = `/api/news?page=${pageNum}&limit=20`;
      if (cat && cat !== 'all') url += `&category=${cat}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const d = await fetch(url).then(r => r.json());
      if (pageNum === 1) setNews(d.news || []); else setNews(p => [...p, ...(d.news || [])]);
      setHasMore(d.pagination?.page < d.pagination?.pages);
    } catch (e) { console.error(e); toast.error('Failed to load news'); }
    finally { setLoading(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      // Check localStorage cache first
      const cached = localStorage.getItem('kn_categories_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 60 * 60 * 1000) { // 1 hour cache
          setCategories(data);
          return;
        }
      }
      const d = await fetch('/api/categories').then(r => r.json());
      setCategories(d.categories || []);
      // Cache locally
      localStorage.setItem('kn_categories_cache', JSON.stringify({
        data: d.categories || [],
        timestamp: Date.now()
      }));
    } catch (e) { console.error(e); }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      // Check localStorage cache first
      const cached = localStorage.getItem('kn_tags_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 60 * 60 * 1000) { // 1 hour cache
          setTags((data || []).filter(t => t.active && t.popular));
          return;
        }
      }
      const d = await fetch('/api/tags').then(r => r.json());
      setTags((d.tags || []).filter(t => t.active && t.popular));
      // Cache locally
      localStorage.setItem('kn_tags_cache', JSON.stringify({
        data: d.tags || [],
        timestamp: Date.now()
      }));
    } catch (e) { console.error(e); }
  }, []);

  const fetchBreaking = useCallback(async () => {
    try {
      // Check localStorage cache first
      const cached = localStorage.getItem('kn_breaking_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minute cache
          setBreaking(data);
          return;
        }
      }
      const d = await fetch('/api/news/breaking').then(r => r.json());
      setBreaking(d.news || []);
      // Cache locally
      localStorage.setItem('kn_breaking_cache', JSON.stringify({
        data: d.news || [],
        timestamp: Date.now()
      }));
    } catch (e) { console.error(e); }
  }, []);

  const fetchYoutube = useCallback(async () => {
    try { const d = await fetch('/api/youtube/live').then(r => r.json()); if (d.configured) setYoutubeLive(d); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    // Parallel fetch of essential data (no seed call, no YouTube blocking)
    Promise.all([fetchCategories(), fetchTags(), fetchBreaking(), fetchNews()]);
    // Fetch YouTube async without blocking
    fetchYoutube();
  }, [fetchCategories, fetchTags, fetchBreaking, fetchNews, fetchYoutube]);

  useEffect(() => { setPage(1); fetchNews(selectedCategory, searchQuery, 1); }, [selectedCategory, fetchNews, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleDark = () => setDark(p => { localStorage.setItem('newsdesk_dark', String(!p)); return !p; });
  const handleSearch = (e) => { e?.preventDefault(); setPage(1); fetchNews(selectedCategory, searchQuery, 1); };
  const loadMore = () => { const n = page + 1; setPage(n); fetchNews(selectedCategory, searchQuery, n); };

  const handleSignOut = async () => { const r = await logOut(); if (r.error) toast.error(r.error); else { setUser(null); toast.success('Signed out'); } };
  const handleGoogleSignIn = async () => { setAuthLoading(true); const r = await signInWithGoogle(); if (r.error) toast.error(r.error); else { setUser(r.user); setAuthDialogOpen(false); toast.success('Signed in!'); } setAuthLoading(false); };
  const handleAppleSignIn = async () => { setAuthLoading(true); const r = await signInWithApple(); if (r.error) toast.error(r.error); else { setUser(r.user); setAuthDialogOpen(false); toast.success('Signed in!'); } setAuthLoading(false); };

  const trackShare = (newsId, platform) => fetch(`/api/news/${newsId}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform }) }).catch(console.error);
  const shareOnWhatsApp = (item) => { window.open(`https://wa.me/?text=${encodeURIComponent(item.title + '\n\n' + window.location.origin + '/news/' + item.id)}`, '_blank'); trackShare(item.id, 'whatsapp'); };
  const shareOnTwitter = (item) => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(window.location.origin + '/news/' + item.id)}`, '_blank'); trackShare(item.id, 'twitter'); };
  const shareOnFacebook = (item) => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/news/' + item.id)}`, '_blank'); trackShare(item.id, 'facebook'); };

//   const handleSaveProgress = async (scrollPct) => {
//     if (!selectedNews || !userId || scrollPct <= 0) return;
//     try {
//       await fetch('/api/users/reading-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, newsId: selectedNews.id, newsTitle: selectedNews.title, newsExcerpt: selectedNews.excerpt, newsFeaturedImage: selectedNews.featuredImage, newsCategory: selectedNews.category, scrollPosition: scrollPct, readPercentage: scrollPct }) });
//     } catch (e) { console.error(e); }
//   };

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail.trim()) { toast.error(selectedLanguage === 'hi' ? 'ईमेल दर्ज करें' : 'Please enter email'); return; }
    try {
      setNLLoading(true);
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newsletterEmail }) });
      const data = await res.json();
      if (res.ok) { toast.success(selectedLanguage === 'hi' ? 'सफलतापूर्वक सब्सक्राइब किया गया' : 'Subscribed!'); setNewsletterEmail(''); }
      else toast.error(data.error || 'Something went wrong');
    } catch { toast.error('Server error'); }
    finally { setNLLoading(false); }
  };

  // ── Theme palette ──────────────────────────────────────────────────────────
  const bg = dark ? '#0D1117' : '#F6F7F9';
  const surface = dark ? '#161B27' : '#FFFFFF';
  const bdr = dark ? '#252E40' : '#E8EAED';
  const T1 = dark ? '#E8ECF0' : '#111827';
  const T2 = dark ? '#9BA5B4' : '#4B5563';
  const T3 = '#8A8F98';

  const HEADER_H = isMobileView ? 105 : 204;
  const contentPad = isMobileView ? '12px' : '24px 5px';

  // ─── Shared article card props ─────────────────────────────────────────────
  const sharedCardProps = { formatDate, selectedLanguage, dark, textScale, selectedFont, bdr, T1, T2, T3 };

  const marqueeItems = useMemo(() => {
    if (!breakingNews || breakingNews.length === 0) return [];
    const items = [];
    breakingNews.forEach((item) => items.push({ key: `${item.id}-a`, title: item.title }));
    breakingNews.forEach((item) => items.push({ key: `${item.id}-b`, title: item.title }));
    return items;
  }, [breakingNews]);

  const marqueeDuration = Math.max(20, (breakingNews?.length || 0) * 6);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <DarkCtx.Provider value={dark}>
      <FontCtx.Provider value={{ font: selectedFont, scale: textScale }}>

        {/* Mobile search overlay */}
        {isMobileView && showMobileSearch && (
          <MobileSearch
            dark={dark} bdr={bdr} T1={T1} T2={T2} T3={T3}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            tags={tags} news={news} loading={loading}
            isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive}
            selectedCategory={selectedCategory}
            onClose={() => setShowMobileSearch(false)}
            onSearch={(q) => { setPage(1); fetchNews(selectedCategory, q, 1); }}
            onArticleClick={goToArticle}
            formatDate={formatDate}
          />
        )}

        {/* Live News Header */}
        {/* <Header
          dark={dark} toggleDark={toggleDark}
          selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage}
          translations={translations}
          user={user} onSignIn={() => setAuthDialogOpen(true)} onSignOut={handleSignOut}
          categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}
          breakingNews={breakingNews} isMobileView={isMobileView}
          setShowMobileSearch={setShowMobileSearch} setIsSearchActive={setIsSearchActive}
          t={t} surface={surface} bdr={bdr} T1={T1} T2={T2} T3={T3}
        /> */}

        {/* Page body */}
        <div
          className="kn-page-body"
          style={{ backgroundColor: bg, fontFamily: selectedLanguage === 'hi' ? 'var(--font-devanagari), sans-serif' : selectedFont.value, paddingTop: `${HEADER_H}px` }}
        >
          {/* Breaking news ticker */}
          
          {breakingNews.length > 0 && (
            <div className="kn-breaking-ticker" style={{ height: '46px', background: dark ? '#150e0e' : '#FFF5F5', borderTop: `1px solid ${dark ? '#3a1f1f' : '#FED7D7'}`, borderBottom: `1px solid ${dark ? '#3a1f1f' : '#FED7D7'}` }}>
              <div style={{ maxWidth: '1300px', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center' }}>
                {/* Breaking Label */}
                <div className="kn-breaking-label" style={{ minWidth: '105px', height: '24px', background: '#D72638', color: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
                  ● BREAKING
                </div>
                {/* News Scroll */}
                <div className="kn-marquee-wrap" style={{ flex: 1, overflow: 'hidden', marginLeft: '20px', marginRight: '10px' }}>
                  <div className="animate-marquee" style={{ animationDuration: `${marqueeDuration}s` }}>
                    <div className="kn-breaking-track">
                      {marqueeItems.map((item) => (
                        <span key={item.key} className="kn-breaking-item">
                          {item.title}
                          <span className="kn-breaking-separator">◆</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trending bar (desktop) */}
          {!isMobileView && (
            <TrendingBar tags={tags} selectedLanguage={selectedLanguage} onTagClick={(name) => { setSearchQuery(name); fetchNews(selectedCategory, name, 1); }} dark={dark} />
          )}

          {/* Main content */}
          <div className="kn-content-wrap" style={{ padding: contentPad }}>

            {/* YouTube live embed */}
            {/* {youtubeLive?.videoId && (
              <div className="kn-youtube-live" style={{ border: `1px solid ${bdr}`, backgroundColor: surface }}>
                <div className="kn-youtube-live-bar">
                  <span style={{ color: EDITORIAL_RED, fontSize: '12px', fontWeight: 700 }}>● LIVE</span>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>{youtubeLive.title}</span>
                </div>
                <div className="kn-youtube-live-frame">
                  <iframe src={`https://www.youtube.com/embed/${youtubeLive.videoId}?rel=0`} title="Live" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </div>
            )} */}

            {/* Loading */}
            {loading && news.length === 0 ? (
              <div className="kn-loading-wrap">
                <div className="kn-loading-inner">
                  <Loader />
                  <p style={{ color: T3, fontSize: '14px', marginTop: '10px' }}>Loading articles...</p>
                </div>
              </div>

            ) : isMobileView ? (
              /* ── Mobile list ──────────────────────────────────────────── */
                <div className="kn-mobile-list">
                    {news.map(item => (
                    <div key={item.id} onClick={() => goToArticle(item)} className="kn-mobile-item" style={{ borderBottom: `1px solid ${bdr}` }}>
                        <div className="kn-mobile-thumb">
                        <img src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300'} alt={item.title} />
                        </div>
                        <div className="kn-mobile-item-text" style={{ marginLeft: '12px' }}>
                        <div className="kn-mobile-item-cat-row">
                            <span className="kn-mobile-item-cat-dot" style={{ backgroundColor: getCatAccent(item.category) }} />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: getCatAccent(item.category), textTransform: 'uppercase', letterSpacing: '0.07em', marginLeft: '10px' }}>
                            {getCatLabel(item.category, selectedLanguage)}
                            </span>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: dark ? '#E8ECF0' : '#111827', lineHeight: 1.4, marginBottom: '7px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
                        <span style={{ fontSize: '11px', color: T3, marginLeft: '10px' }}>{formatDate(item.publishedAt)}</span> 
                        {item.isBreaking && <span style={{ backgroundColor: EDITORIAL_RED, color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', marginLeft: '10px', borderRadius: '2px' }}>LIVE</span>}
                        </div>
                        
                    </div>
                    ))}
                </div>

            ) : (
              /* ── Desktop 2-column layout ────────────────────────────── */
              <div className="kn-desktop-grid">

                {/* Left column */}
                <div>
                  {news.length > 0 && (
                    <LiveCard item={news[0]} onClick={goToArticle} {...sharedCardProps} />
                  )}

                  {news.length > 2 && (
                    <div className="kn-section-label">
                      <div className="kn-section-label-bar" />
                      <span className="kn-section-label-text" style={{ color: T3 }}>
                        {selectedLanguage === 'hi' ? 'मुख्य समाचार' : 'Top Stories'}
                      </span>
                    </div>
                  )}

                  <div className="kn-horizontal-grid">
                      {news.slice(2, 6).map(item => (
                      <HorizontalArticleCard key={item.id} item={item} onClick={goToArticle} {...sharedCardProps} />
                      ))}
                  </div>

                  {news.length > 5 && (
                    <>
                      <div className="kn-grid-header">
                        <div className="kn-section-label-bar" />
                        <span className="kn-section-label-text" style={{ color: T3 }}>
                          {selectedLanguage === 'hi' ? 'और खबरें' : 'More News'}
                        </span>
                      </div>
                      <div className="kn-article-grid">
                        {news.slice(3).map(item => (
                          <ArticleCard key={item.id} item={item} onClick={goToArticle} formatDate={formatDate} showShareMenu={showShareMenu} setShowShareMenu={setShowShareMenu} selectedLanguage={selectedLanguage} onShareWhatsApp={shareOnWhatsApp} onShareTwitter={shareOnTwitter} onShareFacebook={shareOnFacebook} />
                        ))}
                      </div>
                    </>
                  )}

                  {hasMore && (
                    <div className="kn-load-more-wrap">
                      <button onClick={loadMore} disabled={loading} className="kn-load-more-btn" style={{ border: `1px solid ${bdr}`, backgroundColor: surface, color: T2 }} onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)} onMouseLeave={e => (e.currentTarget.style.borderColor = bdr)}>
                        {loading ? <Loader /> : <><span>{t.loadMore}</span><ChevronDown style={{ width: '14px', height: '14px' }} /></>}
                      </button>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="kn-right-col" style={{ position: 'sticky', top: `${HEADER_H + 16}px` }}>
                  {/* {news.length > 1 && (
                    <div onClick={() => setSelectedNews(news[1])} className="kn-featured-card" style={{ backgroundColor: surface, border: `1px solid ${bdr}` }}>
                      <div className="kn-featured-card-img">
                        <img src={news[1].featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600'} alt={news[1].title} />
                      </div>
                      <div className="kn-featured-card-body">
                        <span style={{ fontSize: '10px', fontWeight: 700, color: getCatAccent(news[1].category), textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
                          {getCatLabel(news[1].category, selectedLanguage)}
                        </span>
                        <h3 style={{ fontSize: `${14 * textScale}px`, fontWeight: 700, color: dark ? '#E8ECF0' : '#111827', lineHeight: 1.38, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{news[1].title}</h3>
                        <span style={{ fontSize: '11px', color: T3 }}>{formatDate(news[1].publishedAt)}</span>
                      </div>
                    </div>
                  )} */}

                  <LatestNews items={breakingNews.length > 0 ? breakingNews : news} onArticleClick={goToArticle} dark={dark} selectedLanguage={selectedLanguage} formatDate={formatDate} />

                  <button onClick={() => setSubscriptionOpen(true)} className="kn-premium-btn" style={{ backgroundColor: ACCENT, color: 'white' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor ='#1134a7')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#152a58')}>
                    <Crown style={{ width: '14px', height: '14px', color: '#fde68a' }} />
                    Go Premium — ₹299/mo
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {news.length === 0 && !loading && (
              <div className="kn-empty-state">
                <Newspaper style={{ width: '44px', height: '44px', color: T3, margin: '0 auto 12px' }} />
                <p style={{ color: T1, fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{t.noArticles}</p>
                <p style={{ color: T3, fontSize: '13px' }}>{searchQuery ? 'Try different search terms' : t.checkBackLater}</p>
              </div>
            )}

            {/* Category showcase */}
            {!isMobileView && categories.length > 0 && !loading && (
              <CategoryShowcase categories={categories} onCategoryClick={setSelectedCategory} dark={dark} selectedLanguage={selectedLanguage} />
            )}
          </div>

          {/* Footer */}
          <SiteFooter dark={dark} categories={categories} selectedLanguage={selectedLanguage} onCategoryClick={setSelectedCategory} newsletterEmail={newsletterEmail} setNewsletterEmail={setNewsletterEmail} onNewsletterSubscribe={handleNewsletterSubscribe} newsletterLoading={newsletterLoading} />
        </div>

        {/* -- Dialogs ---------------------------------------------------- */}
        <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} loading={authLoading} bdr={bdr} />

        {/* <ArticleModal article={selectedNews} onClose={() => setSelectedNews(null)} isMobileView={isMobileView} selectedLanguage={selectedLanguage} surface={surface} bdr={bdr} T1={T1} T2={T2} T3={T3} onShareWhatsApp={shareOnWhatsApp} onShareTwitter={shareOnTwitter} onShareFacebook={shareOnFacebook} onSaveProgress={handleSaveProgress} formatDate={formatDate} /> */}

        <SubscriptionPlans open={subscriptionOpen} onClose={() => setSubscriptionOpen(false)} user={user} userId={userId} />

      </FontCtx.Provider>
    </DarkCtx.Provider>
  );
}
