'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// Shared by HomeClient.js and app/live/page.js so the pause/resume/navigate
// behavior only has to be implemented once. The scrolling itself stays a
// pure CSS `@keyframes marquee` animation (app/globals.css) — pausing just
// toggles `animation-play-state`, which freezes and resumes the animation
// at its current position instead of resetting it, so no manual transform
// tracking is needed.
export default function BreakingTicker({ breakingNews, dark, onArticleClick }) {
  const [paused, setPaused] = useState(false);
  const tickerRef = useRef(null);

  const marqueeItems = useMemo(() => {
    if (!breakingNews || breakingNews.length === 0) return [];
    const items = [];
    breakingNews.forEach((item) => items.push({ key: `${item.id}-a`, id: item.id, title: item.title }));
    breakingNews.forEach((item) => items.push({ key: `${item.id}-b`, id: item.id, title: item.title }));
    return items;
  }, [breakingNews]);

  const marqueeDuration = Math.max(20, (breakingNews?.length || 0) * 6); // seconds

  // Resume the instant a click lands anywhere outside the ticker — same
  // outside-click pattern already used for share menus elsewhere in the app.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (tickerRef.current && !tickerRef.current.contains(event.target)) {
        setPaused(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!breakingNews || breakingNews.length === 0) return null;

  return (
    <div
      ref={tickerRef}
      className="kn-breaking-ticker"
      onClick={() => setPaused(true)}
      style={{
        height: '46px',
        background: dark ? '#150e0e' : '#FFF5F5',
        borderTop: `1px solid ${dark ? '#3a1f1f' : '#FED7D7'}`,
        borderBottom: `1px solid ${dark ? '#3a1f1f' : '#FED7D7'}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ maxWidth: '1300px', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center' }}>
        {/* Breaking Label */}
        <div className="kn-breaking-label" style={{ minWidth: '105px', height: '24px', background: '#D72638', color: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
          ● BREAKING
        </div>
        {/* News Scroll */}
        <div className="kn-marquee-wrap" style={{ flex: 1, overflow: 'hidden', marginLeft: '20px', marginRight: '10px' }}>
          <div
            className="animate-marquee"
            style={{ animationDuration: `${marqueeDuration}s`, animationPlayState: paused ? 'paused' : 'running' }}
          >
            <div className="kn-breaking-track">
              {marqueeItems.map((item) => (
                <span
                  key={item.key}
                  className="kn-breaking-item"
                  style={{ cursor: 'pointer' }}
                  onClick={(event) => {
                    // Stop the ticker and go straight to the article — no
                    // need to also let the container's own onClick (which
                    // would just pause) run afterward.
                    event.stopPropagation();
                    setPaused(true);
                    onArticleClick?.(item);
                  }}
                >
                  {item.title}
                  <span className="kn-breaking-separator">◆</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
