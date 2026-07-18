'use client';

import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmptyBookmarks({
  dark = false,
  icon: Icon = Bookmark,
  title = 'No bookmarks yet',
  subtitle = (
    <>
      Articles you save will appear here.
      <br />
      Start bookmarking stories to read later.
    </>
  ),
  ctaLabel = 'Browse News',
  ctaHref = '/',
}) {
  const router = useRouter();

  return (
    <div
      className={dark ? 'dark' : ''}
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
          background: 'var(--bookmark-card)',
          border: '1px solid var(--bookmark-border)',
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
            background: 'color-mix(in srgb, var(--bookmark-accent) 15%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Icon
            size={42}
            color="var(--bookmark-accent)"
          />
        </div>

        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 12,
            color: 'var(--bookmark-text)',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            color: 'var(--bookmark-muted)',
            lineHeight: 1.7,
            marginBottom: 30,
          }}
        >
          {subtitle}
        </p>

        <button
          onClick={() => router.push(ctaHref)}
          style={{
            background: 'var(--bookmark-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 22px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: '.2s',
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
