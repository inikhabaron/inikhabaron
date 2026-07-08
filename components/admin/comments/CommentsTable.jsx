'use client';

import { CommentRow } from './CommentRow';

export function CommentsTable({
  comments = [],
  loading = false,
  onApprove,
  onReject,
  onHide,
  onDelete,
}) {
  if (loading) {
    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
        }}
      >
        Loading comments...
      </div>
    );
  }

  if (!comments.length) {
    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 60,
          textAlign: 'center',
          color: '#6B7280',
        }}
      >
        No comments found.
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead
          style={{
            background: '#F9FAFB',
          }}
        >
          <tr>
            <th style={headerStyle}>User</th>
            <th style={headerStyle}>Comment</th>
            <th style={headerStyle}>Article</th>
            <th style={headerStyle}>Status</th>
            <th style={headerStyle}>Reports</th>
            <th style={headerStyle}>Likes</th>
            <th style={headerStyle}>Created</th>
            <th style={headerStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {comments.map((comment) => (
            <CommentRow
              key={comment._id}
              comment={comment}
              onApprove={onApprove}
              onReject={onReject}
              onHide={onHide}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const headerStyle = {
  textAlign: 'left',
  padding: '14px 18px',
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
  borderBottom: '1px solid #E5E7EB',
};