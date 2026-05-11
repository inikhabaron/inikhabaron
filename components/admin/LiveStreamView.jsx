'use client';

import { Loader2, Video } from 'lucide-react';
import { DS } from './design-system';

export function LiveStreamView({ ytForm, setYtForm, onSave, onClear, ytSaving }) {
  return (
    <div style={{ padding: 24, maxWidth: 680 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Live Stream Settings</h2>
      <div style={DS.card}>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            Paste any YouTube video ID to embed it as a live stream on the homepage. Overrides automatic channel detection.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={DS.label}>YouTube Video ID <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={DS.input} placeholder="e.g. dQw4w9WgXcQ"
                value={ytForm.videoId}
                onChange={e => setYtForm({ ...ytForm, videoId: e.target.value.trim() })} />
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>
                From any YouTube URL: youtube.com/watch?v=<strong>THIS_PART</strong> or youtu.be/<strong>THIS_PART</strong>
              </p>
            </div>
            <div>
              <label style={DS.label}>Display Title <span style={{ fontSize: 11, color: '#9ca3af' }}>(optional)</span></label>
              <input style={DS.input} placeholder="e.g. BBC News Live"
                value={ytForm.title}
                onChange={e => setYtForm({ ...ytForm, title: e.target.value })} />
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>Shown in the banner. Leave blank to use YouTube's video title.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ width: 44, height: 24, background: ytForm.isLive ? '#2563eb' : '#e5e7eb', borderRadius: 12, position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setYtForm({ ...ytForm, isLive: !ytForm.isLive })}>
                <div style={{ position: 'absolute', top: 2, left: ytForm.isLive ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Mark as Live</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Shows the red pulsing LIVE badge on the banner</div>
              </div>
            </label>
            {ytForm.videoId && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 14px', background: '#f9fafb' }}>Preview</div>
                <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                  <iframe src={`https://www.youtube.com/embed/${ytForm.videoId}?rel=0`} title="Preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
              <button style={{ ...DS.btn('primary'), opacity: (!ytForm.videoId || ytSaving) ? 0.6 : 1 }}
                onClick={onSave} disabled={ytSaving || !ytForm.videoId}>
                {ytSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={14} />}
                Save & Go Live
              </button>
              <button style={DS.btn('outline')} onClick={onClear} disabled={ytSaving}>
                Clear / Go Offline
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...DS.card, marginTop: 20 }}>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Fallback — Channel Auto-Detection</div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px' }}>When no Video ID is set above, the system falls back to:</p>
          <ol style={{ fontSize: 13, color: '#6b7280', paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
            <li>Check if your configured channel is live (requires YouTube API key)</li>
            <li>Embed latest uploaded video from the channel</li>
            <li>Open YouTube channel page in a new tab (if no API key)</li>
          </ol>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
            Configure <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>YOUTUBE_CHANNEL_ID</code> and optionally{' '}
            <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>YOUTUBE_API_KEY</code> in your{' '}
            <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>.env</code> file for auto-detection.
          </p>
        </div>
      </div>
    </div>
  );
}
