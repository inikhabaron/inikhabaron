import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const limiters = {
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 min'),
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 min'),
  }),
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 min'),
  }),
};

export async function checkRateLimit(key, type = 'api') {
  try {
    const limiter = limiters[type] || limiters.api;
    return await limiter.limit(key);
  } catch (error) {
    console.error('Rate limit check error:', error);
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
