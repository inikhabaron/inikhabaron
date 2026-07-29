'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/upload/ImageUpload';

export function UserFormDialog({ open, onOpenChange, editingUser, userForm, setUserForm, onSave }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <ImageUpload value={userForm.avatar} onChange={v => setUserForm({ ...userForm, avatar: v })} folder="avatars" />
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={userForm.role} onValueChange={v => setUserForm({ ...userForm, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reader">Reader</SelectItem>
                <SelectItem value="reporter">Reporter</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={userForm.bio} onChange={e => setUserForm({ ...userForm, bio: e.target.value })} placeholder="User bio" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={userForm.isVerified} onCheckedChange={v => setUserForm({ ...userForm, isVerified: v })} />
            <Label>Verified Author</Label>
          </div>
          {userForm.role === 'editor' && (
            <>
              <Separator />
              <h4 className="font-semibold">Editor Permissions</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={userForm.canPublishScheduled} onCheckedChange={v => setUserForm({ ...userForm, canPublishScheduled: v })} />
                  <Label>Can publish scheduled news</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={userForm.canPublishBreaking} onCheckedChange={v => setUserForm({ ...userForm, canPublishBreaking: v })} />
                  <Label>Can publish breaking news</Label>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!userForm.name}>{editingUser ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
