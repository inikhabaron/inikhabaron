'use client';

import CommentItem from './CommentItem';

import styles from './Comments.module.css';

export default function CommentList({
  comments = [],
  user,
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