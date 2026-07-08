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
      className={`${styles.bookmarkButton} ${animation}`}
      onClick={toggleBookmark}
      disabled={loading}
      title={bookmarked ? 'Remove Bookmark' : 'Save Article'}
      aria-label={bookmarked ? 'Remove Bookmark' : 'Save Article'}
      style={{
        width: size === 'sm' ? 28 : 44,
        height: size === 'sm' ? 28 : 44,

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        borderRadius: '50%',

        border: bookmarked
          ? `1px solid ${ACCENT}`
          : '1px solid #E5E7EB',

        background: bookmarked
          ? `${ACCENT}10`
          : '#FFFFFF',

        cursor: loading ? 'not-allowed' : 'pointer',

        transition: 'all .25s ease',

        boxShadow: bookmarked
          ? '0 6px 18px rgba(59,175,218,.25)'
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (!loading)
          e.currentTarget.style.transform = 'scale(1.08)';
      }}
      
    >
        {showRipple && (
            <span
                className={styles.ripple}
                style={{
                background: `${ACCENT}40`,
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
                        background: ACCENT,
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
          color={ACCENT}
        />
      ) : (
        <Bookmark
          size={iconSize}
          color={bookmarked ? ACCENT : '#6B7280'}
          fill={bookmarked ? ACCENT : 'none'}
          strokeWidth={2.2}
        />
      )}
    </button>
  );
}