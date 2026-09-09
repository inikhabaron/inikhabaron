'use client';

import { ChevronRight, MessageSquareText } from 'lucide-react';
import { DS } from './design-system';
import { PaginationBtn } from './PaginationBtn';
import { LoadingSpinner } from './LoadingSpinner';

// Basic aggregate dashboard per the Phase 1 scope: one row per article with
// helpful/not-helpful/total counts, newest activity first. No analytics
// charts, no sentiment, no filtering beyond pagination — see
// docs/mvp3-phase1-architecture.md.
export function FeedbackView({ items, loading, page, totalPages, onPageChange, onViewDetail }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: 24 }}>
      <div style={DS.card}>
        <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Feedback</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {['Article', 'Helpful', 'Not Helpful', 'Feedback Count', ''].map((h, i) => (
                  <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.articleId} style={{ borderBottom: '1px solid #f3f4f6' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#111827', maxWidth: 340 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.articleTitle || <em style={{ color: '#9ca3af' }}>Article no longer available</em>}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>👍 {item.helpfulCount}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>👎 {item.notHelpfulCount}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{item.feedbackCount}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      style={{ ...DS.btn('outline'), padding: '6px 12px', fontSize: 12 }}
                      onClick={() => onViewDetail(item.articleId)}
                    >
                      <MessageSquareText size={13} />View
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    No feedback yet
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
