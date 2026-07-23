'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { DateFields } from './DateFields';
import { LinkFields } from './LinkFields';

export function PromotionFormDialog({ open, onOpenChange, editingPromotion, promotionForm, setPromotionForm, categories, articles, onSave }) {
  const set = (patch) => setPromotionForm({ ...promotionForm, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPromotion ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={promotionForm.title} onChange={e => set({ title: e.target.value })} placeholder="e.g. Republic Day Special Coverage" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={promotionForm.description} onChange={e => set({ description: e.target.value })} placeholder="Short description shown on the card" />
          </div>

          <div className="space-y-2">
            <Label>Banner Image</Label>
            <ImageUpload value={promotionForm.bannerImage} onChange={url => set({ bannerImage: url })} folder="promotions" />
          </div>

          <DateFields promotionForm={promotionForm} set={set} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Priority</Label>
              <Input type="number" value={promotionForm.priority} onChange={e => set({ priority: parseInt(e.target.value) || 0 })} />
              <p className="text-xs text-gray-400">Lower number shows first (0 = highest priority).</p>
            </div>
            <div className="space-y-2">
              <Label>Category Badge (optional)</Label>
              <Select value={promotionForm.category || '__none'} onValueChange={v => set({ category: v === '__none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="No badge" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No badge</SelectItem>
                  {(categories || []).map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <LinkFields open={open} promotionForm={promotionForm} set={set} categories={categories} articles={articles} />

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch checked={promotionForm.status === 'active'} onCheckedChange={v => set({ status: v ? 'active' : 'inactive' })} />
              <Label>Enabled</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={promotionForm.isFeatured} onCheckedChange={v => set({ isFeatured: v })} />
              <Label>Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={promotionForm.showCountdown} onCheckedChange={v => set({ showCountdown: v })} />
              <Label>Show countdown</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!promotionForm.title}>{editingPromotion ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
