'use client';

import { useCallback, useEffect, useState } from 'react';

// Fetches the current user's bookmarked article ids ONCE per page (not once
// per BookmarkButton) and exposes a change handler so every button on the
// page — even multiple cards for the same article — stays in sync when one
// of them is toggled. Mirrors the same pattern useSiteChrome/Follow already
// use: one shared fetch, each button derives its own boolean from it.
export default function useBookmarkedIds(user) {
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set());

  useEffect(() => {
    if (!user) {
      setBookmarkedIds(new Set());
      return;
    }

    let cancelled = false;

    fetch('/api/users/bookmarks/ids', { credentials: 'include', cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setBookmarkedIds(new Set(data.data.articleIds));
        }
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleBookmarkChange = useCallback(({ articleId, bookmarked }) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (bookmarked) next.add(articleId);
      else next.delete(articleId);
      return next;
    });
  }, []);

  return { bookmarkedIds, handleBookmarkChange };
}
