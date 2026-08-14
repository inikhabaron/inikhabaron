'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cloudinaryLoader } from '@/lib/media/cloudinaryLoader';
import { Share2 } from 'lucide-react';
import { getCatAccent, getCatLabel, EDITORIAL_RED } from '@/lib/news-utils';

function HeroCard({ item, onClick, formatDate, selectedLanguage, textScale, selectedFont, dark, onShareWhatsApp, onShareTwitter, onShareFacebook, toast }) {
  const catColor = getCatAccent(item.category);
  const catLabel = getCatLabel(item.category, selectedLanguage);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);
  const scale = textScale || 1;
  const fontFamily = selectedFont?.value || 'inherit';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      onClick={() => onClick(item)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'block',
        marginBottom: '24px',
        backgroundColor: '#111',
      }}
    >
      {/* ── Share menu (commented out, preserved) ───────────────────────────
      <div className="kn-hero-share">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowShareMenu((p) => !p);
          }}
          className="kn-hero-btn"
        >
          <Share2 size={16} />
        </button>

        {showShareMenu && (
          <div
            ref={shareMenuRef}
            onClick={(e) => e.stopPropagation()}
            className="kn-hero-share-menu"
            style={{ backgroundColor: dark ? '#161B27' : '#fff', borderColor: dark ? '#252E40' : '#E8EAED' }}
          >
            {[
              { label: 'WhatsApp', className: 'share-whatsapp', fn: () => onShareWhatsApp?.(item) },
              { label: 'Twitter',  className: 'share-twitter',  fn: () => onShareTwitter?.(item)  },
              { label: 'Facebook', className: 'share-facebook', fn: () => onShareFacebook?.(item) },
              {
                label: 'Copy Link',
                className: 'share-copy-link',
                fn: () => navigator.clipboard.writeText(`${window.location.origin}/news/${item.id}`),
              },
            ].map((s) => (
              <button key={s.label} onClick={s.fn} className={`kn-share-item ${s.className || ''}`}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
      ─────────────────────────────────────────────────────────────────────── */}

      {/* Background image */}
      <Image
        src={item.featuredImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900'}
        alt={item.title}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 60vw"
        loader={cloudinaryLoader}
        style={{
          objectFit: 'cover',
          objectPosition: 'center top',
        }}
      />

      {/* Gradient overlay — bottom 65% */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.78) 30%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.10) 75%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content panel — anchored bottom, 65% height */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '65%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 24px 22px 24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
            flexWrap: 'wrap',
          }}
        >
          {item.isBreaking && (
            <span
              style={{
                backgroundColor: EDITORIAL_RED,
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.09em',
                padding: '4px 9px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                lineHeight: 1,
                fontFamily,
              }}
            >
              ● BREAKING
            </span>
          )}
          <span
            style={{
              backgroundColor: catColor,
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.07em',
              padding: '4px 9px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              lineHeight: 1,
              fontFamily,
            }}
          >
            {catLabel}
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: `${scale * 26}px`,
            fontFamily,
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.3,
            margin: '0 0 10px 0',
            padding: 0,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 2px 6px rgba(0,0,0,0.55)',
            letterSpacing: '-0.015em',
          }}
        >
          {item.title}
        </h2>

        {/* Excerpt */}
        {item.excerpt && (
          <p
            style={{
              fontSize: `${scale * 14}px`,
              fontFamily,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.80)',
              lineHeight: 1.55,
              margin: '0 0 12px 0',
              padding: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 4px rgba(0,0,0,0.45)',
            }}
          >
            {item.excerpt}
          </p>
        )}

        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.45)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: `${scale * 12}px`,
              fontFamily,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.58)',
              letterSpacing: '0.03em',
            }}
          >
            {formatDate(item.publishedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(HeroCard);