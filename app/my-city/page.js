'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, RefreshCw, Newspaper } from 'lucide-react';

import Header from '@/components/home/Header';
import SiteFooter from '@/components/home/SiteFooter';
import AuthDialog from '@/components/home/AuthDialog';
import HorizontalArticleCard from '@/components/home/HorizontalArticleCard';
import FollowButton from '@/components/follow/FollowButton';
import { applyFollowChange } from '@/lib/follow/applyFollowChange';
import useSiteChrome from '@/hooks/useSiteChrome';
import { ACCENT, ACCENT_H, formatDate } from '@/lib/news-utils';

function locationBadge(article) {
  const location = article.location || {};
  if (location.scope === 'district' && location.districtName) return `📍 ${location.districtName}`;
  if (location.scope === 'state' && location.stateName) return `📍 ${location.stateName}`;
  return '🇮🇳 National';
}

function SkeletonRow({ bdr, surface }) {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: `1px solid ${bdr}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ width: 70, height: 10, borderRadius: 4, background: bdr, marginBottom: 10 }} />
        <div style={{ width: '85%', height: 14, borderRadius: 4, background: bdr, marginBottom: 8 }} />
        <div style={{ width: '60%', height: 14, borderRadius: 4, background: bdr, marginBottom: 10 }} />
        <div style={{ width: 90, height: 10, borderRadius: 4, background: bdr }} />
      </div>
      <div style={{ width: 100, height: 90, borderRadius: 8, background: bdr, flexShrink: 0 }} />
    </div>
  );
}

export default function MyCityPage() {
  const router = useRouter();
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

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ scope: 'national', stateName: null, districtName: null });
  const [following, setFollowing] = useState({ categories: [], authors: [], cities: [] });

  useEffect(() => {
    if (!user) {
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
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/news/my-city?limit=20', { credentials: 'include', cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load My City news.');
        if (!active) return;
        setArticles(data.data || []);
        setMeta(data.meta || { scope: 'national', stateName: null, districtName: null });
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Unable to load My City news.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFeed();
    return () => { active = false; };
  }, []);

  const isHindi = selectedLanguage === 'hi';

  const heading = useMemo(() => {
    switch (meta.scope) {
      case 'district':
        return meta.districtName ? (isHindi ? `${meta.districtName} की खबरें` : `News for ${meta.districtName}`) : (isHindi ? 'आपके ज़िले की खबरें' : 'District news for you');
      case 'state':
        return meta.stateName ? (isHindi ? `${meta.stateName} की खबरें` : `News for ${meta.stateName}`) : (isHindi ? 'आपके राज्य की खबरें' : 'State news for you');
      default:
        return isHindi ? 'राष्ट्रीय समाचार' : 'National News';
    }
  }, [meta.scope, meta.stateName, meta.districtName, isHindi]);

  const goToArticle = (item) => router.push(`/news/${item.id}`);

  return (
    <>
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
        <div className="kn-content-wrap" style={{ padding: isMobileView ? '16px 14px 60px' : '28px 5px 70px' }}>

          {/* Hero */}
          <section
            style={{
              borderRadius: 18,
              padding: isMobileView ? '24px 20px' : '32px 36px',
              marginBottom: 28,
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_H})`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
              boxShadow: '0 16px 40px rgba(21,42,88,0.28)',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.16)', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                <MapPin size={14} />
                {isHindi ? 'मेरा शहर' : 'My City'}
              </div>
              <h1 style={{ fontSize: isMobileView ? 24 : 32, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.25 }}>{heading}</h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: 14, maxWidth: 520 }}>
                {isHindi ? 'यह फीड राष्ट्रीय समाचारों को आपकी सेव की गई लोकेशन की स्थानीय खबरों के साथ जोड़ती है।' : 'This feed combines national stories with the news most relevant to your saved location.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {meta.scope !== 'national' && (
                <FollowButton
                  type="city"
                  id={meta.districtName || meta.stateName}
                  user={user}
                  following={following.cities.some((c) => c.id === (meta.districtName || meta.stateName))}
                  onRequireLogin={() => setAuthDialogOpen(true)}
                  onChange={(change) => setFollowing((prev) => applyFollowChange(prev, {
                    ...change,
                    item: { id: meta.districtName || meta.stateName, name: meta.districtName || meta.stateName, exists: true },
                  }))}
                  labels={isHindi ? { follow: 'फॉलो करें', following: 'फॉलो कर रहे हैं' } : undefined}
                />
              )}
              <button
                onClick={() => router.push('/settings')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}
              >
                <Navigation size={16} />
                {isHindi ? 'लोकेशन बदलें' : 'Change location'}
              </button>
            </div>
          </section>

          {/* Loading */}
          {loading && (
            <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: '8px 20px' }}>
              {[0, 1, 2, 3].map(i => <SkeletonRow key={i} bdr={bdr} surface={surface} />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ borderRadius: 16, background: dark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${dark ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, padding: 28, textAlign: 'center' }}>
              <p style={{ color: '#EF4444', fontWeight: 600, margin: '0 0 14px' }}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                <RefreshCw size={14} />
                {isHindi ? 'पुनः प्रयास करें' : 'Try again'}
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && articles.length === 0 && (
            <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: dark ? 'rgba(59,175,218,0.14)' : '#EBF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <MapPin size={26} color={ACCENT} />
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: T1, marginBottom: 8 }}>
                {isHindi ? 'अपनी लोकेशन सेट करें' : 'Set your location'}
              </div>
              <p style={{ color: T2, margin: '0 0 20px', fontSize: 14, maxWidth: 400, marginInline: 'auto' }}>
                {isHindi ? 'राष्ट्रीय खबरों के साथ स्थानीय खबरें पाने के लिए अपना राज्य और ज़िला चुनें।' : 'Choose your state and district to receive local news alongside national headlines.'}
              </p>
              <button
                onClick={() => router.push('/settings')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_H})`, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                <MapPin size={16} />
                {isHindi ? 'लोकेशन चुनें' : 'Choose Location'}
              </button>
            </div>
          )}

          {/* Articles */}
          {!loading && !error && articles.length > 0 && (
            <>
              <div className="kn-section-label">
                <div className="kn-section-bar" />
                <span className="kn-section-text" style={{ color: T3 }}>
                  {isHindi ? 'आपके लिए खबरें' : 'Latest for you'}
                </span>
              </div>

              <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: '4px 20px' }}>
                {articles.map((article) => (
                  <div key={article.id || article._id}>
                    <span style={{ display: 'inline-block', marginTop: 14, fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.03em' }}>
                      {locationBadge(article)}
                    </span>
                    <HorizontalArticleCard
                      item={article}
                      onClick={goToArticle}
                      formatDate={formatDate}
                      selectedLanguage={selectedLanguage}
                      dark={dark}
                      textScale={1}
                      selectedFont={null}
                      bdr={bdr}
                      T1={T1}
                      T2={T2}
                      T3={T3}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <SiteFooter
          dark={dark} categories={categories} selectedLanguage={selectedLanguage}
          onCategoryClick={(slug) => router.push(`/?category=${slug}`)}
          newsletterEmail={newsletterEmail} setNewsletterEmail={setNewsletterEmail}
          onNewsletterSubscribe={handleNewsletterSubscribe} newsletterLoading={newsletterLoading}
        />
      </div>

      <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} loading={authLoading} bdr={bdr} />
    </>
  );
}
