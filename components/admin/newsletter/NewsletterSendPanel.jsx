'use client';

import { Send, Eye, Loader2 } from 'lucide-react';

import { DS } from '@/components/admin/design-system';

export function NewsletterSendPanel({
  activeCount = 0,
  sendType = 'monthly',
  onSendTypeChange,

  onPreview,
  previewLoading = false,

  onSend,
  sending = false,

  forceResend = false,
  onForceResendChange,

  lastResult = null,
}) {
  return (
    <div style={{ ...DS.card, padding: 20, marginBottom: 24 }}>
      <style>{`
        @keyframes newsletter-send-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Send size={18} color="#2563eb" />
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
          Send Newsletter
        </h2>
      </div>

      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280' }}>
        Sends to all {activeCount} active subscriber{activeCount === 1 ? '' : 's'}. This cannot be undone.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={sendType}
          onChange={(e) => onSendTypeChange?.(e.target.value)}
          disabled={sending}
          style={DS.select}
        >
          <option value="monthly">Monthly Digest</option>
          <option value="breaking">Breaking News</option>
        </select>

        <button type="button" onClick={onPreview} disabled={previewLoading} style={DS.btn('outline')}>
          <Eye size={16} />
          {previewLoading ? 'Loading…' : 'Preview'}
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={sending || activeCount === 0}
          style={{ ...DS.btn('primary'), opacity: sending || activeCount === 0 ? 0.7 : 1 }}
        >
          {sending
            ? <Loader2 size={16} style={{ animation: 'newsletter-send-spin 1s linear infinite' }} />
            : <Send size={16} />}
          {sending ? 'Sending…' : sendType === 'breaking' ? 'Send Breaking Alert' : 'Send Monthly Newsletter'}
        </button>
      </div>

      {sendType === 'monthly' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: '#6B7280', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={forceResend}
            onChange={(e) => onForceResendChange?.(e.target.checked)}
            disabled={sending}
          />
          Force resend even if this month's newsletter was already sent
        </label>
      )}

      {lastResult && (
        <div style={{
          marginTop: 16, padding: 14, borderRadius: 10,
          background: lastResult.failed > 0 ? '#FFFBEB' : '#F0FDF4',
          border: `1px solid ${lastResult.failed > 0 ? '#FDE68A' : '#BBF7D0'}`,
          fontSize: 13, color: '#374151',
        }}>
          <strong>Last send ({lastResult.type}):</strong>{' '}
          {lastResult.sent} sent, {lastResult.failed} failed, {lastResult.skipped} skipped
          {typeof lastResult.total === 'number' ? ` (of ${lastResult.total} subscribers)` : ''}
        </div>
      )}
    </div>
  );
}
