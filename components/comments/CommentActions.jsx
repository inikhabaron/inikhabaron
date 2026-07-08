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

  replyCount = 0,

  onEdit,

  onDelete,

  replying = false,

  editing = false,

  onLikeUpdate,

  onReportUpdate,
}) {
  const canEdit =
    comment.canEdit ||
    currentUser?.id === comment.userId;

  const canDelete =
    comment.canDelete ||
    currentUser?.id === comment.userId;

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