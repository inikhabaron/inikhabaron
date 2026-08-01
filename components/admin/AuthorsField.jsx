'use client';

import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { MAX_AUTHORS } from '@/lib/news/authors';

export const EMPTY_AUTHOR = { name: '', image: '' };

// Order is editorial, not cosmetic: the first author is the lead byline and
// is what `authorName` is derived from on save, so the labels say which slot
// is which and the arrows let an editor fix the order before publishing.
function authorRoleLabel(index) {
  return index === 0 ? 'Primary Author' : 'Contributing Author';
}

const iconButton = (disabled) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
  background: '#fff', border: '1px solid #e5e7eb', color: disabled ? '#d1d5db' : '#4b5563',
  padding: 0,
});

// Name + photo per author, up to MAX_AUTHORS. Controlled: the parent owns
// `authors` and this only reports the next array back through onChange, so
// the news form keeps a single source of truth.
//
// Always renders at least one block — an article with no author block at all
// would leave no way to type a name, and an empty block normalizes away on
// save (see normalizeAuthorsInput).
export function AuthorsField({ authors, onChange }) {
  const list = authors?.length ? authors : [EMPTY_AUTHOR];

  const updateAuthor = (index, patch) => {
    onChange(list.map((author, i) => (i === index ? { ...author, ...patch } : author)));
  };

  const addAuthor = () => {
    if (list.length >= MAX_AUTHORS) return;
    onChange([...list, { ...EMPTY_AUTHOR }]);
  };

  const removeAuthor = (index) => {
    const author = list[index];
    // Only interrupt when there is something to lose — confirming an empty
    // block would just train editors to dismiss the dialog reflexively.
    const hasContent = Boolean(author?.name?.trim() || author?.image);
    if (hasContent) {
      const who = author.name?.trim() || 'this author';
      if (!window.confirm(`Remove ${who}? Their name and photo will be cleared from this article.`)) return;
    }
    const next = list.filter((_, i) => i !== index);
    // Removing the last remaining block clears it instead of leaving none.
    onChange(next.length ? next : [{ ...EMPTY_AUTHOR }]);
  };

  const moveAuthor = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {list.map((author, index) => {
        const isFirst = index === 0;
        const isLast = index === list.length - 1;
        return (
          <div
            key={index}
            style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, background: '#fafafa' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isFirst ? '#111827' : '#374151' }}>
                {authorRoleLabel(index)}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {list.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => moveAuthor(index, -1)}
                      disabled={isFirst}
                      aria-label={`Move ${author.name?.trim() || authorRoleLabel(index)} up`}
                      style={iconButton(isFirst)}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAuthor(index, 1)}
                      disabled={isLast}
                      aria-label={`Move ${author.name?.trim() || authorRoleLabel(index)} down`}
                      style={iconButton(isLast)}
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAuthor(index)}
                      aria-label={`Remove ${author.name?.trim() || authorRoleLabel(index)}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, background: 'none',
                        border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 12,
                        fontWeight: 600, padding: '2px 4px', fontFamily: 'inherit',
                      }}
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Author Name</Label>
                <Input
                  value={author.name || ''}
                  onChange={(e) => updateAuthor(index, { name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Author Photo</Label>
                <ImageUpload
                  value={author.image || ''}
                  onChange={(url) => updateAuthor(index, { image: url })}
                  folder="authors"
                />
              </div>
            </div>
          </div>
        );
      })}

      {list.length < MAX_AUTHORS ? (
        <button
          type="button"
          onClick={addAuthor}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: '1px dashed #9ca3af', borderRadius: 10, padding: '9px 14px',
            cursor: 'pointer', color: '#374151', fontSize: 13, fontWeight: 600,
            width: '100%', justifyContent: 'center', fontFamily: 'inherit',
          }}
        >
          <Plus size={15} />
          Add Another Author
        </button>
      ) : (
        <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', margin: 0 }}>
          Maximum of {MAX_AUTHORS} authors per article.
        </p>
      )}
    </div>
  );
}
