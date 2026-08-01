'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { refreshIntervalForMatches, pickFeaturedMatch } from '@/lib/cricket/matchStatus';
import { MATCH_STATES } from '@/lib/services/cricket/cricketConstants';
import { event as trackEvent } from '@/lib/gtag';
import MatchScoreCard from './MatchScoreCard';

const HEADER_BY_STATE = {
  [MATCH_STATES.LIVE]: { icon: Radio, en: 'Live Cricket', hi: 'लाइव क्रिकेट' },
  [MATCH_STATES.UPCOMING]: { icon: Clock, en: 'Upcoming Match', hi: 'आगामी मैच' },
  [MATCH_STATES.COMPLETED]: { icon: CheckCircle2, en: 'Recent Result', hi: 'हाल का परिणाम' },
};

// Compact homepage widget. Always shows *something* rather than disappearing
// between matches: a live match if one exists, otherwise the soonest
// upcoming match, otherwise the most recently completed one
// (lib/cricket/matchStatus.js#pickFeaturedMatch) — the section only truly
// vanishes when there is no cricket data at all (module off, no key, or a
// dead calendar with nothing live/upcoming/completed). The header label and
// icon track whichever state is actually being shown, so "Live Cricket"
// never gets stuck labeling a match that finished hours ago.
export default function CricketWidget({ dark, selectedLanguage }) {
  const router = useRouter();
  const isHindi = selectedLanguage === 'hi';
  const [matches, setMatches] = useState(null);
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [widgetSize, setWidgetSize] = useState('compact');
  const [pollMs, setPollMs] = useState(refreshIntervalForMatches([]));
  const mountedRef = useRef(true);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/cricket/matches', { cache: 'no-store' });
      const data = await res.json();
      if (!mountedRef.current) return;
      if (!res.ok || !Array.isArray(data.matches)) throw new Error('Invalid cricket response');
      setMatches(data.matches);
      setWidgetEnabled(data.widget?.homepageWidgetEnabled !== false);
      setWidgetSize(data.widget?.homepageWidgetSize || 'compact');
      if (data.refreshIntervalMs) setPollMs(data.refreshIntervalMs);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  useEffect(() => {
    const interval = setInterval(fetchMatches, pollMs);
    return () => clearInterval(interval);
  }, [fetchMatches, pollMs]);

  const maxMatches = widgetSize === 'expanded' ? 3 : 2;
  const liveMatches = (matches || []).filter((m) => m.matchState === MATCH_STATES.LIVE).slice(0, maxMatches);
  const featured = pickFeaturedMatch(matches || []);

  // Live: show up to maxMatches live cards (richer than a single match).
  // Otherwise: exactly one card — the best upcoming/completed match, per
  // pickFeaturedMatch. Nothing to show at all only when there's truly no
  // cricket data (module off, no key, or an empty calendar).
  const cardsToShow = liveMatches.length ? liveMatches : featured ? [featured] : [];
  if (!widgetEnabled || !cardsToShow.length) return null;

  const headerState = cardsToShow[0].matchState;
  const header = HEADER_BY_STATE[headerState] || HEADER_BY_STATE[MATCH_STATES.LIVE];
  const HeaderIcon = header.icon;

  const T1 = dark ? '#E8ECF0' : '#111827';
  const T3 = dark ? '#9BA5B4' : '#6B7280';
  const bg = dark ? '#161B27' : '#F8FAFC';
  const bdr = dark ? '#252E40' : '#E8EAED';

  return (
    <div style={{ background: bg, borderBottom: `1px solid ${bdr}`, padding: '12px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <HeaderIcon size={13} aria-hidden="true" />
            {isHindi ? header.hi : header.en}
          </span>
          <button
            type="button"
            onClick={() => {
              trackEvent({ action: 'view_all_scores_click', category: 'cricket', label: 'homepage_widget' });
              router.push('/cricket');
            }}
            // Negative margin keeps the label optically aligned with the row
            // while the padding gives it a real tap target — it measured
            // 85x18 on mobile, well under the 44px minimum, and it was the
            // only route into /cricket at the time.
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: T1, padding: '13px 8px', margin: '-13px -8px' }}
          >
            {isHindi ? 'सभी स्कोर देखें' : 'View All Scores'}
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>
        {/* auto-fill, not auto-fit: auto-fit collapses the empty tracks, so a
            single card stretched to the full 1200px container with ~990px of
            dead space between team name and score (731px / 520px at tablet).
            auto-fill keeps the empty tracks, so one card occupies one column
            width and the row simply isn't full. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {cardsToShow.map((match) => (
            <MatchScoreCard
              key={match.id}
              match={match}
              dark={dark}
              isHindi={isHindi}
              compact={widgetSize !== 'expanded'}
              onClick={() => {
                trackEvent({ action: 'match_opened', category: 'cricket', label: 'homepage_widget' });
                router.push(`/cricket/${match.id}`);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
