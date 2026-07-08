'use client';

import Image from 'next/image';

import {
  X,
  User,
  Mail,
  ShieldCheck,
  ShieldX,
  Newspaper,
  CalendarDays,
  FolderOpen,
} from 'lucide-react';

import styles from './CommentDetailsDialog.module.css';

export function CommentDetailsDialog({
  open,
  comment,
  loading = false,
  onClose,
  onApprove,
  onReject,
  onHide,
  onDelete,
}) {
  if (!open || !comment) {
    return null;
  }

  const user =
    comment.user || {};

  const article =
    comment.article || {};

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* ===========================
            Header
        ============================ */}

        <div className={styles.header}>
          <div>
            <h2
              className={styles.title}
            >
              Comment Details
            </h2>

            <p
              className={
                styles.subtitle
              }
            >
              Review reader
              activity and
              moderation
              history.
            </p>
          </div>

          <button
            className={
              styles.closeButton
            }
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* ===========================
            Content
        ============================ */}

        <div className={styles.body}>

          {/* ======================
              User Card
          ======================= */}

          <section
            className={styles.card}
          >
            <div
              className={
                styles.cardHeader
              }
            >
              <User size={18} />

              <span>
                User
                Information
              </span>
            </div>

            <div
              className={
                styles.userSection
              }
            >
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={70}
                  height={70}
                  className={
                    styles.avatar
                  }
                />
              ) : (
                <div
                  className={
                    styles.avatarPlaceholder
                  }
                >
                  {user.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    'U'}
                </div>
              )}

              <div
                className={
                  styles.userInfo
                }
              >
                <h3>
                  {user.name ||
                    'Unknown User'}
                </h3>

                <div
                  className={
                    styles.infoRow
                  }
                >
                  <Mail
                    size={15}
                  />

                  <span>
                    {user.email ||
                      'No email'}
                  </span>
                </div>

                <div
                  className={
                    styles.infoRow
                  }
                >
                  {user.isVerified ? (
                    <ShieldCheck
                      size={15}
                      color="#16A34A"
                    />
                  ) : (
                    <ShieldX
                      size={15}
                      color="#DC2626"
                    />
                  )}

                  <span>
                    {user.role ||
                      'Reader'}

                    {' • '}

                    {user.isVerified
                      ? 'Verified'
                      : 'Not Verified'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ======================
              Article Card
          ======================= */}

          <section
            className={styles.card}
          >
            <div
              className={
                styles.cardHeader
              }
            >
              <Newspaper
                size={18}
              />

              <span>
                Article
              </span>
            </div>

            <div
              className={
                styles.articleInfo
              }
            >
              <h3>
                {article.title ||
                  'Unknown Article'}
              </h3>

              <div
                className={
                  styles.infoRow
                }
              >
                <FolderOpen
                  size={15}
                />

                <span>
                  {article.category ||
                    '-'}
                </span>
              </div>

              <div
                className={
                  styles.infoRow
                }
              >
                <CalendarDays
                  size={15}
                />

                <span>
                  {article.publishedAt
                    ? new Date(
                        article.publishedAt
                      ).toLocaleString()
                    : '-'}
                </span>
              </div>
            </div>
          </section>

          {/* ======================
              Comment
          ====================== */}

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Newspaper size={18} />
              <span>Comment</span>
            </div>

            <div className={styles.commentBody}>
              <div className={styles.commentStatusRow}>

                <span
                  className={`${styles.statusBadge} ${
                    styles[comment.status || 'pending']
                  }`}
                >
                  {(comment.status || 'pending')
                    .replace('_', ' ')
                    .toUpperCase()}
                </span>

                {comment.edited && (
                  <span className={styles.editedBadge}>
                    Edited
                  </span>
                )}

              </div>

              <p className={styles.commentText}>
                {comment.content}
              </p>

              <div className={styles.commentMetaGrid}>

                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>
                    Likes
                  </span>

                  <span className={styles.metaValue}>
                    {comment.likes || 0}
                  </span>
                </div>

                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>
                    Replies
                  </span>

                  <span className={styles.metaValue}>
                    {comment.replyCount || 0}
                  </span>
                </div>

                <div className={styles.metaCard}>
                  <span className={styles.metaLabel}>
                    Reports
                  </span>

                  <span className={styles.metaValue}>
                    {comment.reports || 0}
                  </span>
                </div>

              </div>

              <div className={styles.dateGrid}>

                <div className={styles.infoRow}>
                  <CalendarDays size={15} />

                  <span>
                    Created

                    {' • '}

                    {comment.createdAt
                      ? new Date(
                          comment.createdAt
                        ).toLocaleString()
                      : '-'}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <CalendarDays size={15} />

                  <span>
                    Updated

                    {' • '}

                    {comment.updatedAt
                      ? new Date(
                          comment.updatedAt
                        ).toLocaleString()
                      : '-'}
                  </span>
                </div>

              </div>
            </div>
          </section>

          {/* ======================
              Reports
          ====================== */}

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <ShieldX size={18} />

              <span>
                Reports
              </span>
            </div>

            <div className={styles.reportSection}>

              {comment.reportDetails?.length ? (

                comment.reportDetails.map((report) => (

                  <div
                    key={report._id}
                    className={styles.reportItem}
                  >
                    <div className={styles.reportHeader}>

                      <strong>
                        {report.reason}
                      </strong>

                      <span>
                        {report.createdAt
                          ? new Date(
                              report.createdAt
                            ).toLocaleString()
                          : '-'}
                      </span>

                    </div>

                    <div className={styles.reportReporter}>
                      Reported by

                      {' '}

                      {report.userName || 'Unknown'}
                    </div>

                    {report.description && (

                      <p className={styles.reportDescription}>
                        {report.description}
                      </p>

                    )}

                  </div>

                ))

              ) : (

                <div className={styles.emptyState}>

                  No reports found.

                </div>

              )}

            </div>
          </section>

          {/* ======================
              Moderation History
          ====================== */}

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <ShieldCheck size={18} />

              <span>
                Moderation History
              </span>
            </div>

            <div className={styles.historySection}>

              {comment.moderationHistory?.length ? (

                comment.moderationHistory.map((entry, index) => (

                  <div
                    key={index}
                    className={styles.timelineItem}
                  >

                    <div className={styles.timelineDot} />

                    <div className={styles.timelineContent}>

                      <div className={styles.timelineHeader}>

                        <strong>

                          {entry.action
                            ?.replace('_', ' ')
                            ?.toUpperCase()}

                        </strong>

                        <span>

                          {entry.at
                            ? new Date(
                                entry.at
                              ).toLocaleString()
                            : '-'}

                        </span>

                      </div>

                      <div className={styles.timelineBy}>

                        By

                        {' '}

                        {entry.byName}

                      </div>

                      {entry.reason && (

                        <div
                          className={styles.timelineReason}
                        >
                          {entry.reason}
                        </div>

                      )}

                    </div>

                  </div>

                ))

              ) : (

                <div className={styles.emptyState}>

                  No moderation actions yet.

                </div>

              )}

            </div>
          </section>

          {/* ======================
              Footer
          ====================== */}

          <div className={styles.footer}>

            <div className={styles.footerLeft}>

              <button
                className={`${styles.actionButton} ${styles.approveButton}`}
                disabled={loading}
                onClick={() =>
                  onApprove?.(comment)
                }
              >
                Approve
              </button>

              <button
                className={`${styles.actionButton} ${styles.rejectButton}`}
                disabled={loading}
                onClick={() =>
                  onReject?.(comment)
                }
              >
                Reject
              </button>

              <button
                className={`${styles.actionButton} ${styles.hideButton}`}
                disabled={loading}
                onClick={() =>
                  onHide?.(comment)
                }
              >
                Hide
              </button>

              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                disabled={loading}
                onClick={() => {
                  if (
                    confirm(
                      'Delete this comment permanently?'
                    )
                  ) {
                    onDelete?.(comment);
                  }
                }}
              >
                Delete
              </button>

            </div>

            <div className={styles.footerRight}>

              <button
                className={styles.closeFooterButton}
                onClick={onClose}
              >
                Close
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}