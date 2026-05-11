'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export function ImageUpload({ value, onChange, folder = 'news' }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image size must be less than 10MB'); return; }

    setUploading(true); setProgress(10);
    try {
      const sigRes = await fetch(`/api/cloudinary/signature?folder=${folder}`);
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
      formData.append('resource_type', sigData.resourceType || 'image');
      setProgress(50);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, { method: 'POST', body: formData });
      setProgress(80);
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Cloudinary upload failed');
      if (uploadData.secure_url) { onChange(uploadData.secure_url); toast.success('Image uploaded successfully!'); }
      else throw new Error(uploadData.error?.message || 'Upload failed');
      setProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading}
          style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }} />
        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{progress}%</span>
          </div>
        )}
      </div>
      {value && (
        <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={() => onChange('')} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, background: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}
