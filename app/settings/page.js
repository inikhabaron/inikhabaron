'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

import Header from '@/components/home/Header';
import SiteFooter from '@/components/home/SiteFooter';
import AuthDialog from '@/components/home/AuthDialog';
import LocationSelector from '@/components/location/LocationSelector';
import useSiteChrome from '@/hooks/useSiteChrome';
import { ACCENT, ACCENT_H } from '@/lib/news-utils';

const DEFAULT_LOCATION = {
  enabled: false,
  scope: 'national',
  country: 'India',
};

export default function SettingsPage() {
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

  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const isHindi = selectedLanguage === 'hi';

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      try {
        const response = await fetch('/api/users/location', { credentials: 'include', cache: 'no-store' });

        if (response.status === 401) {
          if (active) {
            setAuthRequired(true);
            router.replace('/?authRequired=1&redirect=%2Fsettings');
          }
          return;
        }

        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load your settings.');
        if (!active) return;
        setLocation(data.data || DEFAULT_LOCATION);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load your settings.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLocation();
    return () => { active = false; };
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setError('');
      setSavedMessage('');

      const response = await fetch('/api/users/location', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to save your location.');

      setLocation(data.data);
      setSavedMessage(isHindi ? 'लोकेशन सेव हो गई।' : 'Location saved.');
    } catch (err) {
      setError(err.message || 'Unable to save your location.');
    } finally {
      setSaving(false);
    }
  }

  const chromeShell = (children) => (
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
        {children}
      </div>
      <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} loading={authLoading} bdr={bdr} />
    </>
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

  return chromeShell(
    <div className="kn-content-wrap" style={{ padding: isMobileView ? '16px 14px 60px' : '28px 5px 70px', maxWidth: 760 }}>

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
          <MapPin size={14} />
          {isHindi ? 'सेटिंग्स' : 'Settings'}
        </div>
        <h1 style={{ fontSize: isMobileView ? 22 : 28, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.25 }}>
          {isHindi ? 'अपनी लोकेशन चुनें' : 'Choose your location'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: 14, maxWidth: 480 }}>
          {isHindi
            ? 'अपनी लोकेशन सेट करें ताकि माय सिटी आपको राष्ट्रीय, राज्य और ज़िले की प्रासंगिक खबरें दिखा सके।'
            : 'Choose your location so My City can show you national, state, and district news that matters to you.'}
        </p>
      </section>

      {/* Form card */}
      <section style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: isMobileView ? 20 : 28 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1].map(i => (
              <div key={i}>
                <div style={{ width: 90, height: 10, borderRadius: 4, background: bdr, marginBottom: 10 }} />
                <div style={{ width: '100%', height: 40, borderRadius: 10, background: bdr }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <LocationSelector value={location} onChange={setLocation} />

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '10px 14px', borderRadius: 10, background: dark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${dark ? 'rgba(239,68,68,0.3)' : '#FECACA'}` }}>
                <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {savedMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '10px 14px', borderRadius: 10, background: dark ? 'rgba(34,197,94,0.1)' : '#F0FDF4', border: `1px solid ${dark ? 'rgba(34,197,94,0.3)' : '#BBF7D0'}` }}>
                <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 500 }}>{savedMessage}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12,
                  border: 'none', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_H})`, color: '#fff',
                  fontWeight: 600, fontSize: 14, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (isHindi ? 'सेव हो रहा है...' : 'Saving...') : (isHindi ? 'लोकेशन सेव करें' : 'Save location')}
              </button>
              <button
                onClick={() => router.push('/my-city')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, border: `1px solid ${bdr}`, background: 'transparent', color: T1, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                {isHindi ? 'माय सिटी देखें' : 'View My City'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
