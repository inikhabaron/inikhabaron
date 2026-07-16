'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from './FollowButton.module.css';

export default function FollowButton({
  type,
  id,
  user,
  following = false,
  onRequireLogin,
  onChange,
  size = 'lg',
  labels,
}) {
  const [isFollowing, setIsFollowing] = useState(following);
  const [loading, setLoading] = useState(false);
  const [animation, setAnimation] = useState('');
  const [showRipple, setShowRipple] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    setIsFollowing(following);
  }, [following]);

  const iconSize = size === 'sm' ? 12 : 15;
  const followLabel = labels?.follow || 'Follow';
  const followingLabel = labels?.following || 'Following';

  async function toggleFollow() {
    if (!user) {
      onRequireLogin?.();
      return;
    }

    const previous = isFollowing;
    const next = !previous;

    setIsFollowing(next);
    setLoading(true);

    if (next) {
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
      const res = await fetch('/api/users/follow', {
        method: next ? 'POST' : 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });

      const data = await res.json();

      if (!data.success) {
        setIsFollowing(previous);
        toast.error(data.message);
        return;
      }

      setIsFollowing(data.data.following);
      onChange?.({ type, id, following: data.data.following });
    } catch (err) {
      console.error(err);
      setIsFollowing(previous);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`${styles.followButton} ${isFollowing ? styles.active : ''} ${animation}`}
      onClick={toggleFollow}
      disabled={loading}
      title={isFollowing ? followingLabel : followLabel}
      aria-pressed={isFollowing}
      style={{
        height: size === 'sm' ? 28 : 44,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {showRipple && (
        <span
          className={styles.ripple}
          style={{ background: 'color-mix(in srgb, var(--bookmark-accent) 40%, transparent)' }}
        />
      )}
      {showParticles &&
        Array.from({ length: 6 }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / 6;
          const distance = 20;
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
        })}
      {loading ? (
        <Loader2
          size={iconSize}
          className="animate-spin"
          color={isFollowing ? 'var(--bookmark-accent)' : 'var(--bookmark-muted)'}
        />
      ) : isFollowing ? (
        <Check size={iconSize} color="var(--bookmark-accent)" strokeWidth={2.4} />
      ) : (
        <Plus size={iconSize} color="var(--bookmark-muted)" strokeWidth={2.4} />
      )}
      <span className={styles.label}>{isFollowing ? followingLabel : followLabel}</span>
    </button>
  );
}
