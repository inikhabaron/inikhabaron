'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, signInWithGoogle, signInWithApple, logOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { Newspaper, Crown, ChevronDown } from 'lucide-react';

import Header from '@/components/home/Header';
import TrendingBar from '@/components/home/TrendingBar';
import HeroCard from '@/components/home/HeroCard';
import HorizontalArticleCard from '@/components/home/HorizontalArticleCard';
import ArticleCard from '@/components/home/ArticleCard';
import LatestNews from '@/components/home/LatestNews';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import SiteFooter from '@/components/home/SiteFooter';
import AuthDialog from '@/components/home/AuthDialog';
import SubscriptionPlans from '@/components/home/SubscriptionPlans';
import MobileSearch from '@/components/home/MobileSearch';

import { DarkCtx, FontCtx } from '@/lib/news-contexts';
import { ACCENT, EDITORIAL_RED, FONT_OPTIONS, translations, getCatAccent, getCatLabel, formatDate } from '@/lib/news-utils';

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
    <div className="loader" />
  </div>
);

export default function HomePageClient({
  initialNews = [],
  initialTotal = 0,
  initialCategories = [],
  initialBreaking = [],
  initialTags = [],
}) {
  // ── Data state — pre-populated from server; no spinner on first paint ────
  const [news, setNews] = useState(initialNews);
  const [breakingNews, setBreaking] = useState(initialBreaking);
  const [categories, setCategories] = useState(initialCategories);
  const [tags, setTags] = useState((initialTags || []).filter(t => t.active && t.popular));

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false); // server already provided data
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialTotal > initialNews.length);

  // ── Auth state ────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  // ── Preferences ───────────────────────────────────────────────────────────
  const [dark, setDark] = useState(false);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [textScale] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [languageLoaded, setLanguageLoaded] = useState(false);

  // ── Misc ──────────────────────────────────────────────────────────────────
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [youtubeLive, setYoutubeLive] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNLLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(null);

  const shareMenuRef = useRef(null);
  // Prevents fetchNews from re-running on mount when the server already sent
  // the 'all' category data — avoids a redundant DB round-trip.
  const isInitialMount = useRef(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const goToArticle = (item) => router.push(`/news/${item.id}`);
  const t = translations[selectedLanguage];

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    let timeout;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsMobileView(window.innerWidth <= 1159), 150);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isMobileView || !searchQuery.trim()) return;
    const timer = setTimeout(() => fetchNews(selectedCategory, searchQuery, 1), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, isMobileView]);

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
    const f = localStorage.getItem('newsdesk_font');
    if (f) {
      const found = FONT_OPTIONS.find(o => o.label === f);
      if (found) setSelectedFont(found);
    }
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) setShowShareMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('newsdesk_user_id');
    if (saved) { setUserId(saved); return; }
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('newsdesk_user_id', id);
    setUserId(id);
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    setSelectedCategory(category || 'all');
  }, [searchParams]);

  // Seed localStorage with the server-provided data so that MobileSearch and
  // other components reading the local cache see fresh values immediately.
  useEffect(() => {
    if (initialCategories.length) {
      localStorage.setItem('kn_categories_cache', JSON.stringify({ data: initialCategories, timestamp: Date.now() }));
    }
    if (initialTags.length) {
      localStorage.setItem('kn_tags_cache', JSON.stringify({ data: initialTags, timestamp: Date.now() }));
    }
    if (initialBreaking.length) {
      localStorage.setItem('kn_breaking_cache', JSON.stringify({ data: initialBreaking, timestamp: Date.now() }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchNews = useCallback(async (cat = 'all', search = '', pageNum = 1) => {
    try {
      setLoading(true);
      let url = `/api/news?page=${pageNum}&limit=20`;
      if (cat && cat !== 'all') url += `&category=${encodeURIComponent(cat)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const d = await fetch(url).then(r => r.json());
      if (pageNum === 1) setNews(d.news || []);
      else setNews(p => [...p, ...(d.news || [])]);
      setHasMore(d.pagination?.page < d.pagination?.pages);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBreaking = useCallback(async () => {
    try {
      const cached = localStorage.getItem('kn_breaking_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setBreaking(data);
          return;
        }
      }
      const res = await fetch('/api/news/breaking');
      if (!res.ok) { console.error('Breaking API failed', res.status); return; }
      const data = await res.json();
      const breakingArticles = data.news || [];
      setBreaking(breakingArticles);
      localStorage.setItem('kn_breaking_cache', JSON.stringify({ data: breakingArticles, timestamp: Date.now() }));
    } catch (e) { console.error(e); }
  }, []);

  const fetchYoutube = useCallback(async () => {
    try {
      const d = await fetch('/api/youtube/live').then(r => r.json());
      if (d.configured) setYoutubeLive(d);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    // Server already provided categories, tags, and initial breaking news.
    // Only fetch YouTube (live/dynamic — can't be ISR'd) and refresh breaking
    // in background in case the ISR cache is up to 60s old.
    fetchYoutube();
    fetchBreaking();
  }, [fetchYoutube, fetchBreaking]);

  useEffect(() => {
    // On the very first mount with selectedCategory='all' and no search query,
    // the server already sent this exact data — skip the fetch to avoid a
    // redundant DB round-trip that would flash a loading spinner over real content.
    if (isInitialMount.current && selectedCategory === 'all' && !searchQuery) {
      isInitialMount.current = false;
      return;
    }
    isInitialMount.current = false;
    setPage(1);
    fetchNews(selectedCategory, searchQuery, 1);
  }, [selectedCategory, fetchNews, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleDark = () => setDark(p => { localStorage.setItem('newsdesk_dark', String(!p)); return !p; });
  const handleSearch = (e) => { e?.preventDefault(); setPage(1); fetchNews(selectedCategory, searchQuery, 1); };
  const loadMore = () => { const n = page + 1; setPage(n); fetchNews(selectedCategory, searchQuery, n); };

  const handleSignOut = async () => {
    const r = await logOut();
    if (r.error) toast.error(r.error);
    else { setUser(null); toast.success('Signed out'); }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    const r = await signInWithGoogle();
    if (r.error) toast.error(r.error);
    else { setUser(r.user); setAuthDialogOpen(false); toast.success('Signed in!'); }
    setAuthLoading(false);
  };

  const handleAppleSignIn = async () => {
    setAuthLoading(true);
    const r = await signInWithApple();
    if (r.error) toast.error(r.error);
    else { setUser(r.user); setAuthDialogOpen(false); toast.success('Signed in!'); }
    setAuthLoading(false);
  };

  const trackShare = (newsId, platform) =>
    fetch(`/api/news/${newsId}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform }) }).catch(console.error);

  const shareOnWhatsApp = (item) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(item.title + '\n\n' + window.location.origin + '/news/' + item.id)}`, '_blank');
    trackShare(item.id, 'whatsapp');
  };
  const shareOnTwitter = (item) => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(window.location.origin + '/news/' + item.id)}`, '_blank');
    trackShare(item.id, 'twitter');
  };
  const shareOnFacebook = (item) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/news/' + item.id)}`, '_blank');
    trackShare(item.id, 'facebook');
  };

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

  // ── Theme palette ─────────────────────────────────────────────────────────

  const bg = dark ? '#0D1117' : '#F6F7F9';
  const surface = dark ? '#161B27' : '#FFFFFF';
  const bdr = dark ? '#252E40' : '#E8EAED';
  const T1 = dark ? '#E8ECF0' : '#111827';
  const T2 = dark ? '#9BA5B4' : '#4B5563';
  const T3 = '#8A8F98';

  const HEADER_H = isMobileView ? 105 : 0;
  const contentPad = isMobileView ? '12px' : '24px 5px';
  const sharedCardProps = { formatDate, selectedLanguage, dark, textScale, selectedFont, bdr, T1, T2, T3 };

  const marqueeItems = useMemo(() => {
    if (!breakingNews || breakingNews.length === 0) return [];
    const items = [];
    breakingNews.forEach((item) => items.push({ key: `${item.id}-a`, title: item.title }));
    breakingNews.forEach((item) => items.push({ key: `${item.id}-b`, title: item.title }));
    return items;
  }, [breakingNews]);

  const marqueeDuration = Math.max(20, (breakingNews?.length || 0) * 6);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DarkCtx.Provider value={dark}>
      <FontCtx.Provider value={{ font: selectedFont, scale: textScale }}>

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

        <Header
          dark={dark} toggleDark={toggleDark}
          selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage}
          translations={translations}
          user={user} onSignIn={() => setAuthDialogOpen(true)} onSignOut={handleSignOut}
          categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}
          breakingNews={breakingNews} isMobileView={isMobileView}
          setShowMobileSearch={setShowMobileSearch} setIsSearchActive={setIsSearchActive}
          t={t} surface={surface} bdr={bdr} T1={T1} T2={T2} T3={T3}
        />

        <div
          className="kn-page-body"
          style={{ backgroundColor: bg, fontFamily: selectedLanguage === 'hi' ? 'var(--font-devanagari), sans-serif' : selectedFont.value, paddingTop: `${HEADER_H}px` }}
        >
          {breakingNews.length > 0 && (
            <div className="kn-breaking-ticker" style={{ height: '46px', background: dark ? '#150e0e' : '#FFF5F5', borderTop: `1px solid ${dark ? '#3a1f1f' : '#FED7D7'}`, borderBottom: `1px solid ${dark ? '#3a1f1f' : '#FED7D7'}` }}>
              <div style={{ maxWidth: '1300px', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center' }}>
                <div className="kn-breaking-label" style={{ minWidth: '105px', height: '24px', background: '#D72638', color: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
                  ● BREAKING
                </div>
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

          {!isMobileView && (
            <TrendingBar
              tags={tags} selectedLanguage={selectedLanguage}
              onTagClick={(name) => { setSearchQuery(name); fetchNews(selectedCategory, name, 1); }}
              dark={dark}
            />
          )}

          <div className="kn-content-wrap" style={{ padding: contentPad }}>

            {loading && news.length === 0 ? (
              <div className="kn-loading-wrap">
                <div className="kn-loading-inner">
                  <Loader />
                  <p style={{ color: T3, fontSize: '14px', marginTop: '10px' }}>Loading articles...</p>
                </div>
              </div>

            ) : isMobileView ? (
              <div className="kn-mobile-list">
                {news.map(item => (
                  <div key={item.id} onClick={() => goToArticle(item)} className="kn-mobile-item" style={{ borderBottom: `1px solid ${bdr}` }}>
                    <div className="kn-mobile-thumb">
                      <img src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300'} alt={item.title} loading="lazy" />
                    </div>
                    <div className="kn-mobile-item-text" style={{ marginLeft: '12px' }}>
                      <div className="kn-mobile-item-cat-row">
                        <span className="kn-mobile-item-cat-dot" style={{ backgroundColor: getCatAccent(item.category) }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: getCatAccent(item.category), textTransform: 'uppercase', letterSpacing: '0.07em', marginLeft: '10px' }}>
                          {getCatLabel(item.category, selectedLanguage)}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: dark ? '#E8ECF0' : '#111827', lineHeight: 1.4, marginBottom: '7px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.title}
                      </p>
                      <span style={{ fontSize: '11px', color: T3, marginLeft: '10px' }}>{formatDate(item.publishedAt)}</span>
                      {item.isBreaking && (
                        <span style={{ backgroundColor: EDITORIAL_RED, color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', marginLeft: '10px', borderRadius: '2px' }}>LIVE</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            ) : (
              <div className="kn-desktop-grid">
                <div>
                  {news.length > 0 && (
                    <HeroCard item={news[0]} onClick={goToArticle} {...sharedCardProps} />
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
                        {news.slice(5).map(item => (
                          <ArticleCard
                            key={item.id} item={item} onClick={goToArticle}
                            formatDate={formatDate} showShareMenu={showShareMenu}
                            setShowShareMenu={setShowShareMenu} selectedLanguage={selectedLanguage}
                            onShareWhatsApp={shareOnWhatsApp} onShareTwitter={shareOnTwitter} onShareFacebook={shareOnFacebook}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {hasMore && (
                    <div className="kn-load-more-wrap">
                      <button
                        onClick={loadMore} disabled={loading} className="kn-load-more-btn"
                        style={{ border: `1px solid ${bdr}`, backgroundColor: surface, color: T2 }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = bdr)}
                      >
                        {loading ? <Loader /> : <><span>{t.loadMore}</span><ChevronDown style={{ width: '14px', height: '14px' }} /></>}
                      </button>
                    </div>
                  )}
                </div>

                <div className="kn-right-col" style={{ position: 'sticky', top: `${HEADER_H + 16}px` }}>
                  <LatestNews
                    items={breakingNews.length > 0 ? breakingNews : news}
                    onArticleClick={goToArticle} dark={dark}
                    selectedLanguage={selectedLanguage} formatDate={formatDate}
                  />
                  <button
                    onClick={() => setSubscriptionOpen(true)} className="kn-premium-btn"
                    style={{ backgroundColor: ACCENT, color: 'white' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1134a7')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#152a58')}
                  >
                    <Crown style={{ width: '14px', height: '14px', color: '#fde68a' }} />
                    Go Premium — ₹299/mo
                  </button>
                </div>
              </div>
            )}

            {news.length === 0 && !loading && (
              <div className="kn-empty-state">
                <Newspaper style={{ width: '44px', height: '44px', color: T3, margin: '0 auto 12px' }} />
                <p style={{ color: T1, fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{t.noArticles}</p>
                <p style={{ color: T3, fontSize: '13px' }}>{searchQuery ? 'Try different search terms' : t.checkBackLater}</p>
              </div>
            )}

            {!isMobileView && categories.length > 0 && !loading && (
              <CategoryShowcase categories={categories} onCategoryClick={setSelectedCategory} dark={dark} selectedLanguage={selectedLanguage} />
            )}
          </div>

          <SiteFooter
            dark={dark} categories={categories} selectedLanguage={selectedLanguage}
            onCategoryClick={setSelectedCategory} newsletterEmail={newsletterEmail}
            setNewsletterEmail={setNewsletterEmail} onNewsletterSubscribe={handleNewsletterSubscribe}
            newsletterLoading={newsletterLoading}
          />
        </div>

        <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} loading={authLoading} bdr={bdr} />
        <SubscriptionPlans open={subscriptionOpen} onClose={() => setSubscriptionOpen(false)} user={user} userId={userId} />

      </FontCtx.Provider>
    </DarkCtx.Provider>
  );
}
