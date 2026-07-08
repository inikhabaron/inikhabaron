'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import styles from './Comments.module.css';

export default function CommentLikeButton({
  commentId,
  likes = 0,
  liked = false,
  user,
  onRequireLogin,
  onUpdate,
}) {
  const [loading, setLoading] = useState(false);

  const [isLiked, setIsLiked] = useState(liked);

  const [count, setCount] = useState(likes);

  async function toggleLike() {
    if (!user) {
      onRequireLogin?.();
      return;
    }

    const previousLiked = isLiked;
    const previousCount = count;

    const nextLiked = !previousLiked;

    // Optimistic UI
    setIsLiked(nextLiked);

    setCount((current) =>
      nextLiked
        ? current + 1
        : Math.max(0, current - 1)
    );

    try {
      setLoading(true);

      const res = await fetch(
        `/api/comments/${commentId}/like`,
        {
          method: nextLiked
            ? 'POST'
            : 'DELETE',

          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!data.success) {
        setIsLiked(previousLiked);
        setCount(previousCount);

        toast.error(data.message);

        return;
      }

      setIsLiked(data.data.liked);

      setCount(data.data.likes);

      onUpdate?.({
        liked: data.data.liked,
        likes: data.data.likes,
      });

    } catch (error) {
      console.error(error);

      setIsLiked(previousLiked);

      setCount(previousCount);

      toast.error(
        'Unable to update like'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={loading}
      className={`${styles.actionButton} ${
        styles.likeButton
      } ${
        isLiked ? styles.liked : ''
      }`}
    >
      {loading ? (
        <Loader2
          size={15}
          className="animate-spin"
        />
      ) : (
        <Heart
          size={15}
          fill={
            isLiked
              ? 'currentColor'
              : 'none'
          }
        />
      )}

      <span>
        {count}
      </span>
    </button>
  );
}