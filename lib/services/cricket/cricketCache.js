// Redis-backed, with an in-memory fallback — same shape as
// lib/services/market/marketCache.js. Two tiers:
//   - "fresh": short TTL, avoids re-hitting CricAPI on every poll from every
//     open tab (CricAPI meters credits per request, unlike Yahoo, so this
//     tier is what keeps the module inside a free/low-tier quota).
//   - "last good": no TTL, only read when a live fetch fails — keeps the
//     scoreboard from going blank on a provider outage.
//
// The match list and each match's detail are cached separately: polling the
// list (for score cards) shouldn't be coupled to how many match-detail pages
// happen to be open.
import { getRedisClient } from '@/lib/cache/redis';

const DEFAULT_FRESH_TTL_SECONDS = 1800;

// Deployment config rather than a constant, because it's the main lever for
// staying inside a CricAPI daily allowance: upstream requests per day work
// out to roughly 86400 / max(clientPollSeconds, this), so the previous
// hardcoded 45s put a 60s live poll at ~1440/day against a plan that allows
// 100. Read per call so it can be retuned without a code change.
function freshTtlSeconds() {
  const parsed = Number.parseInt(process.env.CRICAPI_FRESH_TTL_SECONDS ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FRESH_TTL_SECONDS;
}

const MATCHES_FRESH_KEY = 'cricket:fresh:matches';
const MATCHES_LAST_KEY = 'cricket:last:matches';
const DETAIL_FRESH_PREFIX = 'cricket:fresh:match:';
const DETAIL_LAST_PREFIX = 'cricket:last:match:';

const localFresh = new Map(); // key -> { data, storedAt }
const localLast = new Map(); // key -> data

async function getFreshByKey(key) {
  const redis = getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Redis getFresh (cricket) failed, falling back to in-memory cache:', error.message);
    }
  }
  const entry = localFresh.get(key);
  return entry && Date.now() - entry.storedAt < freshTtlSeconds() * 1000 ? entry.data : null;
}

async function setFreshByKey(key, data) {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(data), { ex: freshTtlSeconds() });
      return;
    } catch (error) {
      console.error('Redis setFresh (cricket) failed, falling back to in-memory cache:', error.message);
    }
  }
  localFresh.set(key, { data, storedAt: Date.now() });
}

async function getLastByKey(key) {
  const redis = getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Redis getLastGood (cricket) failed, falling back to in-memory cache:', error.message);
    }
  }
  return localLast.get(key) || null;
}

async function setLastByKey(key, data) {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(data));
      return;
    } catch (error) {
      console.error('Redis setLastGood (cricket) failed, falling back to in-memory cache:', error.message);
    }
  }
  localLast.set(key, data);
}

export const getFreshMatches = () => getFreshByKey(MATCHES_FRESH_KEY);
export const setFreshMatches = (data) => setFreshByKey(MATCHES_FRESH_KEY, data);
export const getLastGoodMatches = () => getLastByKey(MATCHES_LAST_KEY);
export const setLastGoodMatches = (data) => setLastByKey(MATCHES_LAST_KEY, data);

export const getFreshMatchDetail = (id) => getFreshByKey(DETAIL_FRESH_PREFIX + id);
export const setFreshMatchDetail = (id, data) => setFreshByKey(DETAIL_FRESH_PREFIX + id, data);
export const getLastGoodMatchDetail = (id) => getLastByKey(DETAIL_LAST_PREFIX + id);
export const setLastGoodMatchDetail = (id, data) => setLastByKey(DETAIL_LAST_PREFIX + id, data);

// Short-lived flag: was the most recent upstream call rejected for hitting a
// CricAPI quota/rate limit specifically? Reuses the "fresh" tier's TTL so it
// self-clears — either a later successful fetch never re-sets it, or it just
// times out — without needing an explicit "clear" call anywhere.
const RATE_LIMIT_KEY = 'cricket:ratelimited';
export const getRateLimited = () => getFreshByKey(RATE_LIMIT_KEY);
export const setRateLimited = () => setFreshByKey(RATE_LIMIT_KEY, true);
