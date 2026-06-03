import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss - fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    await redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to direct fetch if cache fails
    return await fetchFn();
  }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCache(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
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
