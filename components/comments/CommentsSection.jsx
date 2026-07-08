'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import CommentForm from './CommentForm';
import CommentList from './CommentList';

import styles from './Comments.module.css';

export default function CommentsSection({
  articleId,
  user,
  onRequireLogin,
}) {
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [page, setPage] = useState(1);

  const [limit] = useState(20);

  const [hasNext, setHasNext] =
    useState(false);

  const [total, setTotal] = useState(0);

  const loadComments = useCallback(
    async (
      pageNumber = 1,
      append = false
    ) => {
      try {
        if (!append) {
          setLoading(true);
        }

        const res = await fetch(
          `/api/news/${articleId}/comments?page=${pageNumber}&limit=${limit}`,
          {
            cache: 'no-store',
          }
        );

        const data = await res.json();

        if (!data.success) {
          toast.error(
            data.message ||
              'Unable to load comments'
          );
          return;
        }

        const payload = data.data;

        setComments((previous) =>
          append
            ? [...previous, ...payload.items]
            : payload.items
        );

        setPage(payload.page);

        setTotal(payload.total);

        setHasNext(payload.hasNext);
      } catch (error) {
        console.error(error);

        toast.error(
          'Unable to load comments'
        );
      } finally {
        setLoading(false);
      }
    },
    [articleId, limit]
  );

  useEffect(() => {
    if (!articleId) return;

    loadComments();
  }, [articleId, loadComments]);

  async function handleCreateComment(
    content
  ) {
    if (!user) {
      onRequireLogin?.();
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(
        `/api/news/${articleId}/comments`,
        {
          method: 'POST',

          credentials: 'include',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            content,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message);

        return {
          success: false,
        };
      }

      toast.success(data.message);

      await loadComments();

      return {
        success: true,
      };
    } catch (error) {
      console.error(error);

      toast.error(
        'Unable to submit comment'
      );

      return {
        success: false,
      };
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoadMore() {
    if (!hasNext) return;

    await loadComments(
      page + 1,
      true
    );
  }

  return (
    <section
      className={
        styles.commentsSection
      }
    >
      <div
        className={
          styles.commentsHeader
        }
      >
        <div
          className={
            styles.commentsTitle
          }
        >
          <MessageCircle size={22} />

          <h2>
            Comments
          </h2>

          <span
            className={
              styles.commentCount
            }
          >
            {total}
          </span>
        </div>
      </div>

      <CommentForm
        user={user}
        disabled={submitting}
        onSubmit={
          handleCreateComment
        }
        onRequireLogin={
          onRequireLogin
        }
      />

      {loading ? (
        <div
          className={
            styles.loading
          }
        >
          <Loader2
            size={28}
            className="animate-spin"
          />

          <span>
            Loading comments...
          </span>
        </div>
      ) : comments.length ===
        0 ? (
        <div
          className={
            styles.emptyState
          }
        >
          <MessageCircle
            size={48}
          />

          <h3>
            No comments yet
          </h3>

          <p>
            Be the first to
            start the
            conversation.
          </p>
        </div>
      ) : (
        <>
          <CommentList
            comments={
              comments
            }
            user={user}
            onRequireLogin={
              onRequireLogin
            }
            refreshComments={
              loadComments
            }
          />

          {hasNext && (
            <div
              className={
                styles.loadMoreContainer
              }
            >
              <button
                className={
                  styles.loadMoreButton
                }
                onClick={
                  handleLoadMore
                }
              >
                Load More
                Comments
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}