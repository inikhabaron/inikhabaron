'use client';

import { Plus, Edit, Trash2, Star, ExternalLink } from 'lucide-react';
import { DS } from './design-system';
import { LoadingSpinner } from './LoadingSpinner';

const STATE_STYLES = {
  live: { color: '#065f46', bg: '#d1fae5', label: 'Live' },
  scheduled: { color: '#0e7490', bg: '#cffafe', label: 'Scheduled' },
  expired: { color: '#6b7280', bg: '#f3f4f6', label: 'Expired' },
  disabled: { color: '#991b1b', bg: '#fee2e2', label: 'Disabled' },
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PromotionsView({ promotions, loading, onAdd, onEdit, onDelete, onToggleStatus }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Promotions</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Event promotions and special-coverage banners shown on the homepage.</p>
        </div>
        <button style={DS.btn('primary')} onClick={onAdd}><Plus size={15} />Add Promotion</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {promotions.map((promo) => {
          const state = STATE_STYLES[promo.state] || STATE_STYLES.disabled;
          return (
            <div key={promo.id} style={DS.card}>
              <div style={{ height: 120, background: promo.bannerImage ? `url(${promo.bannerImage}) center/cover` : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                {!promo.bannerImage && 'No banner image'}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {promo.isFeatured && <Star size={12} aria-hidden="true" style={{ color: '#f59e0b', marginRight: 5, display: 'inline', verticalAlign: 'middle' }} fill="#f59e0b" />}
                    {promo.title}
                  </span>
                  <span style={{ background: state.bg, color: state.color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                    {state.label}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {promo.description || 'No description'}
                </p>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Event: {formatDate(promo.eventDate)}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Visible: {formatDate(promo.startDate)} → {promo.endDate ? formatDate(promo.endDate) : 'No expiry'}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>Priority: {promo.priority}{promo.category ? ` · ${promo.category}` : ''}</div>

                {promo.buttonLink && (
                  <a href={promo.buttonLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#2563eb', marginBottom: 14 }}>
                    <ExternalLink size={11} />{promo.buttonText || 'Read More'}
                  </a>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4b5563', cursor: 'pointer' }}>
                    <input type="checkbox" checked={promo.status === 'active'} onChange={() => onToggleStatus(promo)} />
                    Enabled
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ ...DS.btn('outline'), padding: '6px 12px' }} onClick={() => onEdit(promo)}><Edit size={13} aria-hidden="true" />Edit</button>
                    <button style={{ ...DS.btn('danger'), padding: '6px 12px' }} onClick={() => onDelete(promo.id)} aria-label={`Delete promotion "${promo.title}"`}><Trash2 size={13} aria-hidden="true" /></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {promotions.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No promotions yet</div>
        )}
      </div>
    </div>
  );
}
