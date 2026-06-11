'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit, Trash2, Check, X, Send, AlertCircle,
  Loader2, ChevronRight, CheckCircle, History, TrendingUp, MoreVertical,
} from 'lucide-react';
import { DS } from './design-system';
import { STATUS_LABELS, statusFilterOptionsByRole } from './constants';
import { MenuBtn } from './MenuBtn';
import { PaginationBtn } from './PaginationBtn';

const STATUS_TABS = [
  { id: 'all', label: 'All', filter: 'all' },
  { id: 'published', label: 'Published', filter: 'published' },
  { id: 'pending', label: 'Pending', filter: 'pending_review' },
  { id: 'drafts', label: 'Drafts', filter: 'draft' },
];

export function NewsListView({
  news, currentUser, newsStatusFilter, onStatusFilterChange,
  searchQuery, loading, onEdit, onDelete, onWorkflow, onAddNew, onViewVersionHistory,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openTagsId, setOpenTagsId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const menuRef = useRef(null);
  const tagsRef = useRef(null);
  const perPage = 6;

  useEffect(() => {
    const onMouseDown = (event) => {
      if (openMenuId !== null && menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
      if (openTagsId !== null && tagsRef.current && !tagsRef.current.contains(event.target)) {
        setOpenTagsId(null);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openMenuId, openTagsId]);

  const activeTabId = STATUS_TABS.find(t => t.filter === newsStatusFilter)?.id || 'all';

  const filtered = news.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) { pages.push(i); }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allSelected = paginated.length > 0 && paginated.every(p => selectedIds.includes(p.id));
  const toggleAll = () => setSelectedIds(allSelected ? [] : paginated.map(p => p.id));

  useEffect(() => { setPage(1); }, [newsStatusFilter, searchQuery]);

  return (
    <div style={{ padding: 24 }}>
      <div style={DS.card}>
        <div style={{ padding: '18px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Posts</span>
            <button onClick={onAddNew} style={{ width: 26, height: 26, borderRadius: '50%', background: '#2563eb', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} color="#fff" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {STATUS_TABS.map(t => (
              <button key={t.id} style={DS.tab(activeTabId === t.id)}
                onClick={() => onStatusFilterChange(t.filter)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Status:</span>
          <select value={newsStatusFilter} onChange={e => onStatusFilterChange(e.target.value)} style={{ ...DS.select, minWidth: 160, fontSize: 12 }}>
            {(statusFilterOptionsByRole[currentUser?.role] || statusFilterOptionsByRole.admin).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {searchQuery && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Showing results for "<strong>{searchQuery}</strong>" — {filtered.length} found
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <th style={{ padding: '11px 16px', width: 40 }}>
                    <div style={{ width: 16, height: 16, border: '1.5px solid #d1d5db', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: allSelected ? '#2563eb' : '#fff' }}
                      onClick={toggleAll}>
                      {allSelected && <Check size={10} color="#fff" />}
                    </div>
                  </th>
                  {['Title / Description', 'Author', 'Tags', 'Date', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => {
                  const tagsToShow = [
                    item.category,
                    ...(Array.isArray(item.tags) ? item.tags : []),
                  ].filter(Boolean);
                  const visibleTags = tagsToShow.slice(0, 2);
                  const extra = tagsToShow.length - visibleTags.length;
                  return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ width: 16, height: 16, border: '1.5px solid #d1d5db', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedIds.includes(item.id) ? '#2563eb' : '#fff' }}
                        onClick={() => toggleSelect(item.id)}>
                        {selectedIds.includes(item.id) && <Check size={10} color="#fff" />}
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', maxWidth: 260 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                        {item.isBreaking && <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>BREAKING</span>}
                        {item.isTrending && <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>TRENDING</span>}
                        {item.breakingSuggested && !item.breakingApproved && <span style={{ background: '#ffedd5', color: '#9a3412', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>BREAKING?</span>}
                        {item.trendingSuggested && !item.isTrending && <span style={{ background: '#f3e8ff', color: '#6d28d9', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>TRENDING?</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.excerpt}</div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{item.authorName || '-'}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <div ref={openTagsId === item.id ? tagsRef : null} style={{ display: 'flex', gap: 4, flexWrap: 'wrap', position: 'relative' }}>
                        {visibleTags.map((t, i) => (
                          <span key={`${t}-${i}`} style={DS.tag}>{t}</span>
                        ))}
                        {extra > 0 && (
                          <>
                            <span
                              style={{ ...DS.tag, background: '#e0e7ff', color: '#4338ca', cursor: 'pointer' }}
                              onClick={() => setOpenTagsId(openTagsId === item.id ? null : item.id)}
                            >
                              +{extra} more
                            </span>
                            {openTagsId === item.id && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 8, zIndex: 50, display: 'flex', flexWrap: 'wrap', gap: 4, minWidth: 160 }}>
                                {tagsToShow.slice(2).map((tag, idx) => (
                                  <span key={`${tag}-${idx}`} style={DS.tag}>{tag}</span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={DS.badge(item.status)}>{STATUS_LABELS[item.status] || item.status}</span>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div ref={openMenuId === item.id ? menuRef : null} style={{ position: 'relative' }}>
                        <button style={DS.btn('ghost')} onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}>
                          <MoreVertical size={15} />
                        </button>
                        {openMenuId === item.id && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 190, overflow: 'hidden' }}>
                            <div style={{ padding: '4px 0' }}>
                              {((currentUser?.role === 'admin') ||
                                (currentUser?.role === 'editor' && ['draft', 'needs_revision'].includes(item.status)) ||
                                (currentUser?.role === 'reporter' && item.status === 'draft' && item.authorId === currentUser?.id)) && (
                                <MenuBtn icon={Edit} label="Edit" color="#374151" onClick={() => { onEdit(item); setOpenMenuId(null); }} />
                              )}
                              {currentUser?.role === 'reporter' && item.status === 'draft' && (
                                <MenuBtn icon={Send} label="Submit for Review" color="#1d4ed8" onClick={() => { onWorkflow(item.id, 'submit'); setOpenMenuId(null); }} />
                              )}
                              {currentUser?.role === 'reporter' && item.status === 'needs_revision' && (
                                <MenuBtn icon={Send} label="Resubmit" color="#1d4ed8" onClick={() => { onWorkflow(item.id, 'submit'); setOpenMenuId(null); }} />
                              )}
                              {currentUser?.role === 'editor' && item.status === 'pending_review' && (
                                <>
                                  <MenuBtn icon={Check} label="Approve" color="#059669" onClick={() => { onWorkflow(item.id, 'approve'); setOpenMenuId(null); }} />
                                  <MenuBtn icon={X} label="Request Revision" color="#ea580c" onClick={() => { onWorkflow(item.id, 'revise'); setOpenMenuId(null); }} />
                                </>
                              )}
                              {currentUser?.role === 'admin' && item.status === 'ready_to_publish' && (
                                <MenuBtn icon={CheckCircle} label="Publish" color="#059669" onClick={() => { onWorkflow(item.id, 'publish'); setOpenMenuId(null); }} />
                              )}
                              {currentUser?.role === 'admin' && item.breakingSuggested && !item.breakingApproved && (
                                <MenuBtn icon={AlertCircle} label="Approve Breaking" color="#dc2626" onClick={() => { onWorkflow(item.id, 'approve-breaking'); setOpenMenuId(null); }} />
                              )}
                              {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && item.trendingSuggested && !item.isTrending && (
                                <MenuBtn icon={TrendingUp} label="Approve Trending" color="#7c3aed" onClick={() => { onWorkflow(item.id, 'approve-trending'); setOpenMenuId(null); }} />
                              )}
                              <MenuBtn icon={History} label="Version History" color="#374151" onClick={() => { onViewVersionHistory(item.id); setOpenMenuId(null); }} />
                              {currentUser?.role === 'admin' && (
                                <>
                                  <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />
                                  <MenuBtn icon={Trash2} label="Delete" color="#dc2626" hoverBg="#fff5f5" onClick={() => { onDelete(item.id); setOpenMenuId(null); }} />
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                      {searchQuery ? `No articles matching "${searchQuery}"` : 'No articles found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', gap: 4 }}>
            <PaginationBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} />
            </PaginationBtn>
            {/* {[...Array(Math.min(totalPages, 9))].map((_, i) => {
              const p = i + 1;
              if (totalPages > 7 && i === 5) return <span key="dots" style={{ padding: '0 4px', color: '#9ca3af', fontSize: 13 }}>...</span>;
              if (totalPages > 7 && i > 5 && i < totalPages - 1) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 32, height: 32, border: `1px solid ${page === p ? '#2563eb' : '#e5e7eb'}`, borderRadius: 8, background: page === p ? '#2563eb' : '#fff', color: page === p ? '#fff' : '#374151', fontSize: 13, fontWeight: page === p ? 600 : 400, cursor: 'pointer' }}>
                  {p}
                </button>
              );
            })} */}

            {getPageNumbers().map((p, i) => {
              if (p === '...') {
                return (
                  <span key={`dots-${i}`} style={{ padding: '0 6px', color: '#9ca3af', fontSize: 13 }}>
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={p} onClick={() => setPage(p)}
                  style={{ width: 32, height: 32, border: `1px solid ${page === p ? '#2563eb' : '#e5e7eb'}`, borderRadius: 8, background: page === p ? '#2563eb' : '#fff', color: page === p ? '#fff' : '#374151', fontSize: 13, fontWeight: page === p ? 600 : 400, cursor: 'pointer' }}>
                  {p}
                </button>
              );
            })}

            <PaginationBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={13} />
            </PaginationBtn>
          </div>
        )}
      </div>
    </div>
  );
}
