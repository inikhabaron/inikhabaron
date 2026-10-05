'use client';

import {
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  Trash2,
  RotateCcw,
  Eraser,
} from 'lucide-react';

import { getReviewAge, isUnreviewed } from '@/lib/comments/reviewSla';

function GuestBadge() {
  return (
    <span
      style={{
        marginLeft: 8,
        background: '#EEF2FF',
        color: '#4338CA',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      Guest
    </span>
  );
}

// How long an unreviewed comment has been waiting. Past the review window it
// turns into a red "Over 24h" flag; the exact age stays visible underneath.
function PendingAge({ createdAt }) {
  const age = getReviewAge(createdAt);

  if (age.overdue) {
    return (
      <div style={{ marginTop: 6 }}>
        <span
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '3px 9px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Over 24h
        </span>

        <div style={{ color: '#991B1B', fontSize: 12, marginTop: 4 }}>
          Submitted {age.label}
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: '#92400E', fontSize: 12, marginTop: 6 }}>
      Submitted {age.label}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: {
      bg: '#FEF3C7',
      text: '#92400E',
    },

    approved: {
      bg: '#DCFCE7',
      text: '#166534',
    },

    rejected: {
      bg: '#FEE2E2',
      text: '#991B1B',
    },

    hidden: {
      bg: '#E5E7EB',
      text: '#374151',
    },
  };

  const style =
    colors[status] ||
    {
      bg: '#EFF6FF',
      text: '#1E40AF',
    };

  return (
    <span
      style={{
        background: style.bg,
        color: style.text,
        padding: '5px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

export function CommentRow({
  comment,
  onApprove,
  onReject,
  onHide,
  onDelete,
  onPreview,
  onRestore,
  onPurge,
  canPurge = false,
  onToggleArticleComments,
}) {
  const deleted = comment.isDeleted === true;
  const commentsClosed = comment.article?.commentsClosed === true;

  return (
    <tr
      style={{
        borderBottom:
          '1px solid #F3F4F6',
      }}
    >
      {/* User */}

      <td
        style={{
          padding: 18,
          verticalAlign: 'top',
          width: 170,
        }}
      >
        <div
          style={{
            fontWeight: 600,
          }}
        >
          {comment.source === 'guest'
            ? comment.guest?.name || 'Guest'
            : comment.user?.name ||
              'Unknown User'}

          {comment.source === 'guest' && <GuestBadge />}
        </div>

        <div
          style={{
            color: '#6B7280',
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {comment.source === 'guest'
            ? `Not logged in${
                comment.guest?.ipRef
                  ? ` · ref ${comment.guest.ipRef}`
                  : ''
              }`
            : comment.user?.email || ''}
        </div>
      </td>

      {/* Comment */}

      <td
        style={{
          padding: 18,
          verticalAlign: 'top',
          maxWidth: 420,
        }}
      >
        <div
          style={{
            lineHeight: 1.6,
            fontSize: 14,
            color: '#111827',
          }}
        >
          {comment.content}
        </div>
      </td>

      {/* Article */}

      <td
        style={{
          padding: 18,
          verticalAlign: 'top',
          width: 220,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {comment.article?.title ||
            'Unknown'}
        </div>

        {comment.article && (
          <div
            style={{
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {commentsClosed && (
              <span
                style={{
                  background: '#FEE2E2',
                  color: '#991B1B',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Comments closed
              </span>
            )}

            {onToggleArticleComments && (
              <button
                onClick={() =>
                  onToggleArticleComments(
                    comment.articleId,
                    !commentsClosed
                  )
                }
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#2563EB',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {commentsClosed
                  ? 'Reopen comments'
                  : 'Close comments on this article'}
              </button>
            )}
          </div>
        )}
      </td>

      {/* Status */}

      <td
        style={{
          padding: 18,
        }}
      >
        {deleted ? (
          <span
            style={{
              background: '#F3F4F6',
              color: '#4B5563',
              padding: '5px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Deleted
          </span>
        ) : (
          <StatusBadge
            status={comment.status}
          />
        )}

        {deleted && comment.deletedByName && (
          <div
            style={{
              marginTop: 6,
              color: '#6B7280',
              fontSize: 11,
            }}
          >
            by {comment.deletedByName}
          </div>
        )}

        {!deleted &&
          comment.status === 'approved' &&
          isUnreviewed(comment) && (
            <div
              style={{
                marginTop: 6,
                color: '#92400E',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Live · unreviewed
            </div>
          )}
      </td>

      {/* Reports */}

      <td
        style={{
          padding: 18,
          fontWeight: 600,
        }}
      >
        {comment.reports}
      </td>

      {/* Likes */}

      <td
        style={{
          padding: 18,
        }}
      >
        {comment.likes}
      </td>

      {/* Date */}

      <td
        style={{
          padding: 18,
          whiteSpace: 'nowrap',
        }}
      >
        <div>
          {new Date(
            comment.createdAt
          ).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>

        {!deleted && isUnreviewed(comment) ? (
          <PendingAge
            createdAt={comment.createdAt}
          />
        ) : (
          comment.reviewedAt && (
            <div
              style={{
                color: '#6B7280',
                fontSize: 12,
                marginTop: 6,
              }}
            >
              Reviewed{' '}
              {getReviewAge(comment.reviewedAt).label}
            </div>
          )
        )}
      </td>

      {/* Actions */}

      <td
        style={{
          padding: 18,
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
          }}
        >
          {onPreview && (
            <button
              title="View details"
              onClick={() =>
                onPreview(comment)
              }
              style={buttonStyle}
            >
              <Eye
                size={18}
                color="#2563EB"
              />
            </button>
          )}

          {deleted ? (
            <>
              {comment.deletedBy && onRestore && (
                <button
                  title="Restore"
                  onClick={() =>
                    onRestore(comment)
                  }
                  style={buttonStyle}
                >
                  <RotateCcw
                    size={18}
                    color="#16A34A"
                  />
                </button>
              )}

              {canPurge && onPurge && (
                <button
                  title="Delete forever"
                  onClick={() =>
                    onPurge(comment)
                  }
                  style={buttonStyle}
                >
                  <Eraser
                    size={18}
                    color="#DC2626"
                  />
                </button>
              )}
            </>
          ) : (
            <>
            <button
              title={
                comment.status === 'approved'
                  ? 'Mark reviewed (keep published)'
                  : 'Approve'
              }
              onClick={() =>
                onApprove(comment)
              }
              style={buttonStyle}
            >
              <CheckCircle2
                size={18}
                color="#16A34A"
              />
            </button>

            <button
              title="Reject"
              onClick={() =>
                onReject(comment)
              }
              style={buttonStyle}
            >
              <XCircle
                size={18}
                color="#DC2626"
              />
            </button>

            <button
              title="Hide"
              onClick={() =>
                onHide(comment)
              }
              style={buttonStyle}
            >
              <EyeOff
                size={18}
                color="#D97706"
              />
            </button>

            <button
              title="Delete (can be restored)"
              onClick={() =>
                onDelete(comment)
              }
              style={buttonStyle}
            >
              <Trash2
                size={18}
                color="#DC2626"
              />
            </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

const buttonStyle = {
  width: 34,
  height: 34,

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  background: '#F9FAFB',

  border: '1px solid #E5E7EB',

  borderRadius: 8,

  cursor: 'pointer',

  transition: 'all .2s',
};