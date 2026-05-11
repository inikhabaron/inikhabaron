'use client';

import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );
}
