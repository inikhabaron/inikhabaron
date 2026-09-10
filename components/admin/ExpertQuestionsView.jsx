'use client';

import { ChevronRight, MessageCircleQuestion, EyeOff } from 'lucide-react';
import { DS } from './design-system';
import { PaginationBtn } from './PaginationBtn';
import { LoadingSpinner } from './LoadingSpinner';

function truncate(text, max = 90) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// The expert queue: pending questions only — an answered one leaves this
// list the moment submitAnswer() flips its status, so there's no separate
// "answered" tab to maintain here (the public /ask-the-expert page is the
// answered-questions view).
export function ExpertQuestionsView({ items, loading, page, totalPages, onPageChange, onAnswer, onHide }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: 24 }}>
      <div style={DS.card}>
        <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Ask the Expert — Pending Questions</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {['Question', 'Category', 'Submitted', ''].map((h, i) => (
                  <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#111827', maxWidth: 360 }}>
                    {truncate(item.question)}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>{item.category}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td style={{ padding: '12px 14px', display: 'flex', gap: 8 }}>
                    <button style={{ ...DS.btn('outline'), padding: '6px 12px', fontSize: 12 }} onClick={() => onAnswer(item)}>
                      <MessageCircleQuestion size={13} />Answer
                    </button>
                    <button style={{ ...DS.btn('outline'), padding: '6px 12px', fontSize: 12, color: '#dc2626' }} onClick={() => onHide(item)}>
                      <EyeOff size={13} />Hide
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    No pending questions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', gap: 4 }}>
            <PaginationBtn disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} />
            </PaginationBtn>
            <span style={{ padding: '0 10px', fontSize: 13, color: '#6b7280' }}>Page {page} of {totalPages}</span>
            <PaginationBtn disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight size={13} />
            </PaginationBtn>
          </div>
        )}
      </div>
    </div>
  );
}
