'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Flag, Trophy, Globe2, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { refreshIntervalForMatches, rateLimitMessage, isWithinUpcomingHubWindow, formatMatchDateTime } from '@/lib/cricket/matchStatus';
import { MATCH_STATES } from '@/lib/services/cricket/cricketConstants';
import { CRICKET_TIER } from '@/lib/cricket/matchPriority';
import { event as trackEvent } from '@/lib/gtag';
import MatchScoreCard from './MatchScoreCard';
import RelatedCricketNews from './RelatedCricketNews';

// Category/state sections are capped so a busy calendar (an IPL window with
// a full day of domestic cricket also live) can't turn the hub into an
// endless scroll — /cricket only ever needs to surface "enough to click
// into", not a complete fixture list.
const SECTION_LIMIT = 6;

function Section({ icon: Icon, title, matches, dark, isHindi, onOpen, T1, T3, bdr }) {
  if (!matches.length) return null;
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Icon size={18} color={T1} aria-hidden="true" />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: T1, margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 12, color: T3 }}>({matches.length})</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {matches.map((match) => (
          <MatchScoreCard key={match.id} match={match} dark={dark} isHindi={isHindi} onClick={() => onOpen(match)} />
        ))}
      </div>
    </section>
  );
}

// Sectioned /cricket hub — Live, India, IPL, International, Upcoming,
// Recent, then related news — rather than one flat tabbed list, so the page
// reads like a dedicated sports hub as the module covers more tournaments.
// Self-fetching/self-polling, same shape as MarketTicker/CricketWidget; all
// sections are derived client-side from one already tier-sorted, admin-
// filtered fetch (lib/cricket/matchPriority.js + cricketSettingsService) —
// no extra API calls per section.
export default function CricketSections({ dark, selectedLanguage }) {
  const router = useRouter();
  const isHindi = selectedLanguage === 'hi';
  const [matches, setMatches] = useState(null); // null = not loaded yet
  const [configured, setConfigured] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pollMs, setPollMs] = useState(refreshIntervalForMatches([]));
  const mountedRef = useRef(true);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/cricket/matches', { cache: 'no-store' });
      const data = await res.json();
      if (!mountedRef.current) return;
      if (!res.ok || !Array.isArray(data.matches)) throw new Error('Invalid cricket response');
      setMatches(data.matches);
      setConfigured(data.configured !== false);
      setEnabled(data.enabled !== false);
      setRateLimited(!!data.rateLimited);
      if (data.refreshIntervalMs) setPollMs(data.refreshIntervalMs);
      setFailed(false);
    } catch (error) {
      console.error(error);
      if (mountedRef.current) setFailed(true);
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

  const T1 = dark ? '#E8ECF0' : '#111827';
  const T2 = dark ? '#9BA5B4' : '#4B5563';
  const T3 = dark ? '#9BA5B4' : '#6B7280';
  const surface = dark ? '#161B27' : '#FFFFFF';
  const bdr = dark ? '#252E40' : '#E8EAED';

  const emptyBox = (text) => (
    <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 28, textAlign: 'center', color: T2 }}>
      {text}
    </div>
  );

  if (!configured) {
    return emptyBox(isHindi ? 'क्रिकेट स्कोर अभी कॉन्फ़िगर नहीं किए गए हैं।' : 'Cricket scores are not configured yet.');
  }

  if (!enabled) {
    return emptyBox(isHindi ? 'क्रिकेट सेक्शन फ़िलहाल बंद है।' : 'The cricket section is currently disabled.');
  }

  if (rateLimited && !matches?.length) {
    return emptyBox(rateLimitMessage(isHindi));
  }

  if (failed && !matches) {
    return emptyBox(isHindi ? 'लाइव क्रिकेट डेटा फिलहाल उपलब्ध नहीं है।' : 'Live data temporarily unavailable.');
  }

  if (!matches) {
    return emptyBox(isHindi ? 'लोड हो रहा है...' : 'Loading matches…');
  }

  const openMatch = (match) => {
    trackEvent({ action: 'match_opened', category: 'cricket', label: 'hub' });
    router.push(`/cricket/${match.id}`);
  };

  // Upcoming fixtures more than a few days out are hidden from the whole hub
  // (every section, not just "Upcoming Fixtures") — CricAPI's currentMatches
  // window can include fixtures well ahead, and a card for something a week
  // away read as clutter next to "what's on right now". Live and completed
  // matches are never affected (isWithinUpcomingHubWindow only filters the
  // UPCOMING state).
  const visibleMatches = matches.filter(isWithinUpcomingHubWindow);

  // Each match lands in exactly one section — the first it qualifies for, in
  // the order the sections are rendered below. Previously every filter ran
  // over the full list independently, so any match in a tier that has its own
  // section (i.e. anything but domestic) rendered twice: once under Live/
  // Upcoming/Recent and again under India/IPL/International. With five
  // matches that meant ten cards.
  //
  // Consequence worth knowing: "Upcoming Fixtures" and "Recent Results" are
  // now the catch-all for tiers with no section of their own, so an upcoming
  // India match sits under "India Matches" (alongside that team's recent
  // results) rather than under "Upcoming Fixtures". Day-range sub-filtering
  // for those two sections is already a Phase 2 item in docs/cricket-roadmap.md.
  const unclaimed = new Set(visibleMatches);
  const claim = (predicate, limit = SECTION_LIMIT) => {
    const taken = [];
    for (const match of visibleMatches) {
      if (taken.length >= limit) break;
      if (!unclaimed.has(match) || !predicate(match)) continue;
      unclaimed.delete(match);
      taken.push(match);
    }
    return taken;
  };

  // Live is deliberately uncapped: "what's on right now" is the one thing a
  // reader came for, and SECTION_LIMIT exists to stop a busy calendar
  // becoming an endless scroll, not to hide live cricket.
  const live = claim((m) => m.matchState === MATCH_STATES.LIVE, Infinity);
  const india = claim((m) => m.tier === CRICKET_TIER.INDIA);
  const ipl = claim((m) => m.tier === CRICKET_TIER.IPL);
  const international = claim((m) => m.tier === CRICKET_TIER.ICC || m.tier === CRICKET_TIER.INTERNATIONAL);
  const upcoming = claim((m) => m.matchState === MATCH_STATES.UPCOMING);
  const recent = claim((m) => m.matchState === MATCH_STATES.COMPLETED);

  const nothingToShow = ![live, india, ipl, international, upcoming, recent].some((s) => s.length);

  // When the hub has nothing to show, tell the reader whether that's
  // because there's genuinely no cricket on the calendar, or because the
  // next fixture is just further out than the hub bothers displaying — in
  // the latter case, name it rather than leaving a bare "nothing here".
  const nextMatch = nothingToShow
    ? matches
      .filter((m) => m.matchState === MATCH_STATES.UPCOMING && m.dateTimeGMT && !isWithinUpcomingHubWindow(m))
      .sort((a, b) => new Date(a.dateTimeGMT) - new Date(b.dateTimeGMT))[0] || null
    : null;

  const sectionProps = { dark, isHindi, onOpen: openMatch, T1, T3, bdr };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* #b45309 measures 3.43:1 on the dark surface (#161B27) — under AA. It
          was the one amber in this module without a dark variant; the
          stale-data note already uses #f59e0b, 8:1 there and 4.6:1 on white. */}
      {rateLimited && matches.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '10px 14px', fontSize: 13, color: dark ? '#f59e0b' : '#b45309' }}>
          <AlertTriangle size={15} aria-hidden="true" />
          {rateLimitMessage(isHindi)}
        </div>
      )}

      {nothingToShow && (
        <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 28, textAlign: 'center', color: T2 }}>
          <div>{isHindi ? 'फ़िलहाल कोई मैच निर्धारित नहीं है।' : 'No matches are scheduled right now.'}</div>
          {nextMatch ? (
            <button
              type="button"
              onClick={() => openMatch(nextMatch)}
              style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: T1, textDecoration: 'underline', padding: 0 }}
            >
              {isHindi ? 'अगला मैच: ' : 'Next up: '}
              {(nextMatch.teams || []).map((t) => t.name).filter(Boolean).join(' vs ') || nextMatch.name}
              {' — '}{formatMatchDateTime(nextMatch.dateTimeGMT, isHindi)}
            </button>
          ) : (
            <div style={{ marginTop: 4, fontSize: 13 }}>{isHindi ? 'जल्द ही वापस देखें।' : 'Check back soon.'}</div>
          )}
        </div>
      )}

      <Section icon={Radio} title={isHindi ? 'लाइव मैच' : 'Live Matches'} matches={live} {...sectionProps} />
      <Section icon={Flag} title={isHindi ? 'भारत के मैच' : 'India Matches'} matches={india} {...sectionProps} />
      <Section icon={Trophy} title="IPL" matches={ipl} {...sectionProps} />
      <Section icon={Globe2} title={isHindi ? 'अंतरराष्ट्रीय' : 'International'} matches={international} {...sectionProps} />
      <Section icon={Calendar} title={isHindi ? 'आगामी मैच' : 'Upcoming Fixtures'} matches={upcoming} {...sectionProps} />
      <Section icon={CheckCircle2} title={isHindi ? 'हाल के परिणाम' : 'Recent Results'} matches={recent} {...sectionProps} />

      <RelatedCricketNews dark={dark} selectedLanguage={selectedLanguage} />
    </div>
  );
}
