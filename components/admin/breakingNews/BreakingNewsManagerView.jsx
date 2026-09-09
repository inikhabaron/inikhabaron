'use client';

import { AlertCircle, Check, X, Radio, ChevronRight } from 'lucide-react';
import { DS } from '../design-system';
import { PaginationBtn } from '../PaginationBtn';
import { LoadingSpinner } from '../LoadingSpinner';

const TABS = [
  { id: 'suggested', label: 'Suggested' },
  { id: 'active', label: 'Active' },
  { id: 'history', label: 'History' },
];

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch { return '—'; }
}

export function BreakingNewsManagerView({
  activeTab, onTabChange,
  items, loading, page, totalPages, onPageChange,
  activeBreakingItems,
  selectedIds, onToggleSelect, onToggleSelectAll,
  onApprove, onApproveSelected, onUnmark, approving,
}) {
  const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));

  return (
    <div style={{ padding: 24 }}>
      {activeBreakingItems.length > 0 && (
        <div style={{ ...DS.card, marginBottom: 20, borderColor: '#fecaca', background: '#fef2f2', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Radio size={15} color="#dc2626" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>
              Currently Active Breaking News ({activeBreakingItems.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activeBreakingItems.slice(0, 5).map((item) => (
              <span key={item.id} style={{ fontSize: 13, color: '#7f1d1d' }}>• {item.title}</span>
            ))}
            {activeBreakingItems.length > 5 && (
              <span style={{ fontSize: 12, color: '#991b1b' }}>+{activeBreakingItems.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      <div style={DS.card}>
        <div style={{ padding: '18px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} color="#dc2626" />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Breaking News Manager</span>
          </div>
          {activeTab === 'suggested' && selectedIds.length > 0 && (
            <button style={DS.btn('primary')} onClick={onApproveSelected} disabled={approving}>
              <Check size={14} />Approve Selected ({selectedIds.length})
            </button>
          )}
        </div>

        <div style={{ padding: '12px 22px 0', display: 'flex', gap: 2 }}>
          {TABS.map((t) => (
            <button key={t.id} style={DS.tab(activeTab === t.id)} onClick={() => onTabChange(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  {activeTab === 'suggested' && (
                    <th style={{ padding: '11px 16px', width: 40 }}>
                      <div
                        style={{ width: 16, height: 16, border: '1.5px solid #d1d5db', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: allSelected ? '#2563eb' : '#fff' }}
                        onClick={onToggleSelectAll}
                      >
                        {allSelected && <Check size={10} color="#fff" />}
                      </div>
                    </th>
                  )}
                  {['Title', 'Author', 'Status', 'Suggested At', 'Approved At', ''].map((h, i) => (
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
                    {activeTab === 'suggested' && (
                      <td style={{ padding: '12px 16px' }}>
                        <div
                          style={{ width: 16, height: 16, border: '1.5px solid #d1d5db', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedIds.includes(item.id) ? '#2563eb' : '#fff' }}
                          onClick={() => onToggleSelect(item.id)}
                        >
                          {selectedIds.includes(item.id) && <Check size={10} color="#fff" />}
                        </div>
                      </td>
                    )}
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#111827', fontWeight: 600, maxWidth: 320 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{item.authorName || item.authorId || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {item.isBreaking ? (
                        <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Active</span>
                      ) : item.breakingSuggested ? (
                        <span style={{ background: '#ffedd5', color: '#9a3412', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Suggested</span>
                      ) : (
                        <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Unmarked</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af' }}>{formatDate(item.updatedAt)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af' }}>{formatDate(item.breakingAt)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {activeTab === 'suggested' && (
                        <button style={{ ...DS.btn('primary'), padding: '6px 12px', fontSize: 12 }} onClick={() => onApprove(item.id)} disabled={approving}>
                          <Check size={13} />Approve
                        </button>
                      )}
                      {activeTab === 'active' && (
                        <button style={{ ...DS.btn('outline'), padding: '6px 12px', fontSize: 12 }} onClick={() => onUnmark(item.id)} disabled={approving}>
                          <X size={13} />Unmark
                        </button>
                      )}
                      {activeTab === 'history' && (
                        <a href={`/news/${item.id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
                          View<ChevronRight size={12} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                      {activeTab === 'suggested' && 'No pending breaking-news suggestions'}
                      {activeTab === 'active' && 'No breaking news currently active'}
                      {activeTab === 'history' && 'No breaking-news history yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

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
