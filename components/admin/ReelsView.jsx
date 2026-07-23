'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Flag, MoreVertical,
  Loader2, ChevronRight, X, RotateCcw,
} from 'lucide-react';
import { DS } from './design-system';
import { MenuBtn } from './MenuBtn';
import { PaginationBtn } from './PaginationBtn';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const STATUS_TABS = [
  { id: 'all', label: 'All', filter: 'all' },
  { id: 'published', label: 'Published', filter: 'published' },
  { id: 'scheduled', label: 'Scheduled', filter: 'scheduled' },
  { id: 'draft', label: 'Drafts', filter: 'draft' },
  { id: 'unpublished', label: 'Unpublished', filter: 'unpublished' },
];

const REEL_STATUS_STYLES = {
  draft: { color: '#b45309', bg: '#fef3c7' },
  scheduled: { color: '#0e7490', bg: '#cffafe' },
  published: { color: '#065f46', bg: '#d1fae5' },
  unpublished: { color: '#6b7280', bg: '#f3f4f6' },
};

const REEL_STATUS_LABELS = {
  draft: 'Draft', scheduled: 'Scheduled', published: 'Published', unpublished: 'Unpublished',
};

function reelBadge(status) {
  const s = REEL_STATUS_STYLES[status] || REEL_STATUS_STYLES.draft;
  return { background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' };
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pct(numerator, denominator) {
  if (!denominator) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function ReelsView({
  reels, currentUser, loading,
  statusFilter, onStatusFilterChange,
  categoryFilter, onCategoryFilterChange, categories,
  searchQuery,
  onEdit, onDelete, onToggleStatus, onResolveReport, onAddNew,
}) {
  const [page, setPage] = useState(1);
  const [previewReel, setPreviewReel] = useState(null);
  const perPage = 8;

  const activeTabId = STATUS_TABS.find((t) => t.filter === statusFilter)?.id || 'all';

  const filtered = reels.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.reporter?.name?.toLowerCase().includes(q) ||
      (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [statusFilter, categoryFilter, searchQuery]);

  const canDelete = currentUser?.role === 'admin';

  return (
    <div style={{ padding: 24 }}>
      <div style={DS.card}>
        <div style={{ padding: '18px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Reels</span>
            <button onClick={onAddNew} style={{ width: 26, height: 26, borderRadius: '50%', background: '#2563eb', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} color="#fff" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {STATUS_TABS.map((t) => (
              <button key={t.id} style={DS.tab(activeTabId === t.id)} onClick={() => onStatusFilterChange(t.filter)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Category:</span>
          <select value={categoryFilter} onChange={(e) => onCategoryFilterChange(e.target.value)} style={{ ...DS.select, minWidth: 160, fontSize: 12 }}>
            <option value="all">All categories</option>
            {(categories || []).map((cat) => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  {['Reel', 'Reporter', 'Category', 'Duration', 'Views / Likes', 'Status', 'Publish Date', ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                    <td style={{ padding: '13px 14px', maxWidth: 280 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 42, height: 74, borderRadius: 6, overflow: 'hidden', background: '#111827', flexShrink: 0 }}>
                          {item.thumbnails?.small && (
                            <img src={item.thumbnails.small} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                            {item.isFeatured && <span style={{ background: '#f3e8ff', color: '#6d28d9', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>FEATURED</span>}
                            {item.isReported && <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Flag size={9} />REPORTED</span>}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{item.reporter?.name || '—'}</td>
                    <td style={{ padding: '13px 14px' }}><span style={DS.tag}>{item.category || '—'}</span></td>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDuration(item.video?.duration)}</td>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{item.views ?? 0} / {item.likeCount ?? 0}</td>
                    <td style={{ padding: '13px 14px' }}><span style={reelBadge(item.status)}>{REEL_STATUS_LABELS[item.status] || item.status}</span></td>
                    <td style={{ padding: '13px 14px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(item.publishedAt || item.createdAt)}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button style={DS.btn('ghost')}><MoreVertical size={15} /></button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content className="dropdown-content" sideOffset={6} collisionPadding={10} align="end" avoidCollisions style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 200, overflow: 'hidden' }}>
                            <div style={{ padding: '4px 0' }}>
                              <MenuBtn icon={Edit} label="Edit" color="#374151" onClick={() => onEdit(item)} />
                              <MenuBtn icon={Eye} label="Preview" color="#374151" onClick={() => setPreviewReel(item)} />
                              {item.status === 'published' ? (
                                <MenuBtn icon={XCircle} label="Unpublish" color="#ea580c" onClick={() => onToggleStatus(item)} />
                              ) : (
                                <MenuBtn icon={CheckCircle} label="Publish" color="#059669" onClick={() => onToggleStatus(item)} />
                              )}
                              {item.isReported && (
                                <MenuBtn icon={Flag} label="Resolve Report" color="#1d4ed8" onClick={() => onResolveReport(item)} />
                              )}
                              {canDelete && (
                                <>
                                  <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />
                                  <MenuBtn icon={Trash2} label="Delete" color="#dc2626" hoverBg="#fff5f5" onClick={() => onDelete(item.id)} />
                                </>
                              )}
                            </div>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                      {searchQuery ? `No reels matching "${searchQuery}"` : 'No reels found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', gap: 4 }}>
            <PaginationBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} />
            </PaginationBtn>
            <span style={{ fontSize: 13, color: '#6b7280', padding: '0 8px' }}>{page} / {totalPages}</span>
            <PaginationBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={13} />
            </PaginationBtn>
          </div>
        )}
      </div>

      {previewReel && (
        <ReelPreviewModal reel={previewReel} onClose={() => setPreviewReel(null)} />
      )}
    </div>
  );
}

function ReelPreviewModal({ reel, onClose }) {
  const shareTotal = Object.values(reel.shares || {}).reduce((a, b) => a + (b || 0), 0);
  const views = reel.views || 0;
  // Engagement rate: every interaction (like/comment/save/share) relative to
  // views — a single combined signal editors can scan at a glance, alongside
  // the raw counters above.
  const engagementRate = pct((reel.likeCount || 0) + (reel.commentCount || 0) + (reel.bookmarkCount || 0) + shareTotal, views);
  const shareRate = pct(shareTotal, views);
  // Watch-through rate: average fraction of the video actually watched per
  // view — distinct from completion rate (a binary "did they finish it"
  // threshold), this is a continuous "how much of it, on average" signal.
  const watchThroughRate = (views && reel.video?.duration)
    ? pct((reel.totalWatchTimeMs || 0) / views, reel.video.duration * 1000)
    : '0%';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ flex: '1 1 260px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {reel.video?.url ? (
            // playbackUrl (f_auto/q_auto) is what any real client should
            // play — falls back to the raw upload URL only if that derived
            // field is somehow missing.
            <video src={reel.video.playbackUrl || reel.video.url} controls style={{ width: '100%', maxHeight: 500 }} />
          ) : (
            <span style={{ color: '#6b7280', fontSize: 13, padding: 40 }}>No video</span>
          )}
        </div>
        <div style={{ flex: '1 1 260px', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{reel.title}</h3>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{reel.description}</p>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stat label="Views" value={reel.views ?? 0} />
            <Stat label="Likes" value={reel.likeCount ?? 0} />
            <Stat label="Shares" value={shareTotal} />
            <Stat label="Saves" value={reel.bookmarkCount ?? 0} />
            <Stat label="Comments" value={reel.commentCount ?? 0} />
            <Stat label="Completion Rate" value={pct(reel.completedViews, reel.views)} />
            <Stat label="Avg Watch Time" value={reel.views ? `${Math.round((reel.totalWatchTimeMs || 0) / reel.views / 1000)}s` : '0s'} />
            <Stat label="Replays" value={reel.replayCount ?? 0} />
            <Stat label="Exit Rate" value={pct(reel.exitCount, reel.views)} />
            <Stat label="3-second Views" value={reel.threeSecondViews ?? 0} />
            <Stat label="Engagement Rate" value={engagementRate} />
            <Stat label="Share Rate" value={shareRate} />
            <Stat label="Watch-through Rate" value={watchThroughRate} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  );
}
