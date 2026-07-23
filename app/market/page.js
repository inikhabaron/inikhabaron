'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUp, ArrowDown, Minus, LineChart } from 'lucide-react';

import PublicPageLayout from '@/components/layout/PublicPageLayout';
import useSiteChrome from '@/hooks/useSiteChrome';
import { ACCENT } from '@/lib/news-utils';

// Dedicated Market page — reachable by clicking any index in MarketTicker
// (?index=<id> highlights that card). The same /api/market/quotes route
// already supports the currently-disabled instruments (marketConstants.js)
// and richer per-quote fields, so charting and the rest of INSTRUMENTS can
// land here later without changing this page's shape.
function formatIst(epochMs, isHindi) {
  if (!epochMs) return null;
  return new Date(epochMs).toLocaleString(isHindi ? 'hi-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// Indian exchanges only report "REGULAR" during trading hours — PRE/POST/
// CLOSED all mean "can't trade right now", so they're collapsed into one
// Closed badge rather than surfacing Yahoo's raw session-state vocabulary.
function isMarketOpen(marketState) {
  return marketState === 'REGULAR';
}

function MarketPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlighted = searchParams.get('index');
  const chrome = useSiteChrome();
  const { dark, selectedLanguage, surface, bdr, T1, T2, T3 } = chrome;
  const isHindi = selectedLanguage === 'hi';

  const [quotes, setQuotes] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/market/quotes', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (!res.ok || !Array.isArray(data.quotes)) throw new Error('bad response');
        setQuotes(data.quotes);
        setError(false);
      } catch (err) {
        if (active) setError(true);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <PublicPageLayout chrome={chrome}>
      <div className="kn-content-wrap" style={{ padding: '28px 5px 70px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <LineChart size={22} color={ACCENT} aria-hidden="true" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T1, margin: 0 }}>
            {isHindi ? 'बाज़ार' : 'Markets'}
          </h1>
        </div>

        {error && !quotes && (
          <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 28, textAlign: 'center', color: T2 }}>
            {isHindi ? 'बाज़ार डेटा फिलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।' : 'Market data is temporarily unavailable. Please try again shortly.'}
          </div>
        )}

        {!error && !quotes && (
          <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 28, textAlign: 'center', color: T2 }}>
            {isHindi ? 'लोड हो रहा है...' : 'Loading market data…'}
          </div>
        )}

        {quotes && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {quotes.map((q) => {
              const isSelected = q.id === highlighted;
              const color = q.direction === 'up' ? '#15803D' : q.direction === 'down' ? '#DC2626' : T2;
              const Arrow = q.direction === 'up' ? ArrowUp : q.direction === 'down' ? ArrowDown : Minus;
              return (
                <div
                  key={q.id}
                  style={{
                    borderRadius: 16,
                    background: surface,
                    border: `1px solid ${isSelected ? ACCENT : bdr}`,
                    boxShadow: isSelected ? `0 0 0 3px ${dark ? 'rgba(59,175,218,0.18)' : 'rgba(21,42,88,0.1)'}` : 'none',
                    padding: 22,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {q.name}
                    </span>
                    {q.available && q.marketState && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '2px 8px', borderRadius: 20,
                        color: isMarketOpen(q.marketState) ? '#065f46' : '#6b7280',
                        background: isMarketOpen(q.marketState) ? '#d1fae5' : (dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'),
                      }}>
                        {isMarketOpen(q.marketState) ? (isHindi ? 'खुला' : 'Open') : (isHindi ? 'बंद' : 'Closed')}
                      </span>
                    )}
                  </div>
                  {q.available ? (
                    <>
                      <div style={{ fontSize: 30, fontWeight: 800, color: T1, marginBottom: 6 }}>
                        {q.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontWeight: 600, fontSize: 15, marginBottom: 14 }}>
                        <Arrow size={16} />
                        {Math.abs(q.change).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        {' '}({q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%)
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: T2, borderTop: `1px solid ${bdr}`, paddingTop: 12 }}>
                        <div>
                          <div style={{ color: T3, marginBottom: 2 }}>{isHindi ? 'पिछला बंद' : 'Previous Close'}</div>
                          {q.previousClose != null ? q.previousClose.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
                        </div>
                        <div>
                          <div style={{ color: T3, marginBottom: 2 }}>{isHindi ? 'दिन की ऊँचाई' : "Day High"}</div>
                          {q.dayHigh != null ? q.dayHigh.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
                        </div>
                        <div>
                          <div style={{ color: T3, marginBottom: 2 }}>{isHindi ? 'दिन की निचली सीमा' : 'Day Low'}</div>
                          {q.dayLow != null ? q.dayLow.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
                        </div>
                        <div>
                          <div style={{ color: T3, marginBottom: 2 }}>{isHindi ? 'अंतिम अपडेट (IST)' : 'Last Updated (IST)'}</div>
                          {formatIst(q.marketTime, isHindi) || '—'}
                        </div>
                      </div>

                      {q.stale && (
                        <div style={{ marginTop: 10, fontSize: 12, color: '#F59E0B' }}>
                          {isHindi ? 'अंतिम ज्ञात मान दिखाया जा रहा है' : 'Showing last known value'}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: T3, fontStyle: 'italic' }}>{isHindi ? 'डेटा अनुपलब्ध' : 'Data unavailable'}</div>
                  )}

                  <div
                    style={{
                      marginTop: 18, height: 120, borderRadius: 10,
                      background: dark ? 'rgba(255,255,255,0.03)' : '#F6F7F9',
                      border: `1px dashed ${bdr}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: T3, fontSize: 12,
                    }}
                  >
                    {isHindi ? 'चार्ट जल्द आ रहा है' : 'Chart coming soon'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 28, fontSize: 12, color: T3 }}>
          {isHindi
            ? 'आगे जुड़ने वाले: बैंक निफ्टी, सोना, चांदी, USD/INR, कच्चा तेल, क्रिप्टोकरेंसी'
            : 'Coming soon: Bank Nifty, Gold, Silver, USD/INR, Crude Oil, Cryptocurrency'}
        </div>
      </div>
    </PublicPageLayout>
  );
}

export default function MarketPage() {
  return (
    <Suspense fallback={null}>
      <MarketPageContent />
    </Suspense>
  );
}
