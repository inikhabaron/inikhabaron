'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from './BookmarkButton.module.css';

const ACCENT = '#3BAFDA';

export default function BookmarkButton({
  articleId,
  user,
  onRequireLogin,
  size = 'lg',
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animation, setAnimation] = useState('');
  const [showRipple, setShowRipple] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const iconSize = size === 'sm' ? 14 : 22;

  useEffect(() => {
    if (!user || !articleId) {
      setBookmarked(false);
      return;
    }

    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch(`/api/news/${articleId}/bookmark`, {
          credentials: 'include',
          cache: 'no-store',
        });

        const data = await res.json();

        if (!cancelled && data.success) {
          setBookmarked(data.data.bookmarked);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [articleId, user]);

  async function toggleBookmark() {
    if (!user) {
      onRequireLogin?.();
      return;
    }

    try {
      setLoading(true);

      const method = bookmarked ? 'DELETE' : 'POST';

      const res = await fetch(`/api/news/${articleId}/bookmark`, {
        method,
        credentials: 'include',
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      setBookmarked(!bookmarked);

      if (!bookmarked) {
        setAnimation(styles.saved);
        setShowRipple(true);
        setShowParticles(true);
      } else {
        setAnimation(styles.unsaved);
      }

      setTimeout(() => {
        setAnimation('');
        setShowRipple(false);
        setShowParticles(false);
      }, 450);

      toast.success(data.message);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`${styles.bookmarkButton} ${bookmarked ? styles.active : ''} ${animation}`}
      onClick={toggleBookmark}
      disabled={loading}
      title={bookmarked ? 'Remove Bookmark' : 'Save Article'}
      aria-label={bookmarked ? 'Remove Bookmark' : 'Save Article'}
      style={{
        width: size === 'sm' ? 28 : 44,
        height: size === 'sm' ? 28 : 44,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
      
    >
        {showRipple && (
            <span
                className={styles.ripple}
                style={{
                background: 'color-mix(in srgb, var(--bookmark-accent) 40%, transparent)',
                }}
            />
        )}
        {showParticles &&
            Array.from({ length: 6 }).map((_, i) => {
                const angle = (Math.PI * 2 * i) / 6;
                const distance = 18;

                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;

                return (
                    <span
                        key={i}
                        className={styles.particle}
                        style={{
                        background: 'var(--bookmark-accent)',
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        }}
                    />
                );
            })
        }
      {loading ? (
        <Loader2
          size={iconSize}
          className="animate-spin"
          color="var(--bookmark-accent)"
        />
      ) : (
        <Bookmark
          size={iconSize}
          color={bookmarked ?'var(--bookmark-accent)' : 'var(--bookmark-muted)'}
          fill={bookmarked ? 'var(--bookmark-accent)' : 'none'}
          strokeWidth={2.2}
        />
      )}
    </button>
  );
}