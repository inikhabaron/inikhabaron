'use client';

import { useEffect, useState } from 'react';

import BookmarkList from '@/components/bookmarks/BookmarkList';
import BookmarkSkeleton from '@/components/bookmarks/BookmarkSkeleton';
import EmptyBookmarks from '@/components/bookmarks/EmptyBookmarks';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      loadBookmarks(),
      loadUser(),
    ]);
  }, []);

  async function loadBookmarks() {
    try {
      setLoading(true);

      const res = await fetch('/api/users/bookmarks', {
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        setBookmarks(data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  async function loadUser() {
    try {
      const res = await fetch('/api/test/user', {
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return <BookmarkSkeleton />;
  }

  if (!bookmarks.length) {
    return <EmptyBookmarks />;
  }

  return (
    <BookmarkList
      bookmarks={bookmarks}
      user={user}
      onRefresh={loadBookmarks}
    />
  );
}