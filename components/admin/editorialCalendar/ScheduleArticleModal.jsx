'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DS } from '@/components/admin/design-system';
import { STATUS_LABELS } from '@/components/admin/constants';

export function ScheduleArticleModal({ open, onOpenChange, authFetch, onScheduled, defaultDate }) {
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSelectedArticleId(null);
    setScheduledAt(defaultDate ? `${defaultDate}T10:00` : '');
    setLoadingArticles(true);
    authFetch('/api/admin/news?status=all&limit=100')
      .then((res) => res.json())
      .then((data) => setArticles((data.news || []).filter((item) => item.status !== 'published')))
      .catch(() => toast.error('Failed to load articles'))
      .finally(() => setLoadingArticles(false));
  }, [open, authFetch, defaultDate]);

  const filtered = articles.filter((item) =>
    !search.trim() || item.title?.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedArticleId || !scheduledAt) return;
    setSubmitting(true);
    try {
      const res = await authFetch('/api/admin/calendar', {
        method: 'POST',
        body: JSON.stringify({ articleId: selectedArticleId, scheduledAt: new Date(scheduledAt).toISOString() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || 'Failed to schedule article');
      toast.success(data?.message || 'Article scheduled successfully');
      onOpenChange(false);
      onScheduled?.();
    } catch (error) {
      toast.error(error?.message || 'Failed to schedule article');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Article</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Article</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
            />
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              {loadingArticles && (
                <div style={{ padding: 16, fontSize: 13, color: '#6b7280' }}>Loading articles...</div>
              )}
              {!loadingArticles && filtered.length === 0 && (
                <div style={{ padding: 16, fontSize: 13, color: '#6b7280' }}>No eligible articles found.</div>
              )}
              {!loadingArticles && filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedArticleId(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                    background: selectedArticleId === item.id ? '#eff6ff' : '#fff',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                  <span style={DS.badge(item.status)}>{STATUS_LABELS[item.status] || item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Schedule Date &amp; Time</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedArticleId || !scheduledAt || submitting}>
            {submitting ? 'Scheduling...' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
