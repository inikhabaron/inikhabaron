'use client';

import { ImageUpload } from './ImageUpload';

export function MultiImageUpload({ images = [], onChange }) {
  const handleAdd = (url) => {
    onChange([...images, url]);
  };

  const removeImage = (index) => {
    const updated = [...images];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <ImageUpload value="" onChange={(url) => handleAdd(url)} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {images.map((img, i) => (
          <div key={i} style={{
            position: 'relative',
            width: 120,
            height: 100,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
          }}>
            <img src={typeof img === 'string' ? img : img?.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => removeImage(i)}
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                background: '#dc2626',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                cursor: 'pointer',
              }}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
