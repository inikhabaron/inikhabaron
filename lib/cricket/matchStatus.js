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

// How far ahead an upcoming fixture is worth surfacing on the /cricket hub —
// CricAPI's currentMatches window can include fixtures many days out, and
// showing those alongside "what's on right now" made the hub read as
// cluttered rather than focused. Matches beyond this are hidden from every
// hub section (not just "Upcoming Fixtures") rather than kept around under
// their tier section, per the product ask: nothing "immediate" means don't
// show a card for it at all.
export const UPCOMING_HUB_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export function isWithinUpcomingHubWindow(match) {
  if (match?.matchState !== MATCH_STATES.UPCOMING) return true;
  if (!match.dateTimeGMT) return true; // unknown start time — don't hide blind
  return new Date(match.dateTimeGMT).getTime() - Date.now() <= UPCOMING_HUB_WINDOW_MS;
}

// Ms until `dateTimeGMT` — negative once it's passed (CricAPI can lag a few
// minutes behind the scheduled time before flipping matchStarted, so a small
// negative value is feed lag, not a bug).
export function msUntilStart(dateTimeGMT) {
  if (!dateTimeGMT) return null;
  const ms = new Date(dateTimeGMT).getTime();
  return Number.isNaN(ms) ? null : ms - Date.now();
}

// "About to begin" — inside this window the UI bothers with a live-ticking
// countdown; further out it's just a static date/time, since a fixture three
// days away doesn't need per-minute movement.
export const COUNTDOWN_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

// Tick every second inside the last minute (visibly counting down matters
// right before start), otherwise every 30s — same "don't poll harder than
// the moment calls for" reasoning as refreshIntervalForMatch(es) above.
export function countdownTickMs(remainingMs) {
  return remainingMs != null && remainingMs <= 60_000 ? 1_000 : 30_000;
}

// "Starts in 2h 14m" — coarsest non-zero unit first, matching how a reader
// actually thinks about "how long until". Once the clock runs out but
// CricAPI hasn't flipped matchStarted yet (feed lag, not a bug), falls back
// to a reassuring "starting shortly" rather than a confusing negative count.
export function formatCountdown(remainingMs, isHindi) {
  if (remainingMs == null) return null;
  if (remainingMs <= 0) return isHindi ? 'शुरू होने वाला है...' : 'Starting shortly…';

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return isHindi ? `${days} दिन ${hours} घं में शुरू` : `Starts in ${days}d ${hours}h`;
  if (hours > 0) return isHindi ? `${hours} घं ${minutes} मि में शुरू` : `Starts in ${hours}h ${minutes}m`;
  if (minutes > 0) return isHindi ? `${minutes} मि में शुरू` : `Starts in ${minutes}m`;
  return isHindi ? `${seconds} से में शुरू` : `Starts in ${seconds}s`;
}

// "Sat, 9 Aug, 3:00 pm IST" — IST to match the site-wide reference timezone
// (see istDayBucket above / lib/market/marketStatus.js's IST_PARTS), locale
// pattern matches how NewsClient formats publishedAt (toLocaleDateString with
// 'hi-IN'/'en-US' switched on selectedLanguage) rather than inventing a new
// date-formatting convention for just this module.
const MATCH_DATE_TIME_OPTIONS = {
  timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
};

// "Updated 12s ago" — a freshness signal on the live match detail page so a
// reader can tell the score in front of them is current, not stalled (the
// module already polls every 60s while live; this makes that visible rather
// than trusting the reader to infer it from a badge that never seems to
// move for up to a minute at a time).
export function formatUpdatedAgo(elapsedMs, isHindi) {
  if (elapsedMs == null || elapsedMs < 0) return null;
  const seconds = Math.floor(elapsedMs / 1000);
  if (seconds < 5) return isHindi ? 'अभी अपडेट किया गया' : 'Updated just now';
  if (seconds < 60) return isHindi ? `${seconds} से पहले अपडेट किया गया` : `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return isHindi ? `${minutes} मि पहले अपडेट किया गया` : `Updated ${minutes}m ago`;
}

export function formatMatchDateTime(dateTimeGMT, isHindi) {
  if (!dateTimeGMT) return null;
  const date = new Date(dateTimeGMT);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = date.toLocaleString(isHindi ? 'hi-IN' : 'en-US', MATCH_DATE_TIME_OPTIONS);
  return `${formatted} IST`;
}
