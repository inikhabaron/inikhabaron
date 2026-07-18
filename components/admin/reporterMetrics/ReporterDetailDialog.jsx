'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DS } from '../design-system';
import { LoadingSpinner } from '../LoadingSpinner';
import { SIDEBAR_W } from '../constants';

const ARTICLE_COLUMNS = ['Title', 'Category', 'Views', 'Shares', 'Comments', 'Bookmarks', 'Likes'];
const MODAL_MARGIN = 24;

function formatNumber(value) {
  return (value || 0).toLocaleString();
}

export function ReporterDetailDialog({ open, onClose, reporter, loading = false, isMobile = false }) {
  const profile = reporter?.reporter;
  const totals = reporter?.totals;
  const articles = reporter?.articles || [];

  const statTiles = [
    ['Articles', totals?.articlesPublished],
    ['Views', totals?.views],
    ['Shares', totals?.shares],
    ['Comments', totals?.comments],
    ['Bookmarks', totals?.bookmarks],
    ['Likes', totals?.likes],
  ];

  // The admin shell reserves a fixed sidebar (left) and header (top) outside
  // this dialog's own DOM subtree — Radix portals Dialog.Content to
  // document.body, so its default 50%/50% + translate centering is relative
  // to the FULL viewport and ignores that reserved space. On desktop (sidebar
  // permanently visible, matching app/admin/page.js's own isMobile check) we
  // replace the transform-centered positioning with explicit inset-based
  // positioning that only spans the actual visible content area. On mobile
  // the sidebar is an overlay that doesn't reserve space, so the default
  // viewport-centered behavior (driven by the className below) is correct.
  const desktopStyle = !isMobile
    ? {
        left: SIDEBAR_W + MODAL_MARGIN,
        top: DS.header.height + MODAL_MARGIN,
        right: MODAL_MARGIN,
        bottom: MODAL_MARGIN,
        transform: 'none',
        width: 'auto',
        height: 'auto',
        maxWidth: 'none',
        maxHeight: 'none',
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.(); }}>
      <DialogContent
        className="z-50 flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] flex-col overflow-hidden"
        overlayClassName="z-50 bg-black/50 backdrop-blur-none"
        style={desktopStyle}
      >
        <DialogHeader>
          <DialogTitle>{profile?.name || 'Reporter'} — Metrics</DialogTitle>
        </DialogHeader>

        {loading || !reporter ? (
          <LoadingSpinner />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap', flexShrink: 0 }}>
              {profile?.role && (
                <span style={{ ...DS.tag, border: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{profile.role}</span>
              )}
              {profile?.bio && <span style={{ fontSize: 13, color: '#6b7280' }}>{profile.bio}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12, marginBottom: 20, flexShrink: 0 }}>
              {statTiles.map(([label, value]) => (
                <div key={label} style={{ ...DS.card, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{formatNumber(value)}</div>
                </div>
              ))}
            </div>

            <div style={{ ...DS.card, flex: 1, minHeight: 0, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {ARTICLE_COLUMNS.map((h) => (
                      <th
                        key={h}
                        style={{
                          position: 'sticky', top: 0, zIndex: 1,
                          padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280',
                          background: '#f9fafb', borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', maxWidth: 280 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ ...DS.tag, border: '1px solid #e5e7eb', background: '#f9fafb' }}>{article.category}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{formatNumber(article.views)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{formatNumber(article.shares)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{formatNumber(article.comments)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{formatNumber(article.bookmarks)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{formatNumber(article.likes)}</td>
                    </tr>
                  ))}
                  {articles.length === 0 && (
                    <tr><td colSpan={ARTICLE_COLUMNS.length} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No published articles</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
