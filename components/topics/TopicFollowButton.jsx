'use client';

import { useEffect, useState } from 'react';
import FollowButton from '@/components/follow/FollowButton';
import AuthDialog from '@/components/home/AuthDialog';
import useSiteChrome from '@/hooks/useSiteChrome';

// The one interactive island on an otherwise fully server-rendered SEO page
// (app/topics/[slug]/page.js mirrors app/category/[slug]/page.js on purpose
// — see SeoPageShell). Fetches its own follow status rather than requiring
// the page to thread `following` state through, since this page only ever
// has the one follow target.
export default function TopicFollowButton({ tag }) {
  const {
    user, sessionReady, selectedLanguage,
    authDialogOpen, setAuthDialogOpen, authLoading,
    handleGoogleSignIn, handleAppleSignIn,
  } = useSiteChrome();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!user || !sessionReady) {
      setFollowing(false);
      return;
    }

    let cancelled = false;

    fetch('/api/users/following', { credentials: 'include', cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setFollowing((data.data.tags || []).some((t) => t.id === tag.id));
        }
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [user, sessionReady, tag.id]);

  const isHindi = selectedLanguage === 'hi';
  const labels = isHindi
    ? { follow: 'विषय को फॉलो करें', following: 'विषय को फॉलो कर रहे हैं' }
    : { follow: 'Follow Topic', following: 'Following Topic' };

  return (
    <>
      <FollowButton
        type="tag"
        id={tag.id}
        user={user}
        following={following}
        onRequireLogin={() => setAuthDialogOpen(true)}
        onChange={(change) => setFollowing(change.following)}
        labels={labels}
      />
      {/* This SEO shell page (see SeoPageShell) has no other AuthDialog on
          it — without this, clicking Follow while logged out silently did
          nothing. */}
      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
        loading={authLoading}
        bdr="#E8EAED"
      />
    </>
  );
}
