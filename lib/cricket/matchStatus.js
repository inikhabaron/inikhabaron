// Presentation-side polling/labels for cricket matches — the counterpart to
// lib/market/marketStatus.js. Kept out of lib/services/cricket/ for the same
// reason: that layer is server-side fetching/caching, this is "how should
// the UI poll and label what it already has."
import { MATCH_STATES } from '@/lib/services/cricket/cricketConstants';
import { tierRank } from '@/lib/cricket/matchPriority';

// CricAPI meters credits per request (unlike the Market Ticker's unmetered
// Yahoo endpoint), so polling has to be noticeably more conservative — one
// shared server-side "fresh" cache absorbs concurrent visitors either way,
// but the poll rate itself still drives how often that cache is refilled.
export const REFRESH_LIVE_MS = 60_000; // a match is actually in progress
export const REFRESH_IDLE_MS = 600_000; // nothing live right now

export function hasLiveMatch(matches) {
  return Array.isArray(matches) && matches.some((m) => m.matchState === MATCH_STATES.LIVE);
}

export function refreshIntervalForMatches(matches) {
  return hasLiveMatch(matches) ? REFRESH_LIVE_MS : REFRESH_IDLE_MS;
}

export function refreshIntervalForMatch(match) {
  return match?.matchState === MATCH_STATES.LIVE ? REFRESH_LIVE_MS : REFRESH_IDLE_MS;
}

export function matchStateLabel(matchState, isHindi) {
  if (matchState === MATCH_STATES.LIVE) return isHindi ? 'लाइव' : 'Live';
  if (matchState === MATCH_STATES.COMPLETED) return isHindi ? 'परिणाम' : 'Result';
  return isHindi ? 'आगामी' : 'Upcoming';
}

// Styled pill colors for the status badge — replaces an earlier plain-emoji
// (🔴/🟡/⚪) treatment, which was fine for development but read as
// unfinished next to the rest of the site's pill-badge language (see e.g.
// the admin media-maintenance StatusBadge, or MarketTicker's Open/Closed
// pill). Translucent tints rather than solid fills so they hold up on both
// the light and dark surface colors without a separate dark-mode palette.
export function matchStateColors(matchState, dark) {
  if (matchState === MATCH_STATES.LIVE) {
    return { bg: 'rgba(239,68,68,0.14)', color: '#ef4444' };
  }
  if (matchState === MATCH_STATES.UPCOMING) {
    return { bg: 'rgba(245,158,11,0.16)', color: '#d97706' };
  }
  return {
    bg: dark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    color: dark ? '#9BA5B4' : '#6B7280',
  };
}

// IST calendar day, for "same day" grouping below — matches keep IST as the
// site-wide reference timezone (see lib/market/marketStatus.js's IST_PARTS)
// rather than each caller re-deriving it independently.
const IST_DAY_FORMAT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });

function istDayBucket(dateTimeGMT) {
  return dateTimeGMT ? IST_DAY_FORMAT.format(new Date(dateTimeGMT)) : null;
}

// Which single match should represent the module when only one card fits
// (the homepage widget) — live takes priority; failing that, whichever
// upcoming match starts soonest; failing that, whichever completed match
// finished most recently.
//
// Within the same IST calendar day, editorial tier breaks the tie (an
// India/IPL match outranks a domestic one that happens to start/finish the
// same day) — matches already arrive tier-sorted from the server
// (lib/cricket/matchPriority.js + admin settings) for the "many matches"
// views, but picking a single one here needs its own explicit tiebreak.
// Across different days, recency alone decides: tier never makes an
// older-but-higher-tier match outrank a genuinely more recent/sooner one.
export function pickFeaturedMatch(matches) {
  if (!Array.isArray(matches) || !matches.length) return null;

  const live = matches.find((m) => m.matchState === MATCH_STATES.LIVE);
  if (live) return live;

  const compareFor = (dir) => (a, b) => {
    if (!a.dateTimeGMT || !b.dateTimeGMT) return 0;
    const sameDay = istDayBucket(a.dateTimeGMT) === istDayBucket(b.dateTimeGMT);
    if (sameDay) {
      const tierDiff = tierRank(a.tier) - tierRank(b.tier);
      if (tierDiff !== 0) return tierDiff;
    }
    return dir * (new Date(a.dateTimeGMT) - new Date(b.dateTimeGMT));
  };

  const upcoming = matches.filter((m) => m.matchState === MATCH_STATES.UPCOMING);
  if (upcoming.length) return [...upcoming].sort(compareFor(1))[0];

  const completed = matches.filter((m) => m.matchState === MATCH_STATES.COMPLETED);
  if (completed.length) return [...completed].sort(compareFor(-1))[0];

  return null;
}

// Shown whenever the API reports `rateLimited: true` — a CricAPI quota/429
// hit, distinct from a generic network failure. Deliberately reassuring
// ("showing the most recent update") rather than looking like a broken
// integration, since this is expected/self-resolving once the quota resets.
export function rateLimitMessage(isHindi) {
  return isHindi
    ? 'लाइव स्कोर अस्थायी रूप से अनुपलब्ध हैं। नवीनतम अपडेट दिखाया जा रहा है।'
    : 'Live scores are temporarily unavailable. Showing the most recent update.';
}
