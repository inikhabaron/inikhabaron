'use client';

import CommentItem from './CommentItem';

import styles from './Comments.module.css';

export default function CommentList({
  comments = [],
  user,
  guestAllowed = false,
  formToken = null,
  captcha = null,
  commentsClosed = false,
  onRequireLogin,

  refreshComments,

  onEditComment,
  onDeleteComment,
  onReplyComment,

  editingCommentId,
  replyingToCommentId,
}) {
  if (!comments.length) {
    return null;
  }

  return (
    <div className={styles.commentList}>
      {comments.map((comment) => (
        <CommentItem
          key={comment._id}

          comment={comment}

          currentUser={user}

          guestAllowed={guestAllowed}

          formToken={formToken}

          captcha={captcha}

          commentsClosed={commentsClosed}

          onRequireLogin={onRequireLogin}

          refreshComments={refreshComments}

          onEditComment={onEditComment}

          onDeleteComment={onDeleteComment}

          onReplyComment={onReplyComment}

          isEditing={
            editingCommentId === comment._id
          }

          isReplying={
            replyingToCommentId === comment._id
          }
        />
      ))}
    </div>
  );
}