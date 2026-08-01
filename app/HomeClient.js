'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import Image from 'next/image';
import { Newspaper, Crown, ChevronDown } from 'lucide-react';

// ─── Layout & UI components ───────────────────────────────────────────────────
import Header from '@/components/home/Header';
import TrendingBar from '@/components/home/TrendingBar';
import HeroCard from '@/components/home/HeroCard';
import HorizontalArticleCard from '@/components/home/HorizontalArticleCard';
import ArticleCard from '@/components/home/ArticleCard';
import LatestNews from '@/components/home/LatestNews';
import BreakingTicker from '@/components/home/BreakingTicker';
import MarketTicker from '@/components/market/MarketTicker';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import EventPromotions from '@/components/promotions/EventPromotions';
import SiteFooter from '@/components/home/SiteFooter';
// import ArticleModal from '@/components/home/ArticleModal';
// Modals/overlays are off the critical path (rendered only after a user
// action), so they're code-split out of the initial bundle instead of
// loading eagerly on every homepage visit.
const AuthDialog = dynamic(() => import('@/components/home/AuthDialog'), { ssr: false });
const SubscriptionPlans = dynamic(() => import('@/components/home/SubscriptionPlans'), { ssr: false });
const MobileSearch = dynamic(() => import('@/components/home/MobileSearch'), { ssr: false });
import FollowButton from '@/components/follow/FollowButton';
import { applyFollowChange } from '@/lib/follow/applyFollowChange';
import { PersonalizedFeed } from '@/components/personalization';
import useNewsletterSubscribe from '@/hooks/useNewsletterSubscribe';
import useSiteChrome from '@/hooks/useSiteChrome';
import useBookmarkedIds from '@/hooks/useBookmarkedIds';

// ─── Shared utilities & contexts ──────────────────────────────────────────────
import { DarkCtx, FontCtx } from '@/lib/news-contexts';
import { ACCENT, ACCENT_H, EDITORIAL_RED, FONT_OPTIONS, getCatAccent, getCatLabel, formatDate } from '@/lib/news-utils';
import { event as trackEvent } from '@/lib/gtag';
import { recordShare } from '@/lib/share';

// home.css is imported globally via layout.js — plain kn-* class names used below

// ─── Loader ───────────────────────────────────────────────────────────────────
const Loader = () => <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="loader" /></div>;

