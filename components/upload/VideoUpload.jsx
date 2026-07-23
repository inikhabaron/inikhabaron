'use client';

import { useState } from 'react';
import { Loader2, X, Film } from 'lucide-react';
import { toast } from 'sonner';

const MAX_SIZE_BYTES = 250 * 1024 * 1024; // 250MB — no cap was specified, this is an easy-to-tune default
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime']; // MP4, MOV
const MIN_DURATION_SECONDS = 1;
const MAX_DURATION_SECONDS = 180; // 3 minutes — easy to tune, no cap was specified in the original task
const MIN_HEIGHT = 480; // rejects obviously low-quality uploads
const TARGET_ASPECT = 9 / 16;
const ASPECT_TOLERANCE = 0.15; // allows near-vertical (not just exact 9:16) without rejecting reasonable Reels-style video

function formatBytes(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Reads duration/width/height straight from the local file via a hidden
// <video> element — no upload needed. This lets duration/resolution/aspect
// ratio be rejected BEFORE spending an upload, rather than after (which would
// otherwise leave an orphaned Cloudinary asset the client has no permission
// to delete). Codec is deliberately not validated here: browsers don't
// reliably expose it from a local File without heavier APIs, and Cloudinary
// can normalize whatever codec comes in in to a standard one on delivery
// (f_auto/q_auto), so a strict client-side codec gate would risk false
// rejections more than it prevents real problems.
function probeVideoFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const { duration, videoWidth, videoHeight } = video;
      URL.revokeObjectURL(url);
      resolve({ duration, width: videoWidth, height: videoHeight });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata — the file may be corrupted'));
    };
    video.src = url;
  });
}

export function VideoUpload({ value, onChange, folder = 'reels' }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) { toast.error('Please select an MP4 or MOV video file'); return; }
    if (file.size > MAX_SIZE_BYTES) { toast.error(`Video size must be less than ${MAX_SIZE_BYTES / (1024 * 1024)}MB`); return; }

    let probe;
    try {
      probe = await probeVideoFile(file);
    } catch (error) {
      toast.error(error.message);
      return;
    }

    if (probe.duration < MIN_DURATION_SECONDS) { toast.error('Video is too short'); return; }
    if (probe.duration > MAX_DURATION_SECONDS) {
      toast.error(`Video must be ${MAX_DURATION_SECONDS} seconds or less (this one is ${Math.round(probe.duration)}s)`);
      return;
    }
    if (probe.height < MIN_HEIGHT) {
      toast.error(`Video resolution is too low (minimum height ${MIN_HEIGHT}px)`);
      return;
    }
    const aspect = probe.width / probe.height;
    if (Math.abs(aspect - TARGET_ASPECT) > ASPECT_TOLERANCE) {
      toast.error('Video should be vertical (9:16 aspect ratio) for the Reels feed');
      return;
    }

    setUploading(true); setProgress(10);
    try {
      const sigRes = await fetch(`/api/cloudinary/signature?folder=${folder}&resource_type=video`);
      if (!sigRes.ok) {
        const errorData = await sigRes.text();
        throw new Error(`Signature request failed: ${sigRes.status} ${sigRes.statusText} ${errorData}`);
      }
      const sigData = await sigRes.json();
      if (sigData.error || !sigData.cloudName || !sigData.apiKey || sigData.cloudName.startsWith('TODO') || sigData.apiKey.startsWith('TODO')) {
        throw new Error('Cloudinary is not configured correctly. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY in .env');
      }
      setProgress(30);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp);
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);
      formData.append('resource_type', sigData.resourceType || 'video');
      setProgress(50);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/video/upload`, { method: 'POST', body: formData });
      setProgress(80);
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Cloudinary upload failed');
      if (uploadData.secure_url) {
        onChange({
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
          duration: uploadData.duration,
          width: uploadData.width,
          height: uploadData.height,
          format: uploadData.format,
          bytes: uploadData.bytes,
        });
        toast.success('Video uploaded successfully!');
      } else {
        throw new Error(uploadData.error?.message || 'Upload failed');
      }
      setProgress(100);
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error('Failed to upload video: ' + error.message);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="file" accept="video/mp4,video/quicktime" onChange={handleFileChange} disabled={uploading}
          style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }} />
        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{progress}%</span>
          </div>
        )}
      </div>
      {value?.url && (
        <div style={{ position: 'relative', width: '100%', maxWidth: 260, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#000' }}>
          <video src={value.url} controls style={{ width: '100%', display: 'block', maxHeight: 320 }} />
          <button onClick={() => onChange(null)} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, background: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} color="#fff" />
          </button>
          <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
            <Film size={11} />
            {formatDuration(value.duration)} · {value.format?.toUpperCase()} · {formatBytes(value.bytes)}
          </div>
        </div>
      )}
    </div>
  );
}
