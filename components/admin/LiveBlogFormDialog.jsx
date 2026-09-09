'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const LIVE_BLOG_TYPES = ['election', 'sports', 'breaking', 'general'];

export function LiveBlogFormDialog({ open, onOpenChange, editingBlog, form, setForm, onSave }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingBlog ? 'Edit Live Blog' : 'New Live Blog'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Lok Sabha Election Results 2026" />
          </div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              style={{ width: '100%', padding: '9px 13px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
            >
              {LIVE_BLOG_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Short description shown on cards/listings" />
          </div>
          <div className="space-y-2">
            <Label>Featured Image URL</Label>
            <Input value={form.featuredImage} onChange={e => setForm({ ...form, featuredImage: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Linked Article ID (optional)</Label>
            <Input value={form.linkedArticleId} onChange={e => setForm({ ...form, linkedArticleId: e.target.value })} placeholder="Shows an inline ticker on that article while this blog is live" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave} disabled={!form.title || !form.type}>{editingBlog ? 'Save Changes' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
