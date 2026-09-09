'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '';
  }
}

// Read-only list of individual feedback entries for one article — the
// admin-facing counterpart to GET /api/admin/feedback/[articleId].
export function FeedbackDetailDialog({ open, onOpenChange, articleTitle, items, loading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: 520 }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: 16 }}>{articleTitle || 'Feedback'}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader2 size={22} className="animate-spin" style={{ color: '#2563eb' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
            {items.length === 0 && (
              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 24 }}>No feedback entries.</p>
            )}
            {items.map((item, i) => (
              <div key={i} style={{ border: '1px solid #f3f4f6', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: item.comment ? 6 : 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.vote === 'helpful' ? '#16a34a' : '#dc2626' }}>
                    {item.vote === 'helpful' ? '👍 Helpful' : '👎 Not Helpful'}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(item.updatedAt || item.createdAt)}</span>
                </div>
                {item.comment && (
                  <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{item.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
