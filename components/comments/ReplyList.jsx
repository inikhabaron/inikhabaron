'use client';

import { User } from 'lucide-react';

import styles from './Comments.module.css';

export default function ReplyList({
  replies = [],
}) {
  if (!replies.length) {
    return null;
  }

  return (
    <div className={styles.replyContainer}>
      <div className={styles.replyList}>
        {replies.map((reply) => {
          const name =
            reply.user?.name ||
            'Unknown User';

          const avatar =
            reply.user?.avatar;

          return (
            <div
              key={reply._id}
              className={styles.replyCard}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className={styles.avatar}
                />
              ) : (
                <div
                  className={
                    styles.avatarFallback
                  }
                >
                  {name?.charAt(0)?.toUpperCase() ||
                    <User size={18} />}
                </div>
              )}

              <div
                className={
                  styles.replyBody
                }
              >
                <div
                  className={
                    styles.replyHeader
                  }
                >
                  <div
                    className={
                      styles.replyUser
                    }
                  >
                    <strong>
                      {name}
                    </strong>

                    <span
                      className={
                        styles.commentDate
                      }
                    >
                      {new Date(
                        reply.createdAt
                      ).toLocaleString()}
                    </span>

                    {reply.edited && (
                      <span
                        className={
                          styles.editedBadge
                        }
                      >
                        Edited
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={
                    reply.isDeleted
                      ? styles.deletedComment
                      : styles.replyContent
                  }
                >
                  {reply.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}