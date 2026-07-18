'use client';

import { History } from 'lucide-react';

import { DS } from '@/components/admin/design-system';

function StatusBadge({ status }) {
  const colors = status === 'sent'
    ? { bg: '#DCFCE7', text: '#166534' }
    : { bg: '#FEE2E2', text: '#991B1B' };

  return (
    <span style={{
      background: colors.bg, color: colors.text, padding: '3px 9px',
      borderRadius: 999, fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}

export function NewsletterCampaignHistory({ campaigns = [] }) {
  return (
    <div style={{ ...DS.card, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <History size={18} color="#2563eb" />
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
          Send History
        </h2>
      </div>

      {!campaigns.length ? (
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>No newsletters sent yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Subject', 'Type', 'Sent At', 'Sent', 'Failed', 'Skipped', 'Status'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#111827', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.subject}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', textTransform: 'capitalize' }}>{c.type}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {c.finishedAt ? new Date(c.finishedAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#16A34A' }}>{c.sent}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: c.failed > 0 ? '#DC2626' : '#6B7280' }}>{c.failed}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280' }}>{c.skipped}</td>
                  <td style={{ padding: '10px 12px' }}><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
