'use client';
import React, { useState, useRef, useContext } from 'react';
import Image from 'next/image';
import { X, ChevronRight, Share2, Clock, Eye, User } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProgrammaticAd, NativeAd } from '@/components/home/AdSlot';
import { DarkCtx, FontCtx } from '@/lib/news-contexts';
import { ACCENT, getCatAccent, getCatLabel } from '@/lib/news-utils';

const SR_ONLY = { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 };

export default function ArticleModal({
  article, onClose, isMobileView, selectedLanguage,
  surface, bdr, T1, T2, T3,
  onShareWhatsApp, onShareTwitter, onShareFacebook,
  onSaveProgress, formatDate,
}) {
  const dark = useContext(DarkCtx);
  const { font: selectedFont, scale: textScale } = useContext(FontCtx);
  const contentRef = useRef(null);
  const [scrollPct, setScrollPct] = useState(0);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const pct = Math.min(Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100), 100);
    setScrollPct(pct);
    onSaveProgress?.(pct);
  };

  const handleClose = () => { onSaveProgress?.(scrollPct); onClose(); };

  if (!article) return null;

  const catColor = getCatAccent(article.category);
  const catLabel = getCatLabel(article.category, selectedLanguage);

  const SHARE_PLATFORMS = [
    { label: 'WhatsApp', bg: '#25d366', fn: () => onShareWhatsApp(article) },
    { label: 'Twitter',  bg: '#1da1f2', fn: () => onShareTwitter(article) },
    { label: 'Facebook', bg: '#1877f2', fn: () => onShareFacebook(article) },
  ];

  return (
    <Dialog open={!!article} onOpenChange={handleClose}>
      <DialogContent
        hideClose hideOverlay
        style={{ width: '100vw', maxWidth: '100vw', height: '100dvh', maxHeight: '100dvh', left: 0, top: 0, transform: 'none', padding: 0, overflow: 'hidden', zIndex: 900, border: 'none', borderRadius: 0, backgroundColor: surface, boxShadow: 'none', display: 'flex', flexDirection: 'column' }}
      >
        <DialogTitle style={SR_ONLY}>{article.title}</DialogTitle>
        <DialogDescription style={SR_ONLY}>{article.excerpt || `Article by ${article.authorName || 'KhabarON'}.`}</DialogDescription>

        {/* Header bar */}
        <div
          className="kn-modal-bar"
          style={{ borderBottom: `1px solid ${bdr}`, backgroundColor: dark ? 'rgba(20,22,34,0.92)' : 'rgba(255,255,255,0.92)', height: isMobileView ? '64px' : '72px', padding: isMobileView ? '0 16px' : '0 32px' }}
        >
          <div className="kn-modal-bar-left">
            <button onClick={handleClose} className="kn-modal-back" style={{ border: `1px solid ${bdr}`, color: T2, padding: isMobileView ? '8px 10px' : '9px 16px' }}>
              <ChevronRight style={{ width: '16px', height: '16px', transform: 'rotate(180deg)' }} />
              {!isMobileView && (selectedLanguage === 'hi' ? 'वापस' : 'Back')}
            </button>
            <div className="kn-modal-divider" style={{ backgroundColor: bdr }} />
            <div className="kn-modal-logo">
              <Image src="/khabaron-logo.jpeg" alt="KhabarON" width={isMobileView ? 100 : 140} height={isMobileView ? 34 : 46} priority style={{ objectFit: 'contain', display: 'block' }} />
            </div>
            {!isMobileView && (
              <>
                <div className="kn-modal-divider" style={{ backgroundColor: bdr }} />
                <span className="kn-modal-cat" style={{ color: catColor }}>{catLabel}</span>
              </>
            )}
          </div>
          <div className="kn-modal-bar-right">
            {!isMobileView && (
              <button onClick={() => onShareWhatsApp(article)} className="kn-modal-share" style={{ border: `1px solid ${bdr}`, color: T2 }}>
                <Share2 style={{ width: '15px', height: '15px' }} />
                {selectedLanguage === 'hi' ? 'शेयर' : 'Share'}
              </button>
            )}
            <button onClick={handleClose} className="kn-modal-close" style={{ backgroundColor: dark ? '#2a2f3e' : '#fff', color: dark ? '#e5e7eb' : '#111827', boxShadow: dark ? '0 2px 10px rgba(0,0,0,.5)' : '0 2px 10px rgba(0,0,0,.14)' }}>
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={contentRef} onScroll={handleScroll} className="kn-modal-scroll" style={{ backgroundColor: surface }}>
          {/* Reading progress */}
          <div className="kn-progress-track" style={{ backgroundColor: dark ? '#252E40' : '#E8EAED' }}>
            <div className="kn-progress-fill" style={{ width: `${scrollPct}%`, backgroundColor: ACCENT }} />
          </div>

          {/* Hero image */}
          <div className="kn-article-hero" style={{ height: isMobileView ? '220px' : '460px' }}>
            <img src={article.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'} alt={article.title} />
            <div className="kn-article-hero-grad" aria-hidden />
            <span className="kn-article-hero-badge" style={{ backgroundColor: catColor }}>{catLabel}</span>
          </div>

          {/* Body grid */}
          <div
            className="kn-article-body-grid"
            style={{ gridTemplateColumns: isMobileView ? '1fr' : 'minmax(0,1fr) minmax(0,760px) minmax(0,1fr)', padding: isMobileView ? '0' : '0 32px' }}
          >
            {!isMobileView && (
              <aside className="kn-article-ad-rail">
                <div className="kn-ad-sticky">
                  <p className="kn-ad-label" style={{ color: T3 }}>{selectedLanguage === 'hi' ? 'विज्ञापन' : 'Advertisement'}</p>
                  <ProgrammaticAd placement="article-side-left" size="300x600" />
                </div>
              </aside>
            )}

            <div className="kn-article-content" style={{ padding: isMobileView ? '20px 18px 28px' : '32px 12px 40px', backgroundColor: surface }}>
              <h1 style={{ fontSize: isMobileView ? `${26 * textScale}px` : `${38 * textScale}px`, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.015em', marginBottom: '20px', color: T1, fontFamily: selectedFont?.value }}>{article.title}</h1>
              {article.excerpt && (
                <p style={{ fontSize: isMobileView ? `${17 * textScale}px` : `${20 * textScale}px`, lineHeight: 1.5, color: T2, marginBottom: '24px', fontFamily: selectedFont?.value }}>{article.excerpt}</p>
              )}

              <div className="kn-article-meta" style={{ borderBottom: `1px solid ${bdr}`, marginBottom: '18px', paddingBottom: '16px' }}>
                <div className="kn-author-wrap">
                  <div className="kn-author-avatar" style={{ backgroundColor: ACCENT }}>
                    <User style={{ width: '13px', height: '13px', color: 'white' }} />
                  </div>
                  <span style={{ fontSize: `${13 * textScale}px`, fontWeight: 600, color: T2 }}>{article.authorName || 'KhabarON'}</span>
                </div>
                <span className="kn-meta-item" style={{ color: T3, fontSize: `${12 * textScale}px` }}>
                  <Clock style={{ width: '12px', height: '12px' }} />{formatDate?.(article.publishedAt)}
                </span>
                <span className="kn-meta-item" style={{ color: T3, fontSize: `${12 * textScale}px` }}>
                  <Eye style={{ width: '12px', height: '12px' }} />{article.views?.toLocaleString() || 0} views
                </span>
              </div>

              {article.tags?.length > 0 && (
                <div className="kn-article-tags">
                  {article.tags.map((tag, i) => { const name = typeof tag === 'string' ? tag : tag?.name || ''; if (!name) return null; return <span key={tag?.id || name || i} className="kn-article-tag" style={{ border: `1px solid ${bdr}`, color: T3, fontSize: `${12 * textScale}px` }}>#{name}</span>; })}
                </div>
              )}

              <NativeAd />

              <div className="news-article-body" style={{ fontSize: isMobileView ? `${18 * textScale}px` : `${20 * textScale}px`, lineHeight: 1.8, color: T2, fontFamily: selectedFont?.value, fontWeight: 400, wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: article.content }} />

              <div className="kn-share-section" style={{ borderTop: `1px solid ${bdr}` }}>
                <p className="kn-share-title" style={{ color: T3 }}>Share this article</p>
                <div className="kn-share-buttons">
                  {SHARE_PLATFORMS.map(s => (
                    <button key={s.label} onClick={s.fn} style={{ flex: isMobileView ? '1' : 'unset', minWidth: '120px', padding: '11px 18px', borderRadius: '12px', border: 'none', backgroundColor: s.bg, color: 'white', fontSize: `${13 * textScale}px`, fontWeight: 600, cursor: 'pointer' }}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {!isMobileView && (
              <aside className="kn-article-ad-rail-r">
                <div className="kn-ad-sticky">
                  <p className="kn-ad-label" style={{ color: T3 }}>{selectedLanguage === 'hi' ? 'विज्ञापन' : 'Advertisement'}</p>
                  <ProgrammaticAd placement="article-side-right" size="300x600" />
                  <div style={{ marginTop: '20px' }}><ProgrammaticAd placement="article-side-right-2" size="300x250" /></div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
