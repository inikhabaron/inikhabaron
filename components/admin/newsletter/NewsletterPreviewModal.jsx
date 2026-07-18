'use client';

import { X } from 'lucide-react';

import { DS } from '@/components/admin/design-system';

export function NewsletterPreviewModal({ html, subject, onClose }) {
  if (!html) return null;

  return (
    <div style={DS.overlay} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          margin: 'auto', width: 680, maxWidth: '94vw', height: '86vh',
          background: '#fff', borderRadius: 14, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
              Preview
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{subject}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6, display: 'flex' }}
          >
            <X size={20} color="#6B7280" />
          </button>
        </div>

        <iframe title="Newsletter preview" srcDoc={html} style={{ flex: 1, border: 'none', width: '100%' }} />
      </div>
    </div>
  );
}
