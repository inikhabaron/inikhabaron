'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, } from 'lucide-react';

import BookmarkCard from './BookmarkCard';
import BookmarkPageHeader from './BookmarkPageHeader';
import BookmarkSearch from './BookmarkSearch';
import styles from './BookmarkList.module.css';

import UserProfileChip from '@/components/common/UserProfileChip';

export default function BookmarkList({
  bookmarks,
  user,
  onRefresh,
}) {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filteredBookmarks = useMemo(() => {
    if (!search.trim()) return bookmarks;

    const query = search.toLowerCase();

    return bookmarks.filter((article) => {
      return (
        article.title?.toLowerCase().includes(query) ||
        article.excerpt?.toLowerCase().includes(query) ||
        article.category?.toLowerCase().includes(query)
      );
    });
  }, [bookmarks, search]);

  const lastSaved =
    bookmarks.length > 0
      ? new Date(bookmarks[0].bookmarkedAt).toLocaleDateString()
      : '—';

  return (
    <div
      className={styles.container}
    >
      <div
        className={styles.topBar}
      >
        <button
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <UserProfileChip user={user} compact={false} showProvider={true} />
      </div>
      {/* Header + User */}

      <div
        className={styles.headerSection}
      >
        <BookmarkPageHeader
          total={bookmarks.length}
          lastSaved={lastSaved}
        />        
      </div>

      {/* Search */}

      <BookmarkSearch
        value={search}
        onChange={setSearch}
      />

      {/* Search Result Count */}

      <div
        className={styles.count}
      >
        Showing{' '}
        <strong>
          {filteredBookmarks.length}
        </strong>{' '}
        of{' '}
        <strong>
          {bookmarks.length}
        </strong>{' '}
        saved article
        {bookmarks.length !== 1 ? 's' : ''}
      </div>

      {/* Cards */}

      <div
        className={styles.cards}
      >
        {filteredBookmarks.length > 0 ? (
          filteredBookmarks.map((article) => (
            <BookmarkCard
              key={article.id}
              article={article}
              onRemoved={onRefresh}
            />
          ))
        ) : (
          <div
            className={styles.noResults}
          >
            <h3>
              No matching bookmarks
            </h3>

            <p>
              Try searching with a different keyword.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}