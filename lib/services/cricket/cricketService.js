import { MATCH_STATES } from './cricketConstants';
import {
  getFreshMatches, setFreshMatches, getLastGoodMatches, setLastGoodMatches,
  getFreshMatchDetail, setFreshMatchDetail, getLastGoodMatchDetail, setLastGoodMatchDetail,
  getRateLimited, setRateLimited,
} from './cricketCache';
import { fetchCurrentMatches, fetchMatchDetail, CricApiNotConfiguredError, CricApiRateLimitError } from './cricApiProvider';
import { getCricketSettings } from './cricketSettingsService';
import { CRICKET_TIER_LIST, sortMatchesByPriority } from '@/lib/cricket/matchPriority';
import { refreshIntervalForMatches } from '@/lib/cricket/matchStatus';

export const isCricketConfigured = () => Boolean(process.env.CRICAPI_KEY);

// Collapses concurrent requests within this process (several tabs polling at
// once) into one upstream call — the Redis "fresh" tier does the equivalent
// job across processes/instances once the first one populates it.
let matchesInFlight = null;
const detailInFlight = new Map(); // id -> Promise

// The raw, cached fetch — unsorted, unfiltered. Kept separate from
// getMatches() so admin settings (tier filter, featured pin) apply fresh on
// every read without needing to invalidate the Redis cache when an admin
// changes them.
async function getRawMatches() {
  const fresh = await getFreshMatches();
  if (fresh) return fresh;

  if (matchesInFlight) return matchesInFlight;

  matchesInFlight = (async () => {
    try {
      const matches = await fetchCurrentMatches();
      await Promise.all([setFreshMatches(matches), setLastGoodMatches(matches)]);
      return matches;
    } catch (error) {
      if (error instanceof CricApiRateLimitError) {
        await setRateLimited();
      } else if (!(error instanceof CricApiNotConfiguredError)) {
        console.error('cricket matches fetch failed:', error.message);
      }
      const last = await getLastGoodMatches();
      if (last) return last.map((m) => ({ ...m, stale: true }));
      return [];
    } finally {
      matchesInFlight = null;
    }
  })();

  return matchesInFlight;
}

// A free-text admin pin (e.g. "IPL", "World Cup") — matched against the
// match name and team names so it bypasses the tier filter below. An admin
// naming a specific tournament is a stronger signal than the general tier
// preference, so a featured match is always shown even if its tier
// (e.g. domestic) is otherwise excluded.
function isFeaturedMatch(match, featuredTournament) {
  if (!featuredTournament) return false;
  const needle = featuredTournament.toLowerCase();
  if ((match.name || '').toLowerCase().includes(needle)) return true;
  return (match.teams || []).some((t) => (t.name || '').toLowerCase().includes(needle));
}

export async function getMatches() {
  const [raw, settings] = await Promise.all([getRawMatches(), getCricketSettings()]);
  if (!settings.enabled) return [];

  const preferredTiers = new Set(settings.preferredLeagues?.length ? settings.preferredLeagues : CRICKET_TIER_LIST);
  const featured = [];
  const rest = [];

  for (const match of raw) {
    if (isFeaturedMatch(match, settings.featuredTournament)) {
      featured.push(match);
    } else if (preferredTiers.has(match.tier)) {
      rest.push(match);
    }
  }

  return [...featured, ...sortMatchesByPriority(rest)];
}

export async function getLiveMatches() {
  const matches = await getMatches();
  return matches.filter((m) => m.matchState === MATCH_STATES.LIVE);
}

// Server-computed poll rate: an admin override (refreshIntervalSeconds) wins
// when set, otherwise the built-in adaptive live/idle rate. Centralized here
// so every surface (widget, list, detail page) honors the same admin choice
// via the API response instead of re-reading settings client-side.
export async function getPollIntervalMs(matches) {
  const settings = await getCricketSettings();
  if (settings.refreshIntervalSeconds) return settings.refreshIntervalSeconds * 1000;
  return refreshIntervalForMatches(matches);
}

export async function getWidgetSettings() {
  const settings = await getCricketSettings();
  return {
    homepageWidgetEnabled: settings.enabled && settings.homepageWidgetEnabled,
    homepageWidgetSize: settings.homepageWidgetSize || 'compact',
  };
}

export async function isCricketEnabled() {
  const settings = await getCricketSettings();
  return Boolean(settings.enabled);
}

// Was the most recent upstream call rejected for a quota/rate-limit reason?
// Surfaced to the API responses so the UI can show "showing the last
// update, live scores are temporarily unavailable" instead of a bare
// unavailable/error message — a quota hit is expected and self-resolving,
// not a broken integration.
export async function isRateLimited() {
  return Boolean(await getRateLimited());
}

export async function getMatchDetail(id) {
  const enabled = await isCricketEnabled();
  if (!enabled) return null;

  const fresh = await getFreshMatchDetail(id);
  if (fresh) return fresh;

  if (detailInFlight.has(id)) return detailInFlight.get(id);

  const promise = (async () => {
    try {
      const detail = await fetchMatchDetail(id);
      if (detail) await Promise.all([setFreshMatchDetail(id, detail), setLastGoodMatchDetail(id, detail)]);
      return detail;
    } catch (error) {
      if (error instanceof CricApiRateLimitError) {
        await setRateLimited();
      } else if (!(error instanceof CricApiNotConfiguredError)) {
        console.error(`cricket match detail fetch failed for ${id}:`, error.message);
      }
      const last = await getLastGoodMatchDetail(id);
      if (last) return { ...last, stale: true };
      return null;
    } finally {
      detailInFlight.delete(id);
    }
  })();

  detailInFlight.set(id, promise);
  return promise;
}
