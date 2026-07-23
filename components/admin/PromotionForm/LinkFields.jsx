'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Article search-picker — fetches a batch once (see admin/page.js's
// fetchPromotionArticleOptions) and filters client-side as the admin
// types, same approach NewsListView's own search box already uses, rather
// than a new debounced server-search endpoint.
export function LinkFields({ open, promotionForm, set, categories, articles }) {
  const [articleQuery, setArticleQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    if (promotionForm.linkType !== 'article' || !promotionForm.linkValue) { setArticleQuery(''); return; }
    const match = (articles || []).find(a => a.id === promotionForm.linkValue);
    setArticleQuery(match ? match.title : '');
    // Re-seed only when the dialog opens or the article list finishes
    // loading, not on every keystroke (that's articleQuery's own state).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, articles]);

  const filteredArticles = articleQuery.trim()
    ? (articles || []).filter(a => a.title.toLowerCase().includes(articleQuery.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input value={promotionForm.buttonText} onChange={e => set({ buttonText: e.target.value })} placeholder="Read More" />
        </div>
        <div className="space-y-2">
          <Label>Link Type</Label>
          <Select value={promotionForm.linkType} onValueChange={v => { set({ linkType: v, linkValue: '' }); setArticleQuery(''); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No link</SelectItem>
              <SelectItem value="article">News Article</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="external">External URL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {promotionForm.linkType === 'category' && (
        <div className="space-y-2">
          <Label>Linked Category</Label>
          <Select value={promotionForm.linkValue} onValueChange={v => set({ linkValue: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {(categories || []).map(cat => <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {promotionForm.linkType === 'article' && (
        <div className="space-y-2">
          <Label>News Article</Label>
          <Input
            value={articleQuery}
            onChange={e => { setArticleQuery(e.target.value); set({ linkValue: '' }); }}
            placeholder="Search articles by title…"
          />
          {articleQuery.trim() && !promotionForm.linkValue && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {filteredArticles.length === 0 ? (
                <div className="p-2 text-xs text-gray-400">No matching published articles</div>
              ) : filteredArticles.map(a => (
                <button
                  key={a.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                  onClick={() => { set({ linkValue: a.id }); setArticleQuery(a.title); }}
                >
                  {a.title}
                </button>
              ))}
            </div>
          )}
          {promotionForm.linkValue && (
            <p className="text-xs text-gray-500">
              Linked to: <strong>{articleQuery || promotionForm.linkValue}</strong>{' '}
              <button type="button" className="text-blue-600 underline" onClick={() => { set({ linkValue: '' }); setArticleQuery(''); }}>change</button>
            </p>
          )}
        </div>
      )}

      {promotionForm.linkType === 'external' && (
        <div className="space-y-2">
          <Label>External URL</Label>
          <Input value={promotionForm.linkValue} onChange={e => set({ linkValue: e.target.value })} placeholder="https://example.com" />
        </div>
      )}
    </>
  );
}
