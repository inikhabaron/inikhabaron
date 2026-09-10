'use client';

import { useEffect, useState } from 'react';
import FollowButton from '@/components/follow/FollowButton';
import AuthDialog from '@/components/home/AuthDialog';
import useSiteChrome from '@/hooks/useSiteChrome';

// The one interactive island on an otherwise fully server-rendered SEO page
// (app/author/[id]/page.js mirrors app/topics/[slug]/page.js on purpose —
// see SeoPageShell). Fetches its own follow status rather than requiring
// the page to thread `following` state through, since this page only ever
// has the one follow target.
export default function AuthorFollowButton({ authorId }) {
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
          setFollowing((data.data.authors || []).some((a) => a.id === authorId));
        }
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [user, sessionReady, authorId]);

  const isHindi = selectedLanguage === 'hi';
  const labels = isHindi
    ? { follow: 'फॉलो करें', following: 'फॉलो कर रहे हैं' }
    : { follow: 'Follow', following: 'Following' };

  return (
    <>
      <FollowButton
        type="author"
        id={authorId}
        user={user}
        following={following}
        onRequireLogin={() => setAuthDialogOpen(true)}
        onChange={(change) => setFollowing(change.following)}
        labels={labels}
      />
      {/* This SEO shell page (see SeoPageShell) has no other AuthDialog on
          it — without this, clicking Follow while logged out silently did
          nothing (same gap found and fixed for TopicFollowButton). */}
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
