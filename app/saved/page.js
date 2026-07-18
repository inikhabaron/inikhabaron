'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, Heart } from 'lucide-react';

import Header from '@/components/home/Header';
import SiteFooter from '@/components/home/SiteFooter';
import AuthDialog from '@/components/home/AuthDialog';
import BookmarkList from '@/components/bookmarks/BookmarkList';
import EmptyBookmarks from '@/components/bookmarks/EmptyBookmarks';
import BookmarkSkeleton from '@/components/bookmarks/BookmarkSkeleton';
import useSiteChrome from '@/hooks/useSiteChrome';
import { DarkCtx } from '@/lib/news-contexts';
import { ACCENT, ACCENT_H } from '@/lib/news-utils';

export default function SavedArticlesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chrome = useSiteChrome();
  const {
    dark, toggleDark, selectedLanguage, setSelectedLanguage, translations, t,
    user, authLoading, authDialogOpen, setAuthDialogOpen, handleGoogleSignIn, handleAppleSignIn, handleSignOut,
    categories, breakingNews, selectedCategory, setSelectedCategory,
    isMobileView, isSearchActive, setIsSearchActive,
    searchQuery, setSearchQuery, handleSearch,
    newsletterEmail, setNewsletterEmail, newsletterLoading, handleNewsletterSubscribe,
    bg, surface, bdr, T1, T2, T3, HEADER_H,
  } = chrome;

  const isHindi = selectedLanguage === 'hi';
  const initialTab = searchParams.get('tab') === 'liked' ? 'liked' : 'bookmarked';

  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [bookmarked, setBookmarked] = useState([]);
  const [liked, setLiked] = useState([]);
  const [error, setError] = useState('');

  async function loadSaved() {
    try {
      setLoading(true);
      setError('');

      const [bookmarksRes, likesRes] = await Promise.all([
        fetch('/api/users/bookmarks', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/users/likes', { credentials: 'include', cache: 'no-store' }),
      ]);

      if (bookmarksRes.status === 401 || likesRes.status === 401) {
        setAuthRequired(true);
        router.replace('/?authRequired=1&redirect=%2Fsaved');
        return;
      }

      const bookmarksData = await bookmarksRes.json();
      const likesData = await likesRes.json();

      if (!bookmarksRes.ok || !bookmarksData.success) throw new Error(bookmarksData.message || 'Unable to load bookmarks.');
      if (!likesRes.ok || !likesData.success) throw new Error(likesData.message || 'Unable to load likes.');

      setBookmarked(bookmarksData.data.items || []);
      setLiked(likesData.data.items || []);
    } catch (err) {
      setError(err.message || 'Unable to load your saved articles.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSaved();
  }, []);

  const chromeShell = (children) => (
    <DarkCtx.Provider value={dark}>
      <Header
        dark={dark} toggleDark={toggleDark}
        selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage}
        translations={translations}
        user={user} onSignIn={() => setAuthDialogOpen(true)} onSignOut={handleSignOut}
        categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}
        breakingNews={breakingNews} isMobileView={isMobileView}
        setShowMobileSearch={() => router.push('/')} setIsSearchActive={setIsSearchActive}
        t={t} surface={surface} bdr={bdr} T1={T1} T2={T2} T3={T3}
      />
      <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: `${HEADER_H}px` }}>
        {children}
      </div>
      <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} loading={authLoading} bdr={bdr} />
    </DarkCtx.Provider>
  );

  if (authRequired) {
    return chromeShell(
      <div className="kn-content-wrap" style={{ padding: '60px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, width: '100%', borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T1, margin: '0 0 8px' }}>
            {isHindi ? 'साइन इन आवश्यक है' : 'Sign in required'}
          </h1>
          <p style={{ fontSize: 14, color: T2, margin: 0 }}>
            {isHindi ? 'आपको साइन इन पेज पर भेजा जा रहा है...' : 'Redirecting you to sign in...'}
          </p>
        </div>
      </div>
    );
  }

  const activeItems = activeTab === 'liked' ? liked : bookmarked;

  return chromeShell(
    <div className="kn-content-wrap" style={{ padding: isMobileView ? '16px 14px 60px' : '28px 5px 70px' }}>

      {/* Hero */}
      <section
        style={{
          borderRadius: 18,
          padding: isMobileView ? '24px 20px' : '32px 36px',
          marginBottom: 24,
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_H})`,
          color: '#fff',
          boxShadow: '0 16px 40px rgba(21,42,88,0.28)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.16)', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          <Bookmark size={14} />
          {isHindi ? 'सेव किए गए लेख' : 'Saved Articles'}
        </div>
        <h1 style={{ fontSize: isMobileView ? 22 : 28, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.25 }}>
          {isHindi ? 'आपके सेव किए गए लेख' : 'Your saved articles'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: 14, maxWidth: 480 }}>
          {isHindi
            ? 'बुकमार्क और पसंद किए गए लेख — सभी एक ही जगह पर।'
            : 'Bookmarked and liked articles, all in one place.'}
        </p>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('bookmarked')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12,
            border: `1px solid ${activeTab === 'bookmarked' ? ACCENT : bdr}`,
            background: activeTab === 'bookmarked' ? ACCENT : surface,
            color: activeTab === 'bookmarked' ? '#fff' : T1,
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          <Bookmark size={16} />
          {isHindi ? 'बुकमार्क किए गए' : 'Bookmarked'} ({bookmarked.length})
        </button>
        <button
          onClick={() => setActiveTab('liked')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12,
            border: `1px solid ${activeTab === 'liked' ? ACCENT : bdr}`,
            background: activeTab === 'liked' ? ACCENT : surface,
            color: activeTab === 'liked' ? '#fff' : T1,
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          <Heart size={16} />
          {isHindi ? 'पसंद किए गए' : 'Liked'} ({liked.length})
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: dark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${dark ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {loading ? (
        <BookmarkSkeleton dark={dark} />
      ) : activeItems.length === 0 ? (
        <EmptyBookmarks
          dark={dark}
          icon={activeTab === 'liked' ? Heart : Bookmark}
          title={activeTab === 'liked'
            ? (isHindi ? 'अभी तक कोई पसंदीदा लेख नहीं' : 'No liked articles yet')
            : (isHindi ? 'अभी तक कोई बुकमार्क नहीं' : 'No bookmarks yet')}
          subtitle={activeTab === 'liked'
            ? (isHindi ? 'आपके पसंद किए गए लेख यहाँ दिखाई देंगे।' : 'Articles you like will appear here.')
            : (isHindi ? 'आपके सेव किए गए लेख यहाँ दिखाई देंगे।' : 'Articles you save will appear here.')}
          ctaLabel={isHindi ? 'समाचार ब्राउज़ करें' : 'Browse News'}
          ctaHref="/"
        />
      ) : (
        <BookmarkList
          bookmarks={activeItems}
          user={user}
          onRefresh={loadSaved}
          type={activeTab === 'liked' ? 'like' : 'bookmark'}
          dark={dark}
          showTopBar={false}
          showHeader={false}
          searchPlaceholder={activeTab === 'liked'
            ? (isHindi ? 'पसंद किए गए लेख खोजें...' : 'Search liked articles...')
            : (isHindi ? 'बुकमार्क किए गए लेख खोजें...' : 'Search bookmarked articles...')}
        />
      )}
    </div>
  );
}
