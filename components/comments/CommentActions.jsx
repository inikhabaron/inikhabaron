'use client';

import {
  MessageCircle,
  Pencil,
  Trash2,
} from 'lucide-react';

import CommentLikeButton from './CommentLikeButton';
import CommentReportButton from './CommentReportButton';

import styles from './CommentActions.module.css';

export default function CommentActions({
  comment,

  currentUser,

  onRequireLogin,

  onReply,

  // Set when the story's comments are closed: no new replies.
  replyDisabled = false,

  replyCount = 0,

  onEdit,

  onDelete,

  replying = false,

  editing = false,

  onLikeUpdate,

  onReportUpdate,
}) {
  const isOwner =
    Boolean(currentUser?.id) &&
    Boolean(comment.userId) &&
    currentUser.id === comment.userId;

  const canEdit =
    comment.canEdit ||
    isOwner;

  const canDelete =
    comment.canDelete ||
    isOwner;

  return (
    <div className={styles.actions}>
      <CommentLikeButton
        commentId={comment._id}
        likes={comment.likes}
        liked={comment.isLiked}
        user={currentUser}
        onRequireLogin={onRequireLogin}
        onUpdate={onLikeUpdate}
      />

      {!replyDisabled && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={onReply}
        >
          <MessageCircle size={15} />

          <span>
              Reply

              {replyCount > 0 &&
              ` (${replyCount})`}
          </span>
        </button>
      )}

      <CommentReportButton
        commentId={comment._id}
        reported={comment.isReported}
        user={currentUser}
        onRequireLogin={onRequireLogin}
        onUpdate={onReportUpdate}
      />

      {canEdit && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={() =>
            onEdit?.(comment)
          }
          disabled={editing}
        >
          <Pencil size={15} />

          <span>Edit</span>
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={() =>
            onDelete?.(comment)
          }
        >
          <Trash2 size={15} />

          <span>Delete</span>
        </button>
      )}
    </div>
  );
}