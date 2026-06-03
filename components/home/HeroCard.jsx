'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { getCatAccent, getCatLabel, EDITORIAL_RED } from '@/lib/news-utils';

export default function HeroCard({ item, onClick, formatDate, selectedLanguage, textScale, selectedFont, dark, onShareWhatsApp, onShareTwitter, onShareFacebook, toast }) {
  const catColor = getCatAccent(item.category);
  const catLabel = getCatLabel(item.category, selectedLanguage);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target)
      ) {
        setShowShareMenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div onClick={() => onClick(item)} className="kn-hero">
      {/* <div className="kn-hero-share" >
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
              {
                label: 'WhatsApp',
                className:'share-whatsapp',
                fn: () => onShareWhatsApp?.(item),
              },
              {
                label: 'Twitter',
                className:'share-twitter',
                fn: () => onShareTwitter?.(item),
              },
              {
                label: 'Facebook',
                className:'share-facebook',
                fn: () => onShareFacebook?.(item),
              },
              {
                label: 'Copy Link',
                className: 'share-copy-link',
                fn: () => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/news/${item.id}`
                  );
                },
              },
            ].map((s) => (
              <button
                key={s.label}
                onClick={s.fn}
                className={`kn-share-item ${s.className || ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div> */}
      <img
        src={item.featuredImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900'}
        alt={item.title}
      />
      <div className="kn-hero-grad" />
      <div className="kn-hero-content">
        <div className="kn-hero-badges">
          {item.isBreaking && <span className="kn-breaking-badge">BREAKING</span>}
          <span className="kn-cat-badge" style={{ backgroundColor: catColor }}>{catLabel}</span>
        </div>
        <h2 className="kn-hero-title" style={{ fontSize: `${22 * textScale}px`, fontFamily: selectedFont?.value }}>
          {item.title}
        </h2>
        {item.excerpt && (
          <p className="kn-hero-excerpt" style={{ fontSize: `${13 * textScale}px`, fontFamily: selectedFont?.value }}>
            {item.excerpt}
          </p>
        )}
        <span className="kn-hero-date">{formatDate(item.publishedAt)}</span>
      </div>
    </div>
  );
}
