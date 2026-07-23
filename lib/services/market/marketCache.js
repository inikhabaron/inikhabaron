// Redis-backed, with an in-memory fallback for whenever Upstash isn't
// configured or a call throws — every function degrades silently so
// marketService doesn't need to special-case "no Redis" itself.
//
// Two tiers, both keyed by instrument id:
//   - "fresh": short TTL, avoids re-hitting Yahoo on every request.
//   - "last good": no TTL, only read when a live fetch fails — the stale
//     fallback value that keeps the ticker from going blank on an outage.
import { getRedisClient } from '@/lib/cache/redis';

const FRESH_TTL_SECONDS = 15;
const FRESH_KEY_PREFIX = 'market:fresh:';
const LAST_GOOD_KEY_PREFIX = 'market:last:';

const localFresh = new Map(); // id -> { data, storedAt }
const localLast = new Map(); // id -> data

export async function getFresh(id) {
  const redis = getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(FRESH_KEY_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Redis getFresh failed, falling back to in-memory cache:', error.message);
    }
  }
  const entry = localFresh.get(id);
  return entry && Date.now() - entry.storedAt < FRESH_TTL_SECONDS * 1000 ? entry.data : null;
}

export async function setFresh(id, data) {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(FRESH_KEY_PREFIX + id, JSON.stringify(data), { ex: FRESH_TTL_SECONDS });
      return;
    } catch (error) {
      console.error('Redis setFresh failed, falling back to in-memory cache:', error.message);
    }
  }
  localFresh.set(id, { data, storedAt: Date.now() });
}

export async function getLastGood(id) {
  const redis = getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(LAST_GOOD_KEY_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Redis getLastGood failed, falling back to in-memory cache:', error.message);
    }
  }
  return localLast.get(id) || null;
}

export async function setLastGood(id, data) {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(LAST_GOOD_KEY_PREFIX + id, JSON.stringify(data));
      return;
    } catch (error) {
      console.error('Redis setLastGood failed, falling back to in-memory cache:', error.message);
    }
  }
  localLast.set(id, data);
}
