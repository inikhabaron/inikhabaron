import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import logger from '@/lib/logger';
import { getOptionalEnv, validateOptionalEnvs } from '@/lib/env';

validateOptionalEnvs(['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']);

const UPSTASH_URL = getOptionalEnv('UPSTASH_REDIS_REST_URL');
const UPSTASH_TOKEN = getOptionalEnv('UPSTASH_REDIS_REST_TOKEN');

let limiters;

if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
    limiters = {
      login: new Ratelimit({
        redis,
        // Use compact duration format supported by Upstash (e.g. '15m')
        limiter: Ratelimit.slidingWindow(5, '15m'),
      }),
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1m'),
      }),
      search: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1m'),
      }),
    };
  } catch (err) {
    logger.error('Failed to initialize Upstash Redis/Ratelimit', { error: err?.message || err });
    const noop = { limit: async () => ({ success: true }) };
    limiters = { login: noop, api: noop, search: noop };
  }
} else {
  logger.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — rate limiting disabled');
  const noop = { limit: async () => ({ success: true }) };
  limiters = { login: noop, api: noop, search: noop };
}

export async function checkRateLimit(key, type = 'api') {
  try {
    const limiter = limiters[type] || limiters.api;
    return await limiter.limit(key);
  } catch (error) {
    const logger = (await import('@/lib/logger')).default;
    logger.error('Rate limit check error', { error: error?.message || error });
    return { success: true };
  }
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Try again later.' }),
    { 
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
