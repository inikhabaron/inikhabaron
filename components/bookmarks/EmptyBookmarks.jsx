'use client';

import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ACCENT = '#3BAFDA';

export default function EmptyBookmarks() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 20,
          padding: '48px 32px',
          boxShadow: '0 10px 30px rgba(0,0,0,.06)',
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: `${ACCENT}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Bookmark
            size={42}
            color={ACCENT}
          />
        </div>

        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          No bookmarks yet
        </h2>

        <p
          style={{
            color: '#6B7280',
            lineHeight: 1.7,
            marginBottom: 30,
          }}
        >
          Articles you save will appear here.
          <br />
          Start bookmarking stories to read later.
        </p>

        <button
          onClick={() => router.push('/')}
          style={{
            background: ACCENT,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 22px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: '.2s',
          }}
        >
          Browse News
        </button>
      </div>
    </div>
  );
}