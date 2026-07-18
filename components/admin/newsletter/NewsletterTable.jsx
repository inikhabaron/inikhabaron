'use client';

import { NewsletterRow } from './NewsletterRow';

export function NewsletterTable({ subscribers = [], loading = false, onToggleStatus, onDelete }) {
  if (loading) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center' }}>
        Loading subscribers...
      </div>
    );
  }

  if (!subscribers.length) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280' }}>
        No subscribers found.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#F9FAFB' }}>
          <tr>
            <th style={headerStyle}>Email</th>
            <th style={headerStyle}>Status</th>
            <th style={headerStyle}>Language</th>
            <th style={headerStyle}>Categories</th>
            <th style={headerStyle}>Source</th>
            <th style={headerStyle}>Subscribed</th>
            <th style={headerStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {subscribers.map((subscriber) => (
            <NewsletterRow
              key={subscriber._id}
              subscriber={subscriber}
              onToggleStatus={onToggleStatus}
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
