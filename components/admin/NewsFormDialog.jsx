'use client';

// import dynamic from 'next/dynamic';
// import 'react-quill/dist/quill.snow.css';
import TiptapEditor from './TiptapEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DS } from './design-system';
import { statusOptionsByRole } from './constants';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { MultiImageUpload } from '@/components/upload/MultiImageUpload';

// const ReactQuill = dynamic(() => import('nereact-quill'), { ssr: false });

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
  history: { delay: 1000, maxStack: 50, userOnly: true },
};

const QUILL_FORMATS = ['bold', 'italic', 'underline', 'size', 'align', 'list', 'bullet', 'link', 'image', 'clean'];

export function NewsFormDialog({
  open, onOpenChange, editingNews, newsForm, setNewsForm,
  categories, currentUser, onSave,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingNews ? 'Edit Article' : 'Create Article'}</DialogTitle>
           <DialogDescription>
            Create or edit a news article.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={DS.sectionNum}>1</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Main Information</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} placeholder="Article title" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <select
                className="kn-admin-select"
                value={newsForm.category}
                onChange={(e) =>
                  setNewsForm({
                    ...newsForm,
                    category: e.target.value
                  })
                }
              >
                <option value="">Select category</option>

                {categories.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.slug}
                  >
                    {cat.name}
                  </option>
                ))}
              </select>  
              
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={DS.sectionNum}>2</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Description</span>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
            <TiptapEditor
              value={newsForm.content}
              onChange={(value) =>
                setNewsForm({
                  ...newsForm,
                  content:value
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Excerpt</Label>
            <Textarea value={newsForm.excerpt} onChange={e => setNewsForm({ ...newsForm, excerpt: e.target.value })}
              placeholder="Brief summary (auto-generated if empty)" rows={2} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={DS.sectionNum}>3</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Images</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Featured Image</Label>
              <ImageUpload
                value={newsForm.featuredImage}
                onChange={url => setNewsForm({ ...newsForm, featuredImage: url })}
              />
            </div>
            <div className="space-y-2">
              <Label>Gallery Images</Label>
              <MultiImageUpload
                images={newsForm.images}
                onChange={(imgs) => setNewsForm({ ...newsForm, images: imgs })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={newsForm.tags} onChange={e => setNewsForm({ ...newsForm, tags: e.target.value })} placeholder="politics, breaking, economy" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={newsForm.status}
                onChange={(e) =>
                  setNewsForm({
                    ...newsForm,
                    status: e.target.value
                  })
                }
                className="w-full h-10 rounded-md border border-gray-300 px-3 bg-white"
              >
                {(statusOptionsByRole[currentUser?.role] || statusOptionsByRole.admin).map(opt => (
                  <option
                    key={opt.value}
                    value={opt.value}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Author Name</Label>
              <Input value={newsForm.authorName} onChange={e => setNewsForm({ ...newsForm, authorName: e.target.value })} />
            </div>
            {newsForm.status === 'scheduled' && (
              <div className="space-y-2">
                <Label>Schedule Date</Label>
                <Input type="datetime-local" value={newsForm.scheduledAt} onChange={e => setNewsForm({ ...newsForm, scheduledAt: e.target.value })} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <Switch checked={newsForm.isBreaking} onCheckedChange={v => setNewsForm({ ...newsForm, isBreaking: v })} />
                <Label>Breaking News</Label>
              </div>
            )}
            {(currentUser?.role === 'reporter' || currentUser?.role === 'editor') && (
              <div className="flex items-center gap-2">
                <Switch checked={newsForm.breakingSuggested} onCheckedChange={v => setNewsForm({ ...newsForm, breakingSuggested: v })} />
                <Label>Suggest Breaking News</Label>
              </div>
            )}
            {currentUser?.role !== 'reporter' && (
              <div className="flex items-center gap-2">
                <Switch checked={newsForm.isTrending} onCheckedChange={v => setNewsForm({ ...newsForm, isTrending: v })} />
                <Label>Trending</Label>
              </div>
            )}
            {currentUser?.role === 'reporter' && (
              <div className="flex items-center gap-2">
                <Switch checked={newsForm.trendingSuggested} onCheckedChange={v => setNewsForm({ ...newsForm, trendingSuggested: v })} />
                <Label>Suggest Trending</Label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={newsForm.isFeatured} onCheckedChange={v => setNewsForm({ ...newsForm, isFeatured: v })} />
              <Label>Featured Article</Label>
            </div>
          </div>

          <Separator />
          <h4 className="font-semibold">Source Attribution</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Name</Label>
              <Input value={newsForm.source} onChange={e => setNewsForm({ ...newsForm, source: e.target.value })} placeholder="Reuters, AP, etc." />
            </div>
            <div className="space-y-2">
              <Label>Source URL</Label>
              <Input value={newsForm.sourceUrl} onChange={e => setNewsForm({ ...newsForm, sourceUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <Separator />
          <h4 className="font-semibold">SEO Settings</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>SEO Title</Label>
              <Input value={newsForm.seoTitle} onChange={e => setNewsForm({ ...newsForm, seoTitle: e.target.value })} placeholder="SEO optimized title (defaults to article title)" />
            </div>
            <div className="space-y-2">
              <Label>SEO Description</Label>
              <Textarea value={newsForm.seoDescription} onChange={e => setNewsForm({ ...newsForm, seoDescription: e.target.value })} placeholder="Meta description for search engines" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>SEO Keywords (comma separated)</Label>
              <Input value={newsForm.seoKeywords} onChange={e => setNewsForm({ ...newsForm, seoKeywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!newsForm.title || !newsForm.content || !newsForm.category}>
            {editingNews ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
