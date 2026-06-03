import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import logger from '@/lib/logger';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis;
if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  } catch (err) {
    logger.error('Failed to initialize Upstash Redis in cache module', { error: err?.message || err });
    redis = null;
  }
} else {
  logger.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — cache disabled');
  redis = null;
}

/**
 * Cache wrapper for API responses
 * Reduces database load by caching frequently accessed data
 */
export async function withCache(
  key,
  fetchFn,
  options = {}
) {
  const {
    ttl = 300, // Default 5 minutes
    tags = [],
  } = options;

  try {
    let cached = null;
    if (redis) {
      cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Cache miss - fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    if (redis) {
      await redis.setex(key, ttl, JSON.stringify(data));
    }
    
    return data;
  } catch (error) {
    logger.error('Cache error', { error: error?.message || error });
    // Fallback to direct fetch if cache fails
    return await fetchFn();
  }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCache(pattern) {
  try {
    if (!redis) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('Cache invalidation error', { error: error?.message || error });
  }
}

/**
 * Get or create cache key
 */
export function getCacheKey(...parts) {
  return `cache:${parts.join(':')}`;
}

/**
 * Cache duration constants (in seconds)
 */
export const CACHE_DURATION = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 24 hours
};
