'use client';
import React, { useMemo, useRef, useContext, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { DarkCtx, FontCtx } from '@/lib/news-contexts';
import { getCatAccent, getCatLabel } from '@/lib/news-utils';

export default function ArticleCard({
  item, onClick, formatDate, showShareMenu, setShowShareMenu,
  selectedLanguage, onShareWhatsApp, onShareTwitter, onShareFacebook,
}) {
  const dark = useContext(DarkCtx);
  const { scale } = useContext(FontCtx);
  const catColor = getCatAccent(item.category);
  const catLabel = getCatLabel(item.category, selectedLanguage);
  const shareMenuRef = useRef(null);

  // Memoize — stripping HTML tags and splitting on whitespace is non-trivial
  // and was re-running on every parent re-render for every card in the list.
  const readTime = useMemo(() => {
    const wordCount = ((item.excerpt || '')).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [item.excerpt]);

  // Only attach the document listener while this card's share menu is open.
  // Previously every card registered a permanent listener — 20 articles = 20
  // always-active handlers firing on every mousedown anywhere on the page.
  useEffect(() => {
    if (showShareMenu !== item.id) return;

    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu, item.id, setShowShareMenu]);

  return (
    <div
      onClick={() => onClick(item)}
      className="kn-card"
      style={{ backgroundColor: dark ? '#161B27' : '#FFFFFF', border: dark ? '1px solid #252E40' : 'none' }}
    >
      <div className="kn-card-img-wrap" style={{ backgroundColor: dark ? '#252E40' : '#F0F2F6' }}>
        <img
          src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600'}
          alt={item.title}
          className="kn-card-img"
          loading="lazy"
        />
        {item.isBreaking && <span className="kn-card-live">LIVE</span>}
        <div className="kn-card-bar" style={{ backgroundColor: catColor }} />
      </div>

      <div className="kn-card-body">
        <div className="kn-card-cat-row">
          <span className="kn-card-cat-dot" style={{ backgroundColor: catColor }} />
          <span className="kn-card-cat-label" style={{ color: catColor, fontSize: `${10 * scale}px` }}>{catLabel}</span>
        </div>

        <h3 className="kn-card-title" style={{ fontSize: `${15 * scale}px`, color: dark ? '#E8ECF0' : '#111827' }}>
          {item.title}
        </h3>

        <div className="kn-card-meta">
          <div className="kn-card-meta-left">
            <span style={{ fontSize: `${11 * scale}px`, color: '#8A8F98', whiteSpace: 'nowrap' }}>{formatDate(item.publishedAt)}</span>
            <span style={{ fontSize: `${10 * scale}px`, color: '#8A8F98', whiteSpace: 'nowrap' }}>· {readTime} min</span>
          </div>
          <div className="kn-card-actions">
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowShareMenu(p => p === item.id ? null : item.id); }}
                className="kn-card-action-btn"
              >
                <Share2 style={{ width: '13px', height: '13px' }} />
              </button>
              {showShareMenu === item.id && (
                <div ref={shareMenuRef} onClick={(e) => e.stopPropagation()} className="kn-share-menu" style={{ backgroundColor: dark ? '#161B27' : '#fff', borderColor: dark ? '#252E40' : '#E8EAED' }}>
                  {[
                    { label: 'WhatsApp', className: 'share-whatsapp', fn: () => onShareWhatsApp(item) },
                    { label: 'Twitter',  className: 'share-twitter',  fn: () => onShareTwitter(item) },
                    { label: 'Facebook', className: 'share-facebook', fn: () => onShareFacebook(item) },
                    { label: 'Copy Link', className: 'share-copy-link', fn: () => { navigator.clipboard.writeText(`${window.location.origin}/news/${item.id}`); toast.success('Link copied!'); } },
                  ].map(s => (
                    <button key={s.label} onClick={s.fn} className={`kn-share-item ${s.className || ''}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
