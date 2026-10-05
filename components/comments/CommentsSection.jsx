'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { DarkCtx } from '@/lib/news-contexts';

import styles from './Comments.module.css';

export default function CommentsSection({
  articleId,
  user,
  onRequireLogin,
}) {
  const dark = useContext(DarkCtx);
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [page, setPage] = useState(1);

  const [limit] = useState(20);

  const [hasNext, setHasNext] =
    useState(false);

  const [total, setTotal] = useState(0);

  // Whether an admin has enabled commenting without login. Defaults to off, so
  // the form never offers guest posting before the server has said so.
  const [guestAllowed, setGuestAllowed] =
    useState(false);

  // Server-signed "form shown at" stamp a guest post must echo back; refreshed
  // with every load, so each new comment starts a fresh minimum-fill clock.
  const [formToken, setFormToken] =
    useState(null);

  // Turnstile widget config ({ provider, siteKey }) when CAPTCHA is enabled.
  const [captcha, setCaptcha] =
    useState(null);

  // An editor closed this story's thread: existing comments stay, new
  // comments and replies are off.
  const [commentsClosed, setCommentsClosed] =
    useState(false);

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

        setGuestAllowed(
          payload.guestCommentsAllowed === true
        );

        setFormToken(payload.formToken ?? null);

        setCaptcha(payload.captcha ?? null);

        setCommentsClosed(
          payload.commentsClosed === true
        );
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
    content,
    guest = null
  ) {
    if (!user && !(guestAllowed && guest)) {
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

          // The guest block is only sent by a logged-out visitor; its presence
          // is what tells the API this is a guest submission.
          body: JSON.stringify(
            user ? { content } : { content, guest }
          ),
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
        `${styles.commentsSection} ${dark ? 'dark' : ''}`
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

      {commentsClosed ? (
        <div
          className={
            styles.closedNotice
          }
        >
          Comments are closed for this
          story.
        </div>
      ) : (
        <CommentForm
          user={user}
          guestAllowed={guestAllowed}
          formToken={formToken}
          captcha={captcha}
          disabled={submitting}
          onSubmit={
            handleCreateComment
          }
          onRequireLogin={
            onRequireLogin
          }
        />
      )}

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
            guestAllowed={guestAllowed}
            formToken={formToken}
            captcha={captcha}
            commentsClosed={commentsClosed}
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