'use client';
import React, { useState, useEffect, useRef, useContext } from 'react';
import { DarkCtx } from '@/lib/news-contexts';
import { getSessionId } from '@/lib/news-utils';

export const ProgrammaticAd = ({ placement, size = '728x90' }) => {
  const dark = useContext(DarkCtx);
  const insRef    = useRef(null);
  const pushedRef = useRef(false);
  const [hasAd, setHasAd] = useState(false);

  useEffect(() => {
    fetch('/api/ads/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: `prog_${placement}_${Date.now()}`, adType: 'programmatic', placement, sessionId: getSessionId(), estimatedRevenue: 0.002 }),
    }).catch(() => {});
  }, [placement]);

  useEffect(() => {
    if (pushedRef.current) return;
    try { if (window.adsbygoogle) { (window.adsbygoogle = window.adsbygoogle || []).push({}); pushedRef.current = true; } } catch {}
    let tries = 0;
    const id = setInterval(() => {
      tries++;
      const status = insRef.current?.getAttribute('data-ad-status');
      if (status === 'filled') { setHasAd(true); clearInterval(id); }
      else if (status === 'unfilled' || tries > 6) clearInterval(id);
     
    }, 500);
    return () => clearInterval(id);
  }, []);

  const [, height] = size.split('x').map(Number);
  return (
    <div style={{ height: hasAd ? height : 0, width: '100%', backgroundColor: hasAd ? (dark ? '#1e2130' : '#F5F6F8') : 'transparent', borderRadius: '8px', overflow: 'hidden', transition: 'height 0.2s ease' }}>
      <ins ref={insRef} className="adsbygoogle" style={{ display: 'block', width: '100%', height: '100%' }} data-ad-client="ca-pub-1008647598112103" data-ad-slot="YOUR_AD_SLOT_ID" data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
};

export const NativeAd = () => {
  const dark = useContext(DarkCtx);
  const insRef    = useRef(null);
  const pushedRef = useRef(false);
  const [hasAd, setHasAd] = useState(false);

  useEffect(() => {
    fetch('/api/ads/impression', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: `native_${Date.now()}`, adType: 'native', placement: 'in-article', sessionId: getSessionId(), estimatedRevenue: 0.005 }) }).catch(() => {});
  }, []);

  useEffect(() => {
    if (pushedRef.current) return;
    try { if (window.adsbygoogle) { (window.adsbygoogle = window.adsbygoogle || []).push({}); pushedRef.current = true; } } catch {}
    let tries = 0;
    const id = setInterval(() => {
      tries++;
      const status = insRef.current?.getAttribute('data-ad-status');
      if (status === 'filled') { setHasAd(true); clearInterval(id); }
      else if (status === 'unfilled' || tries > 6) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ width: '100%', marginBottom: hasAd ? '8px' : 0, backgroundColor: hasAd ? (dark ? '#1e2130' : '#F5F6F8') : 'transparent', borderRadius: '12px', overflow: 'hidden' }}>
      <ins ref={insRef} className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-1008647598112103" data-ad-slot="YOUR_AD_SLOT_ID" data-ad-format="fluid" data-ad-layout="in-article" />
    </div>
  );
};
