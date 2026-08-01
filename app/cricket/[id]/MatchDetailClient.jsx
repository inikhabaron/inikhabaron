'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Link2, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import PublicPageLayout from '@/components/layout/PublicPageLayout';
import useSiteChrome from '@/hooks/useSiteChrome';
import { event as trackEvent } from '@/lib/gtag';
import { matchStateLabel, matchStateColors, refreshIntervalForMatch, rateLimitMessage } from '@/lib/cricket/matchStatus';
import { MATCH_STATES } from '@/lib/services/cricket/cricketConstants';
import RelatedCricketNews from '@/components/cricket/RelatedCricketNews';

function formatScore(score, isHindi) {
  if (!score || score.runs == null) return isHindi ? 'बल्लेबाजी बाकी' : 'Yet to bat';
  const overs = score.overs != null ? ` (${score.overs} ov)` : '';
  const wickets = score.wickets != null ? `/${score.wickets}` : '';
  return `${score.runs}${wickets}${overs}`;
}

// Compact "TeamA 248/4 (42.3) vs TeamB 245" line for share text — falls back
// to just the team names when neither side has batted yet.
function shareScoreLine(match) {
  const withScores = match.teams.filter((t) => t.score?.runs != null);
  const parts = (withScores.length ? withScores : match.teams).map((t) => {
    const scoreText = t.score?.runs != null ? ` ${formatScore(t.score, false)}` : '';
    return `${t.name}${scoreText}`;
  });
  return parts.join(' vs ');
}

