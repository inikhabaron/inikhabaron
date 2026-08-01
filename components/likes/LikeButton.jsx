'use client';

import { useContext, useEffect, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DarkCtx } from '@/lib/news-contexts';
import styles from './LikeButton.module.css';

const ACCENT = '#EF4444';

export default function LikeButton({
  articleId,
  user,
  // Whether the khabaron_session cookie exists yet (SiteChromeProvider).
  // Deliberately separate from `user`, which stays Firebase auth state: `user`
  // gates the login prompt below, `sessionReady` gates the authenticated
  // status fetch. Folding them together would prompt "please sign in" during
  // the sub-second window after login while the cookie is still being issued.
  // Intentionally has no default — a caller that forgets it gets a like status
  // that never loads (visible in dev) rather than a silent 401 race.
  sessionReady,
  onRequireLogin,
  size = 'lg',
}) {
  const dark = useContext(DarkCtx);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [animation, setAnimation] = useState('');
  const [showRipple, setShowRipple] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const iconSize = size === 'sm' ? 14 : 22;

  useEffect(() => {
    if (!user || !sessionReady || !articleId) {
      setLiked(false);
      setCount(0);
      return;
    }

    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch(`/api/news/${articleId}/like`, {
          credentials: 'include',
          cache: 'no-store',
        });

        const data = await res.json();

        if (!cancelled && data.success) {
          setLiked(data.data.liked);
          setCount(data.data.count);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [articleId, user, sessionReady]);

  async function toggleLike() {
    if (!user) {
      onRequireLogin?.();
      return;
    }

    const previousLiked = liked;
    const previousCount = count;

    const nextLiked = !liked;

    // Optimistic UI
    setLiked(nextLiked);
    setCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));

    if (nextLiked) {
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

    try {
      setLoading(true);

      const method = nextLiked ? 'POST' : 'DELETE';

      const res = await fetch(`/api/news/${articleId}/like`, {
        method,
        credentials: 'include',
      });

      const data = await res.json();

      if (!data.success) {
        // Rollback
        setLiked(previousLiked);
        setCount(previousCount);

        toast.error(data.message);
        return;
      }

      // Sync with server
      setLiked(data.data.liked);
      setCount(data.data.count);

      toast.success(data.message);
    } catch (err) {
      console.error(err);

      // Rollback
      setLiked(previousLiked);
      setCount(previousCount);

      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <button
        className={`${styles.likeButton} ${dark ? 'dark' : ''} ${animation}`}
        onClick={toggleLike}
        disabled={loading}
        title={liked ? 'Unlike Article' : 'Like Article'}
        aria-label={liked ? 'Unlike Article' : 'Like Article'}
        style={{
          position: 'relative',

          width: size === 'sm' ? 28 : 44,
          height: size === 'sm' ? 28 : 44,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          borderRadius: '50%',

          border: liked
            ? `1px solid ${ACCENT}`
            : '1px solid var(--bookmark-border)',

          background: liked
            ? `${ACCENT}12`
            : 'var(--bookmark-card)',

          cursor: loading ? 'not-allowed' : 'pointer',

          transition: 'all .25s ease',

          boxShadow: liked
            ? '0 6px 18px rgba(239,68,68,.25)'
            : 'none',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'scale(1.08)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
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
          })}

        {loading ? (
          <Loader2
            size={iconSize}
            className="animate-spin"
            color={ACCENT}
          />
        ) : (
          <Heart
            size={iconSize}
            color={liked ? ACCENT : 'var(--bookmark-muted)'}
            fill={liked ? ACCENT : 'none'}
            strokeWidth={2.2}
          />
        )}
      </button>

      {/* <span
        className={styles.count}
        style={{
          fontSize: size === 'sm' ? 12 : 14,
        }}
      >
        {count}
      </span> */}
    </div>
  );
}