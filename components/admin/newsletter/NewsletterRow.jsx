'use client';

import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';

function StatusBadge({ status }) {
  const colors = status === 'active'
    ? { bg: '#DCFCE7', text: '#166534' }
    : { bg: '#E5E7EB', text: '#374151' };

  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
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

export function NewsletterRow({ subscriber, onToggleStatus, onDelete }) {
  const isActive = subscriber.status === 'active';

  return (
    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
      <td style={{ padding: 18, verticalAlign: 'top' }}>
        <div style={{ fontWeight: 600 }}>{subscriber.email}</div>
        {subscriber.userId ? (
          <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>Registered user</div>
        ) : null}
      </td>

      <td style={{ padding: 18, verticalAlign: 'top' }}>
        <StatusBadge status={subscriber.status} />
      </td>

      <td style={{ padding: 18, verticalAlign: 'top', textTransform: 'uppercase', fontSize: 13 }}>
        {subscriber.language || '—'}
      </td>

      <td style={{ padding: 18, verticalAlign: 'top', fontSize: 13, color: '#374151' }}>
        {Array.isArray(subscriber.categories) && subscriber.categories.length
          ? subscriber.categories.join(', ')
          : '—'}
      </td>

      <td style={{ padding: 18, verticalAlign: 'top', fontSize: 13, color: '#6B7280', textTransform: 'capitalize' }}>
        {subscriber.source || '—'}
      </td>

      <td style={{ padding: 18, whiteSpace: 'nowrap' }}>
        {subscriber.subscribedAt ? new Date(subscriber.subscribedAt).toLocaleDateString() : '—'}
      </td>

      <td style={{ padding: 18, whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            title={isActive ? 'Deactivate' : 'Reactivate'}
            onClick={() => onToggleStatus(subscriber)}
            style={buttonStyle}
          >
            {isActive
              ? <XCircle size={18} color="#DC2626" />
              : <CheckCircle2 size={18} color="#16A34A" />}
          </button>

          <button
            title="Delete"
            onClick={() => onDelete(subscriber)}
            style={buttonStyle}
          >
            <Trash2 size={18} color="#DC2626" />
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
