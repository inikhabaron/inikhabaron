'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, Pencil, Trash2, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import ReplyList from './ReplyList';
import ReplyForm from './ReplyForm';

import CommentActions from './CommentActions';

import styles from './Comments.module.css';
import actionStyles from './CommentActions.module.css';

export default function CommentItem({
  comment,

  currentUser,

  onRequireLogin,

  refreshComments,
}) {
  const [editing, setEditing] = useState(false);

  const [content, setContent] = useState(comment.content);

  const [saving, setSaving] = useState(false);

  const [replies, setReplies] = useState([]);

  const [loadingReplies, setLoadingReplies] = useState(false);

  const [showReplies, setShowReplies] = useState(false);

  const [replying, setReplying] = useState(false);

  const [replySubmitting, setReplySubmitting] = useState(false);

  const [repliesLoaded, setRepliesLoaded] = useState(false);

  const canEdit =
    comment.canEdit ||
    currentUser?.id === comment.userId;

  const canDelete =
    comment.canDelete ||
    currentUser?.id === comment.userId;

  async function saveEdit() {
    const text = content.trim();

    if (!text) {
      toast.error(
        'Comment cannot be empty'
      );
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        `/api/comments/${comment._id}`,
        {
          method: 'PATCH',

          credentials: 'include',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            content: text,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message);

        return;
      }

      toast.success(data.message);

      setEditing(false);

      await refreshComments?.();
    } catch (err) {
      console.error(err);

      toast.error(
        'Unable to update comment'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteComment() {
    if (
      !confirm(
        'Delete this comment?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/comments/${comment._id}`,
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

      toast.success(data.message);

      await refreshComments?.();
    } catch (err) {
      console.error(err);

      toast.error(
        'Unable to delete comment'
      );
    }
  }

  async function loadReplies() {
    if (repliesLoaded) {
        setShowReplies((prev) => !prev);
        return;
    }

    try {
        setLoadingReplies(true);

        const res = await fetch(
        `/api/comments/${comment._id}/replies`,
        {
            cache: 'no-store',
        }
        );

        const data = await res.json();

        if (!data.success) {
        toast.error(data.message);
        return;
        }

        setReplies(data.data.items);

        setRepliesLoaded(true);

        setShowReplies(true);

    } catch (err) {
        console.error(err);

        toast.error(
        'Unable to load replies'
        );
    } finally {
        setLoadingReplies(false);
    }
  }

  async function submitReply(content) {
    try {
        setReplySubmitting(true);

        const res = await fetch(
        `/api/comments/${comment._id}/reply`,
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

        setReplying(false);

        return {
        success: true,
        };

    } catch (err) {
        console.error(err);

        toast.error(
        'Unable to submit reply'
        );

        return {
        success: false,
        };
    } finally {
        setReplySubmitting(false);
    }
  }

  const avatar =
    comment.user?.avatar;

  const name =
    comment.user?.name ||
    'Unknown User';

  return (
    <article
      className={styles.commentCard}
    >
      {avatar ? (
        <Image
          src={avatar}
          alt={name}
          width={48}
          height={48}
          className={styles.avatar}
        />
      ) : (
        <div
          className={
            styles.avatarFallback
          }
        >
          {name
            ?.charAt(0)
            ?.toUpperCase() || (
            <User size={20} />
          )}
        </div>
      )}

      <div
        className={styles.commentBody}
      >
        <div
          className={
            styles.commentHeader
          }
        >
          <div
            className={
              styles.userInfo
            }
          >
            <span
              className={
                styles.userName
              }
            >
              {name}
            </span>

            <span
              className={
                styles.commentDate
              }
            >
              {new Date(
                comment.createdAt
              ).toLocaleString()}
            </span>

            {comment.edited && (
              <span
                className={
                  styles.editedBadge
                }
              >
                Edited
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            {canEdit && (
              <button
                className={
                  actionStyles.actionButton
                }
                onClick={() =>
                  setEditing(true)
                }
              >
                <Pencil
                  size={15}
                />
              </button>
            )}

            {canDelete && (
              <button
                className={
                  actionStyles.actionButton
                }
                onClick={
                  deleteComment
                }
              >
                <Trash2
                  size={15}
                />
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <>
            <textarea
              className={
                styles.commentTextarea
              }
              value={content}
              onChange={(e) =>
                setContent(
                  e.target.value
                )
              }
            />

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: 10,
                marginTop: 10,
              }}
            >
              <button
                className={
                  actionStyles.replyCancel
                }
                onClick={() => {
                  setEditing(
                    false
                  );

                  setContent(
                    comment.content
                  );
                }}
              >
                Cancel
              </button>

              <button
                className={
                  actionStyles.replySubmit
                }
                onClick={
                  saveEdit
                }
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </>
        ) : (
          <div
            className={
              comment.isDeleted
                ? styles.deletedComment
                : styles.commentContent
            }
          >
            {comment.content}
          </div>
        )}

        <CommentActions
            comment={comment}
            currentUser={currentUser}
            onRequireLogin={onRequireLogin}

            replyCount={comment.replyCount}

            onReply={() =>
                setReplying(prev => !prev)
            }

            onEdit={() => setEditing(true)}

            onDelete={deleteComment}
        />

        <div style={{ marginTop: 14, }} >
            <button
                className={actionStyles.actionButton}
                onClick={loadReplies}
            >
                {loadingReplies ? (
                <>
                    <Loader2
                        size={15}
                        className="animate-spin"
                    />

                    Loading...
                </>
                ) : (
                <>
                    <MessageCircle size={15} />

                    {showReplies
                    ? 'Hide Replies'
                    : `View Replies (${comment.replyCount})`}
                </>
                )}
            </button>

            {/* <button
                className={styles.actionButton}
                style={{ marginLeft: 14, }}
                onClick={() => setReplying((prev) => !prev)}
            >
                Reply
            </button> */}

            {replying && (
                <ReplyForm
                    user={currentUser}
                    disabled={replySubmitting}
                    onRequireLogin={ onRequireLogin }
                    onCancel={() => setReplying(false)}
                    onSubmit={submitReply}
                />
            )}

            {showReplies && (
                <ReplyList
                    replies={replies}
                />
            )}
        </div>
      </div>
    </article>
  );
}