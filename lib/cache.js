import { Redis } from '@upstash/redis';
import logger from '@/lib/logger';
import { getOptionalEnv, validateOptionalEnvs } from '@/lib/env';

validateOptionalEnvs(['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']);

const UPSTASH_URL = getOptionalEnv('UPSTASH_REDIS_REST_URL');
const UPSTASH_TOKEN = getOptionalEnv('UPSTASH_REDIS_REST_TOKEN');

let redis = null;

if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    const client = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
    // Non-blocking ping — tells us at startup whether the credentials actually work.
    // If the ping fails we disable redis so withCache falls through to the DB.
    client.ping().then(() => {
      redis = client;
      logger.info('Upstash Redis connected ✓');
    }).catch(err => {
      logger.error('Upstash Redis ping failed — L2 cache disabled, falling back to MongoDB', {
        error: err?.message || err,
        hint: 'Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env',
      });
    });
  } catch (err) {
    logger.error('Failed to initialize Upstash Redis', { error: err?.message || err });
  }
} else {
  logger.warn('Upstash Redis not configured — L2 cache disabled (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to enable)');
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
        return cached;
      }
    }

    // Cache miss - fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    if (redis) {
      await redis.setex(key, ttl, data);
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
