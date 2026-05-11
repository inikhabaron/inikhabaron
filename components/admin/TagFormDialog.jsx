'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export function TagFormDialog({ open, onOpenChange, editingTag, tagForm, setTagForm, onSave }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={tagForm.name}
              onChange={e => setTagForm({ ...tagForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
              placeholder="Tag name" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={tagForm.slug} onChange={e => setTagForm({ ...tagForm, slug: e.target.value })} placeholder="tag-slug" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={tagForm.description} onChange={e => setTagForm({ ...tagForm, description: e.target.value })} placeholder="Tag description" />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              <Input type="color" value={tagForm.color} onChange={e => setTagForm({ ...tagForm, color: e.target.value })} className="w-12 h-10 p-1" />
              <Input value={tagForm.color} onChange={e => setTagForm({ ...tagForm, color: e.target.value })} className="flex-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={tagForm.isActive} onCheckedChange={v => setTagForm({ ...tagForm, isActive: v })} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!tagForm.name}>{editingTag ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
