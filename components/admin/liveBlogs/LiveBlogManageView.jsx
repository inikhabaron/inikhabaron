'use client';

import { useState } from 'react';
import { ArrowLeft, Send, Edit, Trash2, Check, Radio } from 'lucide-react';
import { DS } from '../design-system';
import { LoadingSpinner } from '../LoadingSpinner';

const STATUS_COLORS = {
  draft: { bg: '#f3f4f6', color: '#6b7280' },
  live: { bg: '#fee2e2', color: '#dc2626' },
  completed: { bg: '#d1fae5', color: '#065f46' },
  archived: { bg: '#f3f4f6', color: '#9ca3af' },
};

// Forward lifecycle draft -> live -> completed, with archive reachable
// from draft (cancel) or completed (retire) — see docs/mvp3-phase1-architecture.md.
const NEXT_STATUS_ACTIONS = {
  draft: [{ status: 'live', label: 'Go Live', variant: 'primary' }, { status: 'archived', label: 'Archive', variant: 'outline' }],
  live: [{ status: 'completed', label: 'Mark Completed', variant: 'primary' }],
  completed: [{ status: 'archived', label: 'Archive', variant: 'outline' }],
  archived: [],
};

export function LiveBlogManageView({
  blog, updates, loading, onBack, onStatusChange,
  draftContent, setDraftContent, onPostUpdate, posting,
  onEditUpdate, onDeleteUpdate, onPublishUpdate,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  if (loading || !blog) return <LoadingSpinner />;

  const statusStyle = STATUS_COLORS[blog.status] || STATUS_COLORS.draft;

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        <ArrowLeft size={14} />Back to Live Blogs
      </button>

      <div style={{ ...DS.card, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Radio size={16} color="#dc2626" />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{blog.title}</span>
            </div>
            <span style={{ background: statusStyle.bg, color: statusStyle.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' }}>
              {blog.status}
            </span>
            <span style={{ marginLeft: 8, fontSize: 12, color: '#9ca3af', textTransform: 'capitalize' }}>{blog.type}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(NEXT_STATUS_ACTIONS[blog.status] || []).map((action) => (
              <button
                key={action.status}
                style={DS.btn(action.variant)}
                onClick={() => onStatusChange(action.status)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
        {blog.summary && <p style={{ fontSize: 13, color: '#6b7280', margin: '10px 0 0' }}>{blog.summary}</p>}
      </div>

      {blog.status !== 'archived' && (
        <div style={{ ...DS.card, padding: 18, marginBottom: 20 }}>
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="Write a new update..."
            style={{ width: '100%', minHeight: 90, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <button style={DS.btn('outline')} disabled={!draftContent.trim() || posting} onClick={() => onPostUpdate('draft')}>
              Save as Draft
            </button>
            <button style={DS.btn('primary')} disabled={!draftContent.trim() || posting} onClick={() => onPostUpdate('published')}>
              <Send size={13} />Publish Update
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {updates.map((update) => (
          <div key={update.id} style={{ ...DS.card, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {new Date(update.publishedAt || update.createdAt).toLocaleString()}
                {update.status === 'draft' && (
                  <span style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>DRAFT</span>
                )}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {update.status === 'draft' && (
                  <button style={{ ...DS.btn('primary'), padding: '5px 10px', fontSize: 12 }} onClick={() => onPublishUpdate(update.id)}>
                    <Check size={12} />Publish
                  </button>
                )}
                {editingId === update.id ? (
                  <button style={{ ...DS.btn('primary'), padding: '5px 10px', fontSize: 12 }} onClick={() => { onEditUpdate(update.id, editContent); setEditingId(null); }}>
                    Save
                  </button>
                ) : (
                  <button style={{ ...DS.btn('outline'), padding: '5px 10px' }} onClick={() => { setEditingId(update.id); setEditContent(update.content); }}>
                    <Edit size={12} />
                  </button>
                )}
                <button style={{ ...DS.btn('danger'), padding: '5px 10px' }} onClick={() => onDeleteUpdate(update.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            {editingId === update.id ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ width: '100%', minHeight: 70, padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            ) : (
              <p style={{ fontSize: 13, color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>{update.content}</p>
            )}
          </div>
        ))}
        {updates.length === 0 && (
          <div style={{ ...DS.card, padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            No updates yet
          </div>
        )}
      </div>
    </div>
  );
}
