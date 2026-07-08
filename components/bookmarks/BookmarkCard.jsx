'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookmarkX, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import styles from './BookmarkCard.module.css';

export default function BookmarkCard({
  article,
  onRemoved,
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString()
    : '';

  const savedDate = article.bookmarkedAt
    ? new Date(article.bookmarkedAt).toLocaleDateString()
    : '';

  async function removeBookmark(e) {
    e.stopPropagation();

    try {
      setLoading(true);

      const res = await fetch(
        `/api/news/${article.id}/bookmark`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      toast.success('Bookmark removed');

      onRemoved?.();
    } catch (err) {
      console.error(err);
      toast.error('Unable to remove bookmark');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/news/${article.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow =
          '0 12px 30px rgba(0,0,0,.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <img
        className={styles.image}
        src={
          article.featuredImage ||
          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200'
        }
        alt={article.title}
      />

      <div
        className={styles.content}
      >
        <span
          className={styles.category}
        >
          {article.category}
        </span>

        <h2
          className={styles.title}
        >
          {article.title}
        </h2>

        {article.excerpt && (
          <p
            className={styles.excerpt}
          >
            {article.excerpt}
          </p>
        )}

        <div
          className={styles.meta}
        >
          <span
            className={styles.metaItem}
          >
            <Calendar size={15} />

            Published {publishedDate}
          </span>

          <span
            className={styles.metaItem}
          >
            <Clock size={15} />

            Saved {savedDate}
          </span>
        </div>
      </div>

      <button
        className={styles.removeButton}
        onClick={removeBookmark}
        disabled={loading}
      >
        <BookmarkX size={23} style={{display: 'inline', verticalAlign: 'sub', alignItems: 'center'}} />
      </button>
    </div>
  );
}