'use client';

import { Plus, Edit, Trash2, Radio, ArrowRight } from 'lucide-react';
import { DS } from './design-system';
import { LoadingSpinner } from './LoadingSpinner';

const STATUS_COLORS = {
  draft: { bg: '#f3f4f6', color: '#6b7280' },
  live: { bg: '#fee2e2', color: '#dc2626' },
  completed: { bg: '#d1fae5', color: '#065f46' },
  archived: { bg: '#f3f4f6', color: '#9ca3af' },
};

export function LiveBlogsListView({ blogs, loading, onAdd, onEdit, onDelete, onManage }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: 24 }}>
      <div style={DS.card}>
        <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={18} color="#dc2626" />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Live Blogs</span>
          </div>
          <button style={DS.btn('primary')} onClick={onAdd}><Plus size={15} />New Live Blog</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {['Title', 'Type', 'Status', 'Updated', ''].map((h, i) => (
                  <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => {
                const statusStyle = STATUS_COLORS[blog.status] || STATUS_COLORS.draft;
                return (
                  <tr key={blog.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#111827', fontWeight: 600 }}>{blog.title}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280', textTransform: 'capitalize' }}>{blog.type}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: statusStyle.bg, color: statusStyle.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' }}>
                        {blog.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af' }}>
                      {blog.updatedAt ? new Date(blog.updatedAt).toLocaleString() : ''}
                    </td>
                    <td style={{ padding: '12px 14px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button style={{ ...DS.btn('outline'), padding: '6px 12px', fontSize: 12 }} onClick={() => onManage(blog)}>
                        Manage<ArrowRight size={13} />
                      </button>
                      <button style={{ ...DS.btn('outline'), padding: '6px 10px' }} onClick={() => onEdit(blog)}><Edit size={13} /></button>
                      <button style={{ ...DS.btn('danger'), padding: '6px 10px' }} onClick={() => onDelete(blog)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    No live blogs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
