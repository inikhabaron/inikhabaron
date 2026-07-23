'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DS } from './design-system';
import { VideoUpload } from '@/components/upload/VideoUpload';
import { ImageUpload } from '@/components/upload/ImageUpload';
import LocationSelector from '@/components/location/LocationSelector';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

function ArticleLinkPicker({ value, articleTitle, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/news?search=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        setResults(data.news || []);
        setOpen(true);
      } catch { /* ignore */ }
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  if (value && articleTitle) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{articleTitle}</span>
        <button onClick={() => onChange(null, '')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={14} /></button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Search a news article to link..."
      />
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: 220, overflowY: 'auto' }}>
          {results.map((article) => (
            <div key={article.id}
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { onChange(article.id, article.title); setQuery(''); setOpen(false); }}>
              {article.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReelFormDialog({
  open, onOpenChange, editingReel, reelForm, setReelForm,
  categories, staffUsers, currentUser, onSave,
}) {
  const set = (patch) => setReelForm({ ...reelForm, ...patch });
  const reporterOptions = (staffUsers && staffUsers.length ? staffUsers : [currentUser].filter(Boolean));
  const canModerate = ['admin', 'editor', 'reporter'].includes(currentUser?.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingReel ? 'Edit Reel' : 'Create Reel'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={DS.sectionNum}>1</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Media</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Video *</Label>
              <VideoUpload value={reelForm.video} onChange={(video) => set({ video })} folder="reels" />
            </div>
            <div className="space-y-2">
              <Label>Custom Thumbnail (optional)</Label>
              <ImageUpload value={reelForm.thumbnailUrl} onChange={(url) => set({ thumbnailUrl: url })} folder="reels-thumbnails" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={DS.sectionNum}>2</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={reelForm.title} onChange={(e) => set({ title: e.target.value })} placeholder="Reel title" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={reelForm.category} onValueChange={(v) => set({ category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(categories || []).map((cat) => <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={reelForm.description} onChange={(e) => set({ description: e.target.value })} placeholder="Short description" rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={reelForm.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="politics, breaking" />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={reelForm.language} onValueChange={(v) => set({ language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <LocationSelector value={reelForm.location} onChange={(location) => set({ location })} />

          <div className="space-y-2">
            <Label>Linked Article (optional)</Label>
            <ArticleLinkPicker
              value={reelForm.linkedArticleId}
              articleTitle={reelForm.linkedArticleTitle}
              onChange={(id, title) => set({ linkedArticleId: id, linkedArticleTitle: title })}
            />
          </div>

          <div className="space-y-2">
            <Label>Reporter</Label>
            <Select value={reelForm.reporterId} onValueChange={(v) => set({ reporterId: v })}>
              <SelectTrigger><SelectValue placeholder="Select reporter" /></SelectTrigger>
              <SelectContent>
                {reporterOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={DS.sectionNum}>3</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Publishing</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={reelForm.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unpublished">Unpublished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reelForm.status === 'scheduled' && (
              <div className="space-y-2">
                <Label>Schedule Date</Label>
                <Input type="datetime-local" value={reelForm.scheduledAt} onChange={(e) => set({ scheduledAt: e.target.value })} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={reelForm.isFeatured} onCheckedChange={(v) => set({ isFeatured: v })} />
              <Label>Featured</Label>
            </div>
            {canModerate && (
              <div className="flex items-center gap-2">
                <Switch checked={reelForm.isSensitive} onCheckedChange={(v) => set({ isSensitive: v })} />
                <Label>Sensitive Content</Label>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!reelForm.title || !reelForm.category || !reelForm.video?.url}>
            {editingReel ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
