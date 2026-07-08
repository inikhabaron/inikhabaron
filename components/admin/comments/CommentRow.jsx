'use client';

import {
  CheckCircle2,
  XCircle,
  EyeOff,
  Trash2,
} from 'lucide-react';

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
}) {
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
          {comment.user?.name ||
            'Unknown User'}
        </div>

        <div
          style={{
            color: '#6B7280',
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {comment.user?.email || ''}
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
      </td>

      {/* Status */}

      <td
        style={{
          padding: 18,
        }}
      >
        <StatusBadge
          status={comment.status}
        />
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
        {new Date(
          comment.createdAt
        ).toLocaleDateString()}
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
          <button
            title="Approve"
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
            title="Delete"
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