function ShareRow({ match, T2, dark }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = `${shareScoreLine(match)}${match.status ? ` — ${match.status}` : ''}`;

  const share = (label, action) => {
    trackEvent({ action: 'share_click', category: 'cricket_match', label });
    action();
  };

  const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#fff' };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${dark ? '#252E40' : '#E8EAED'}` }}>
      <button
        type="button"
        style={{ ...btnBase, background: dark ? 'rgba(255,255,255,0.08)' : '#F3F4F6', color: T2 }}
        onClick={() => share('copy_link', async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch { /* clipboard unavailable — no-op */ }
        })}
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
        {copied ? 'Copied' : 'Copy Link'}
      </button>
      <button
        type="button"
        style={{ ...btnBase, background: '#25D366' }}
        onClick={() => share('whatsapp', () => window.open(`https://wa.me/?text=${encodeURIComponent(`*${text}*\n\n${url}`)}`, '_blank'))}
      >
        WhatsApp
      </button>
      <button
        type="button"
        style={{ ...btnBase, background: '#1DA1F2' }}
        onClick={() => share('twitter', () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank'))}
      >
        X / Twitter
      </button>
      <button
        type="button"
        style={{ ...btnBase, background: '#1877F2' }}
        onClick={() => share('facebook', () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'))}
      >
        Facebook
      </button>
    </div>
  );
}

// "12 (b 2, lb 3, w 5, nb 1)" — omits any component the feed didn't send
// rather than printing zeroes it never reported.
function extrasLine(extras, isHindi) {
  if (!extras) return null;
  const parts = [
    [isHindi ? 'बा' : 'b', extras.byes],
    [isHindi ? 'लेबा' : 'lb', extras.legByes],
    [isHindi ? 'वा' : 'w', extras.wides],
    [isHindi ? 'नो' : 'nb', extras.noBalls],
    [isHindi ? 'पे' : 'p', extras.penalty],
  ].filter(([, value]) => Number.isFinite(value)).map(([label, value]) => `${label} ${value}`);

  const total = Number.isFinite(extras.total) ? extras.total : null;
  if (total === null && !parts.length) return null;
  return `${total ?? ''}${parts.length ? ` (${parts.join(', ')})` : ''}`.trim();
}

function totalsLine(totals) {
  if (!totals) return null;
  const runs = Number.isFinite(totals.runs) ? totals.runs : null;
  if (runs === null) return null;
  const wickets = Number.isFinite(totals.wickets) ? `/${totals.wickets}` : '';
  const overs = Number.isFinite(totals.overs) ? ` (${totals.overs} ov)` : '';
  return `${runs}${wickets}${overs}`;
}

function InningsTable({ innings, dark, isHindi, bdr, T1, T2, T3 }) {
  const th = { textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' };
  // No nowrap on the cell itself — the batter column carries a dismissal
  // sub-line ("run out (Kayleen Green/Mekelaye Mwatile)") and forcing that
  // onto one line was what pushed the table ~100px past a 320px phone
  // viewport, hiding the R/B/4s/6s/SR columns behind a sideways scroll.
  // Numeric cells keep nowrap via `tdNum`.
  const td = { padding: '6px 10px', fontSize: 13, color: T1 };
  const tdNum = { ...td, textAlign: 'right', whiteSpace: 'nowrap' };
  const thNum = { ...th, textAlign: 'right', textTransform: 'none' };

  const extras = extrasLine(innings.extras, isHindi);
  const total = totalsLine(innings.totals);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T1, margin: 0 }}>{innings.name}</h3>
        {total && (
          <span style={{ fontSize: 14, fontWeight: 800, color: T1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{total}</span>
        )}
      </div>

      {innings.batting.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${bdr}` }}>
                <th style={th}>{isHindi ? 'बल्लेबाज़' : 'Batter'}</th>
                <th style={thNum}>R</th>
                <th style={thNum}>B</th>
                {/* textTransform is dropped for these: the column is "4s"/"6s"
                    in every scorecard convention, and uppercasing rendered
                    them as "4S"/"6S". */}
                <th style={thNum}>4s</th>
                <th style={thNum}>6s</th>
                <th style={thNum}>SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.batting.map((b, i) => (
                <tr key={`${b.name}-${i}`} style={{ borderBottom: `1px solid ${bdr}` }}>
                  <td style={td}>
                    {b.name}
                    {b.dismissal && <div style={{ fontSize: 11, color: T3 }}>{b.dismissal}</div>}
                  </td>
                  <td style={{ ...tdNum, fontWeight: 700 }}>{b.runs ?? '—'}</td>
                  <td style={tdNum}>{b.balls ?? '—'}</td>
                  <td style={tdNum}>{b.fours ?? '—'}</td>
                  <td style={tdNum}>{b.sixes ?? '—'}</td>
                  <td style={tdNum}>{b.strikeRate ?? '—'}</td>
                </tr>
              ))}
              {extras && (
                <tr>
                  <td style={{ ...td, color: T2 }}>{isHindi ? 'अतिरिक्त' : 'Extras'}</td>
                  <td style={{ ...tdNum, color: T2 }} colSpan={5}>{extras}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {innings.bowling.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${bdr}` }}>
                <th style={th}>{isHindi ? 'गेंदबाज़' : 'Bowler'}</th>
                <th style={thNum}>O</th>
                <th style={thNum}>M</th>
                <th style={thNum}>R</th>
                <th style={thNum}>W</th>
                <th style={thNum}>Econ</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowling.map((b, i) => (
                <tr key={`${b.name}-${i}`} style={{ borderBottom: `1px solid ${bdr}` }}>
                  <td style={td}>{b.name}</td>
                  <td style={tdNum}>{b.overs ?? '—'}</td>
                  <td style={tdNum}>{b.maidens ?? '—'}</td>
                  <td style={tdNum}>{b.runs ?? '—'}</td>
                  <td style={{ ...tdNum, fontWeight: 700 }}>{b.wickets ?? '—'}</td>
                  <td style={tdNum}>{b.economy ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MatchDetailClient({ matchId, initialMatch }) {
  const chrome = useSiteChrome();
  const { dark, selectedLanguage, surface, bdr, T1, T2, T3 } = chrome;
  const isHindi = selectedLanguage === 'hi';

  const [match, setMatch] = useState(initialMatch);
  const [configured, setConfigured] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pollMs, setPollMs] = useState(refreshIntervalForMatch(initialMatch));
  const mountedRef = useRef(true);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/cricket/matches/${matchId}`, { cache: 'no-store' });
      const data = await res.json();
      if (!mountedRef.current) return;
      setConfigured(data.configured !== false);
      setEnabled(data.enabled !== false);
      setRateLimited(!!data.rateLimited);
      if (data.refreshIntervalMs) setPollMs(data.refreshIntervalMs);
      if (!res.ok || !data.match) {
        setFailed(true);
        return;
      }
      setMatch(data.match);
      setFailed(false);
    } catch (error) {
      console.error(error);
      if (mountedRef.current) setFailed(true);
    }
  }, [matchId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Skip the immediate re-fetch when SSR already seeded a match — the first
  // poll tick will pick up any change instead of doubling the initial load.
  useEffect(() => {
    if (!initialMatch) fetchMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchMatch, pollMs);
    return () => clearInterval(interval);
  }, [fetchMatch, pollMs]);

  const infoBox = (text) => (
    <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 28, textAlign: 'center', color: T2 }}>
      {text}
    </div>
  );

  let body;
  if (!configured) {
    body = infoBox(isHindi ? 'क्रिकेट स्कोर अभी कॉन्फ़िगर नहीं किए गए हैं।' : 'Cricket scores are not configured yet.');
  } else if (!enabled) {
    body = infoBox(isHindi ? 'क्रिकेट सेक्शन फ़िलहाल बंद है।' : 'The cricket section is currently disabled.');
  } else if (!match && rateLimited) {
    body = infoBox(rateLimitMessage(isHindi));
  } else if (!match && failed) {
    body = infoBox(isHindi ? 'यह मैच फिलहाल उपलब्ध नहीं है।' : 'This match is temporarily unavailable.');
  } else if (!match) {
    body = infoBox(isHindi ? 'लोड हो रहा है...' : 'Loading match…');
  } else {
    const isLive = match.matchState === MATCH_STATES.LIVE;
    const stateColors = matchStateColors(match.matchState, dark);
    body = (
      <>
        <div style={{ borderRadius: 16, background: surface, border: `1px solid ${isLive ? '#ef4444' : bdr}`, padding: 22, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            {match.matchType && (
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 20, background: dark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', color: T2 }}>
                {match.matchType}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 20, background: stateColors.bg, color: stateColors.color }}>
              {matchStateLabel(match.matchState, isHindi)}
            </span>
            {match.name && (
              <span style={{ fontSize: 12, color: T3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '1 1 auto' }}>
                {match.name}
              </span>
            )}
          </div>

          {match.teams.map((team) => (
            <div key={team.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {team.image && (
                  <img src={team.image} alt="" width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 18, fontWeight: 800, color: T1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: T1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatScore(team.score, isHindi)}</span>
            </div>
          ))}

          {match.status && <div style={{ marginTop: 10, fontSize: 14, color: T2 }}>{match.status}</div>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${bdr}`, fontSize: 12, color: T3 }}>
            {match.venue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} aria-hidden="true" />
                {match.venue}
              </span>
            )}
            {match.tossWinner && (
              <span>
                {isHindi ? 'टॉस: ' : 'Toss: '}{match.tossWinner}{match.tossChoice ? ` (${match.tossChoice})` : ''}
              </span>
            )}
          </div>

          {/* Dark variant for the same reason as the hub banner: #b45309 is
              3.43:1 on #161B27, under AA. */}
          {match.stale && rateLimited && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: dark ? '#f59e0b' : '#b45309' }}>
              <AlertTriangle size={13} aria-hidden="true" />
              {rateLimitMessage(isHindi)}
            </div>
          )}
          {match.stale && !rateLimited && (
            <div style={{ marginTop: 12, fontSize: 12, color: '#F59E0B' }}>
              {isHindi ? 'नवीनतम डेटा उपलब्ध नहीं — अंतिम ज्ञात स्कोर दिखाया गया' : 'Live refresh failed — showing last known score'}
            </div>
          )}

          <ShareRow match={match} T2={T2} dark={dark} />
        </div>

        {match.innings?.length > 0 && (
          <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 22, marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: T1, marginBottom: 16 }}>
              {isHindi ? 'स्कोरकार्ड' : 'Scorecard'}
            </h2>
            {match.innings.map((innings, i) => (
              <InningsTable key={`${innings.name}-${i}`} innings={innings} dark={dark} isHindi={isHindi} bdr={bdr} T1={T1} T2={T2} T3={T3} />
            ))}
          </div>
        )}

        <RelatedCricketNews match={match} dark={dark} selectedLanguage={selectedLanguage} />
      </>
    );
  }

  return (
    <PublicPageLayout chrome={chrome}>
      <div className="kn-content-wrap" style={{ padding: '28px 5px 70px', maxWidth: 900, margin: '0 auto' }}>
        {/* A match page was reachable from the hub but had no way back to it
            — a real Link, not router.back(), so it also works for someone
            arriving from a shared URL with no history to go back to. */}
        <Link
          href="/cricket"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '8px 0', fontSize: 13, fontWeight: 700, color: T2, textDecoration: 'none' }}
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {isHindi ? 'सभी स्कोर' : 'All scores'}
        </Link>
        {body}
      </div>
    </PublicPageLayout>
  );
}