// ─── HomePage ─────────────────────────────────────────────────────────────────
export default function HomePage({ initialCategory = 'all' }) {
  // ── Data state ───────────────────────────────────────────────────────────
  const [news, setNews] = useState([]);
  const [tags, setTags] = useState([]);

  // ── UI state ─────────────────────────────────────────────────────────────
  // initialCategory comes from app/page.js's searchParams (read server-side),
  // so the server and the client's first render agree from the start — no
  // mount-time correction/race, and no hydration mismatch from reading
  // window.location directly in a useState initializer (which the server
  // can't do at all, since window doesn't exist there).
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  // const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // ── Auth state ───────────────────────────────────────────────────────────
  const {
    dark, toggleDark, selectedLanguage, setSelectedLanguage, translations, t,
    user, sessionReady, authLoading, authDialogOpen, setAuthDialogOpen,
    handleGoogleSignIn: signInWithGoogleShared, handleAppleSignIn: signInWithAppleShared, handleSignOut,
    categories, breakingNews,
  } = useSiteChrome();
  // Gated on sessionReady, not just user: the hook fetches immediately when its
  // argument is truthy, and before the khabaron_session cookie exists that 401s.
  const { bookmarkedIds, handleBookmarkChange } = useBookmarkedIds(sessionReady ? user : null);
  const [userId, setUserId] = useState(null);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  // ── Preferences ──────────────────────────────────────────────────────────
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [textScale] = useState(1);

  // ── Misc ─────────────────────────────────────────────────────────────────
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [youtubeLive, setYoutubeLive] = useState(null);
  const { newsletterEmail, setNewsletterEmail, newsletterLoading, handleNewsletterSubscribe } = useNewsletterSubscribe(selectedLanguage);
  const [showShareMenu, setShowShareMenu] = useState(null);
  const [topStoriesCount, setTopStoriesCount] = useState(6);
  const [following, setFollowing] = useState({ categories: [], authors: [], cities: [] });

  const shareMenuRef = useRef(null);
  const router = useRouter();
  const goToArticle = useCallback((item) => router.push(`/news/${item.id}`), [router]);
  const handleRequireLogin = useCallback(() => setAuthDialogOpen(true), [setAuthDialogOpen]);

  // ── Effects ───────────────────────────────────────────────────────────────
  // useLayoutEffect (not useEffect) so the mobile/desktop layout is settled
  // before the browser paints — these two views render entirely different
  // DOM trees (see Header + the mobile-list/desktop-grid split below), so
  // deciding this after paint caused a full-page layout swap (and a large
  // Cumulative Layout Shift) on every load. Only actual resize events are
  // debounced; the initial read is synchronous.
  useLayoutEffect(() => {
    let timeout;
    setIsMobileView(window.innerWidth <= 1159);
    const onResize = () => { clearTimeout(timeout); timeout = setTimeout(() => setIsMobileView(window.innerWidth <= 1159), 150); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(timeout); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    if (!isMobileView || !searchQuery.trim()) return;
    const t = setTimeout(() => fetchNews(selectedCategory, searchQuery, 1), 400);
    return () => clearTimeout(t);
  }, [searchQuery, selectedCategory, isMobileView]);

  useEffect(() => {
    const f = localStorage.getItem('newsdesk_font');
    if (f) { const found = FONT_OPTIONS.find(o => o.label === f); if (found) setSelectedFont(found); }
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) setShowShareMenu(null); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!user || !sessionReady) {
      setFollowing({ categories: [], authors: [], cities: [] });
      return;
    }

    let cancelled = false;

    fetch('/api/users/following', { credentials: 'include', cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setFollowing(data.data);
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [user, sessionReady]);

  // Opens the auth dialog when a page redirected here for a login-gated action
  // (e.g. /settings). Sign-in success handlers below own redirecting back.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('authRequired') === '1') setAuthDialogOpen(true);
  }, []);

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

  const fetchTags = useCallback(async () => {
    try { const d = await fetch('/api/tags').then(r => r.json()); setTags((d.tags || []).filter(t => t.active && t.popular)); } catch (e) { console.error(e); }
  }, []);

  const fetchYoutube = useCallback(async () => {
    try { const d = await fetch('/api/youtube/live').then(r => r.json()); if (d.configured) setYoutubeLive(d); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchTags();
    fetchYoutube();
    const interval = setInterval(() => { fetchYoutube(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchTags, fetchYoutube]);

  // Sole owner of the news fetch — also covers the very first load (fires on
  // mount with the server-provided initialCategory/empty search), so a
  // second "initial" fetchNews() call here would race this one and could
  // briefly show the wrong category's articles.
  useEffect(() => { setPage(1); fetchNews(selectedCategory, searchQuery, 1); }, [selectedCategory, fetchNews, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (e) => { e?.preventDefault(); setPage(1); fetchNews(selectedCategory, searchQuery, 1); };
  const loadMore = () => { const n = page + 1; setPage(n); fetchNews(selectedCategory, searchQuery, n); };

  // After a successful sign-in, sends the user back to whatever page
  // redirected them here to log in (e.g. /settings), if any.
  const redirectAfterAuth = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('authRequired') !== '1') return;

    const redirectTo = params.get('redirect');
    router.replace(redirectTo || '/');
  };

  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogleShared();
    if (success) redirectAfterAuth();
  };

  const handleAppleSignIn = async () => {
    const success = await signInWithAppleShared();
    if (success) redirectAfterAuth();
  };

  // const trackShare = (newsId, platform) => fetch(`/api/news/${newsId}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform }) }).catch(console.error);
  const shareOnWhatsApp = useCallback(async (item) => { trackEvent({ action: 'share_click', category: 'article', label: 'whatsapp', }); await recordShare(item.id, 'whatsapp'); window.open(`https://wa.me/?text=${encodeURIComponent('*' + item.title + '*' + '\n\n' + window.location.origin + '/news/' + item.id)}`, '_blank'); }, []);
  const shareOnTwitter = useCallback(async (item) => { trackEvent({ action: 'share_click', category: 'article', label: 'twitter', }); await recordShare(item.id, 'twitter'); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(window.location.origin + '/news/' + item.id)}`, '_blank'); }, []);
  const shareOnFacebook = useCallback(async (item) => { trackEvent({ action: 'share_click', category: 'article', label: 'facebook', }); await recordShare(item.id, 'facebook'); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/news/' + item.id)}`, '_blank'); }, []);
  const copyArticleLink = useCallback(async (item) => { try { await navigator.clipboard.writeText(`${window.location.origin}/news/${item.id}`); trackEvent({ action: 'share_click', category: 'article', label: 'copy_link', }); toast.success('Link copied!'); } catch (error) { console.error(error); toast.error('Failed to copy link'); }}, []);

  // const handleSaveProgress = async (scrollPct) => {
  //   if (!selectedNews || !userId || scrollPct <= 0) return;
  //   try {
  //     await fetch('/api/users/reading-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, newsId: selectedNews.id, newsTitle: selectedNews.title, newsExcerpt: selectedNews.excerpt, newsFeaturedImage: selectedNews.featuredImage, newsCategory: selectedNews.category, scrollPosition: scrollPct, readPercentage: scrollPct }) });
  //   } catch (e) { console.error(e); }
  // };

  // ── Theme palette ──────────────────────────────────────────────────────────
  const bg = dark ? '#0D1117' : '#F6F7F9';
  const surface = dark ? '#161B27' : '#FFFFFF';
  const bdr = dark ? '#252E40' : '#E8EAED';
  const T1 = dark ? '#E8ECF0' : '#111827';
  const T2 = dark ? '#9BA5B4' : '#4B5563';
  const T3 = dark ? '#9BA5B4' : '#6B7280';

  const HEADER_H = isMobileView ? 105 : 0;
  const contentPad = isMobileView ? '12px' : '24px 5px';

  // ─── Shared article card props ─────────────────────────────────────────────
  const sharedCardProps = { formatDate, selectedLanguage, dark, textScale, selectedFont, bdr, T1, T2, T3 };

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

        {/* Header */}
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

        {/* Page body */}
        <div
          className="kn-page-body"
          style={{ backgroundColor: bg, fontFamily: selectedLanguage === 'hi' ? 'var(--font-devanagari), sans-serif' : selectedFont.value, paddingTop: `${HEADER_H}px` }}
        >
          {/* Market ticker */}
          <MarketTicker dark={dark} selectedLanguage={selectedLanguage} />

          {/* Breaking news ticker */}
          <BreakingTicker breakingNews={breakingNews} dark={dark} onArticleClick={goToArticle} />

          {/* Trending bar (desktop) */}
          {!isMobileView && (
            <TrendingBar tags={tags} selectedLanguage={selectedLanguage} onTagClick={(name) => { setSearchQuery(name); fetchNews(selectedCategory, name, 1); }} dark={dark} />
          )}

          {/* Main content */}
          <main className="kn-content-wrap" style={{ padding: contentPad }}>
            <h1 className="sr-only">
              {selectedLanguage === 'hi' ? 'खबरON - ताज़ा हिंदी और अंग्रेज़ी समाचार' : 'KhabarON - Latest Hindi & English News'}
            </h1>

            {/* Category banner */}
            {selectedCategory && selectedCategory !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '14px 18px', marginBottom: '18px', borderRadius: '12px', border: `1px solid ${bdr}`, backgroundColor: surface }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getCatAccent(selectedCategory), flexShrink: 0 }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: T1 }}>
                    {getCatLabel(selectedCategory, selectedLanguage)}
                  </span>
                </div>
                <FollowButton
                  type="category"
                  id={selectedCategory}
                  user={user}
                  following={following.categories.some(c => c.id === selectedCategory)}
                  onRequireLogin={() => setAuthDialogOpen(true)}
                  onChange={(change) => setFollowing(prev => {
                    const cat = categories.find(c => c.slug === selectedCategory);
                    return applyFollowChange(prev, {
                      ...change,
                      item: {
                        id: selectedCategory,
                        name: cat?.name || getCatLabel(selectedCategory, selectedLanguage),
                        nameHi: cat?.nameHi,
                        color: cat?.color || getCatAccent(selectedCategory),
                        exists: true,
                      },
                    });
                  })}
                  labels={selectedLanguage === 'hi' ? { follow: 'फॉलो करें', following: 'फॉलो कर रहे हैं' } : undefined}
                />
              </div>
            )}

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
              <>
                <div className="kn-mobile-list">
                  {news.map(item => (
                    <div key={item.id} onClick={() => goToArticle(item)} className="kn-mobile-item" style={{ borderBottom: `1px solid ${bdr}` }}>
                      <div className="kn-mobile-thumb">
                        <Image
                          src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300'}
                          alt={item.title}
                          width={96}
                          height={68}
                          sizes="96px"
                        />
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
                        {item.isBreaking && <span style={{ backgroundColor: EDITORIAL_RED, color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', marginLeft: '10px', borderRadius: '2px' }}>Breaking News</span>}
                      </div>
                      
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px' }}>
                    <button onClick={loadMore} disabled={loading}
                      style={{ padding: '12px 24px', borderRadius: '12px', border: `1px solid ${bdr}`, background: surface, color: T1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          {loading ? (
                            'Loading...'
                          ) : (
                            <>
                              {selectedLanguage === 'hi' ? 'और देखें' : 'Load More'}
                              <ChevronDown size={16} />
                            </>
                          )}
                    </button>
                  </div>
                )}
              </>

            ) : (
              /* ── Desktop 2-column layout ────────────────────────────── */
              <div className="kn-desktop-grid">

                {/* Left column */}
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
                    {news.slice(1, 1 + topStoriesCount).map(item => (
                      <HorizontalArticleCard key={item.id} item={item} onClick={goToArticle} {...sharedCardProps} />
                    ))}
                  </div>

                  {news.length > (2 + topStoriesCount) && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', marginBottom: '20px' }}>
                      <button onClick={() => setTopStoriesCount(prev => prev + 4)} className="kn-load-more-btn"
                        style={{ border: `1px solid ${bdr}`, backgroundColor: surface, color: T2 }}>
                        <span> {selectedLanguage === 'hi' ? 'और देखें' : 'Load More'} </span>
                        <ChevronDown style={{ width: '14px', height: '14px', marginLeft: '6px' }}/>
                      </button>
                    </div>
                  )}

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
                          <ArticleCard key={item.id} item={item} onClick={goToArticle} formatDate={formatDate} showShareMenu={showShareMenu} setShowShareMenu={setShowShareMenu} selectedLanguage={selectedLanguage} onShareWhatsApp={shareOnWhatsApp} onShareTwitter={shareOnTwitter} onShareFacebook={shareOnFacebook} onCopyLink={copyArticleLink} user={user} onRequireLogin={handleRequireLogin} bookmarked={bookmarkedIds.has(item.id)} onBookmarkChange={handleBookmarkChange} />
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

                  <button onClick={() => setSubscriptionOpen(true)} className="kn-premium-btn" style={{ backgroundColor: ACCENT, color: 'white' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1134a7')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#152a58')}>
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

            {/* Personlised News */}
            <PersonalizedFeed selectedLanguage={selectedLanguage} />

            {/* Upcoming events / special coverage */}
            <EventPromotions dark={dark} selectedLanguage={selectedLanguage} />

            {/* Category showcase */}
            {!isMobileView && categories.length > 0 && !loading && (
              <CategoryShowcase categories={categories} onCategoryClick={setSelectedCategory} dark={dark} selectedLanguage={selectedLanguage} />
            )}
          </main>

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
