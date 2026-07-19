'use client';

import { useRouter } from 'next/navigation';

import Header from '@/components/home/Header';
import SiteFooter from '@/components/home/SiteFooter';
import AuthDialog from '@/components/home/AuthDialog';
import { DarkCtx } from '@/lib/news-contexts';

// Shared Header/Footer/AuthDialog chrome for utility pages that aren't the
// main reading surfaces (Settings, Saved Articles, Following, My City).
// `chrome` is passed straight through from each page's own `useSiteChrome()`
// call — spread onto Header/SiteFooter rather than named field-by-field, so
// this layout doesn't need updating every time useSiteChrome()'s shape grows.
// Only the handful of prop names that genuinely differ (Header's onSignIn/
// onSignOut/onSearch, SiteFooter's onNewsletterSubscribe) are mapped here.
export default function PublicPageLayout({ chrome, children }) {
  const router = useRouter();
  const { dark, bg, HEADER_H, setAuthDialogOpen, handleSignOut, handleSearch, handleNewsletterSubscribe, authDialogOpen, handleGoogleSignIn, handleAppleSignIn, authLoading, bdr } = chrome;

  return (
    <DarkCtx.Provider value={dark}>
      <Header
        {...chrome}
        onSignIn={() => setAuthDialogOpen(true)}
        onSignOut={handleSignOut}
        onSearch={handleSearch}
        setShowMobileSearch={() => router.push('/')}
      />

      <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: `${HEADER_H}px` }}>
        {children}

        <SiteFooter
          {...chrome}
          onCategoryClick={(slug) => router.push(`/?category=${slug}`)}
          onNewsletterSubscribe={handleNewsletterSubscribe}
        />
      </div>

      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
        loading={authLoading}
        bdr={bdr}
      />
    </DarkCtx.Provider>
  );
}
