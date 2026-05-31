'use client';

import { Plus, Edit, Trash2 } from 'lucide-react';
import { DS } from './design-system';
import { LoadingSpinner } from './LoadingSpinner';

export function TagsView({ tags, loading, onAdd, onEdit, onDelete }) {
  if (loading) return <LoadingSpinner />;
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Tags</h2>
        <button style={DS.btn('primary')} onClick={onAdd}><Plus size={15} />Add Tag</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {tags.map(tag => (
          <div key={tag.id} style={DS.card}>
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: tag.color || '#8b5cf6', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{tag.name}</span>
                </div>
                <span style={{ background: tag.isActive !== false ? '#d1fae5' : '#f3f4f6', color: tag.isActive !== false ? '#065f46' : '#6b7280', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
                  {tag.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>{tag.description || 'No description'}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 14px' }}>Slug: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>{tag.slug}</code></p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button style={{ ...DS.btn('outline'), padding: '6px 12px' }} onClick={() => onEdit(tag)}><Edit size={13} />Edit</button>
                <button style={{ ...DS.btn('danger'), padding: '6px 12px' }} onClick={() => onDelete(tag.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No tags found</div>
        )}
      </div>
    </div>
  );
}
