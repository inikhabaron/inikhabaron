'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react';

const REFRESH_MS = 30000;

// Reusable live ticker for Sensex/Nifty (and future instruments — see
// lib/services/market/marketService.js). Self-fetching and self-polling so
// it can be dropped onto any page (homepage strip today, a sidebar widget
// or the /market page later) without prop-drilling data from a parent.
export default function MarketTicker({ dark, selectedLanguage, ids, refreshIntervalMs = REFRESH_MS }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(null); // null = not loaded yet
  const [failed, setFailed] = useState(false);
  const mountedRef = useRef(true);

  const fetchQuotes = useCallback(async () => {
    try {
      const query = ids?.length ? `?ids=${ids.join(',')}` : '';
      const res = await fetch(`/api/market/quotes${query}`, { cache: 'no-store' });
      const data = await res.json();
      if (!mountedRef.current) return;
      if (!res.ok || !Array.isArray(data.quotes)) throw new Error('Invalid market response');
      setQuotes(data.quotes);
      setFailed(false);
    } catch (error) {
      console.error(error);
      if (mountedRef.current) setFailed(true);
    }
  }, [ids]);

  useEffect(() => {
    mountedRef.current = true;
    fetchQuotes();
    const interval = setInterval(fetchQuotes, refreshIntervalMs);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [fetchQuotes, refreshIntervalMs]);

  const isHindi = selectedLanguage === 'hi';
  const bg = dark ? '#161B27' : '#F8FAFC';
  const bdr = dark ? '#252E40' : '#E8EAED';

  // Nothing has ever loaded and the last attempt failed — graceful fallback.
  if (failed && !quotes) {
    return (
      <div className="kn-market-ticker kn-market-ticker-fallback" style={{ backgroundColor: bg, borderBottomColor: bdr, color: dark ? '#9BA5B4' : '#6B7280' }}>
        {isHindi ? 'बाज़ार डेटा फिलहाल उपलब्ध नहीं है' : 'Market data is temporarily unavailable'}
      </div>
    );
  }

  // First paint, awaiting the initial fetch.
  if (!quotes) {
    return (
      <div className="kn-market-ticker" style={{ backgroundColor: bg, borderBottomColor: bdr }}>
        <div className="kn-market-ticker-inner">
          {[0, 1].map((i) => (
            <div key={i} className="kn-market-item kn-market-skeleton">
              <span className="kn-market-skel-line" style={{ background: bdr, width: 70 }} />
              <span className="kn-market-skel-line" style={{ background: bdr, width: 50 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="kn-market-ticker" style={{ backgroundColor: bg, borderBottomColor: bdr }}>
      <div className="kn-market-ticker-inner">
        <span className="kn-market-label" style={{ color: dark ? '#9BA5B4' : '#6B7280' }}>
          <TrendingUp size={13} aria-hidden="true" />
          {isHindi ? 'बाज़ार' : 'Markets'}
        </span>
        {quotes.map((q) => {
          const directionWord = q.direction === 'up' ? (isHindi ? 'ऊपर' : 'up') : q.direction === 'down' ? (isHindi ? 'नीचे' : 'down') : (isHindi ? 'अपरिवर्तित' : 'unchanged');
          const ariaLabel = q.available
            ? `${q.name}: ${q.value.toLocaleString('en-IN')}, ${directionWord} ${Math.abs(q.change).toFixed(2)} points, ${q.changePercent.toFixed(2)}%. ${isHindi ? 'अधिक जानकारी के लिए खोलें' : 'Open for more detail'}.`
            : `${q.name}: ${isHindi ? 'डेटा अनुपलब्ध' : 'data unavailable'}`;
          return (
            <button
              key={q.id}
              className="kn-market-item"
              onClick={() => router.push(`/market?index=${q.id}`)}
              aria-label={ariaLabel}
              title={q.stale ? (isHindi ? 'नवीनतम डेटा उपलब्ध नहीं — अंतिम ज्ञात मान दिखाया गया' : 'Live refresh failed — showing last known value') : undefined}
            >
              <span className="kn-market-name" style={{ color: dark ? '#E8ECF0' : '#111827' }} aria-hidden="true">{q.shortName || q.name}</span>
              {q.available ? (
                <>
                  <span className="kn-market-value" style={{ color: dark ? '#E8ECF0' : '#111827' }} aria-hidden="true">
                    {q.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <span className={`kn-market-change kn-market-${q.direction}`} aria-hidden="true">
                    {q.direction === 'up' ? <ArrowUp size={12} /> : q.direction === 'down' ? <ArrowDown size={12} /> : <Minus size={12} />}
                    {Math.abs(q.change).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%)
                  </span>
                  {q.stale && <span className="kn-market-stale-dot" aria-hidden="true" />}
                </>
              ) : (
                <span className="kn-market-unavailable" style={{ color: dark ? '#6B7280' : '#9CA3AF' }} aria-hidden="true">
                  {isHindi ? 'अनुपलब्ध' : 'unavailable'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
