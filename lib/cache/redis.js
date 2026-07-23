import { Redis } from '@upstash/redis';

let client;
let attempted = false;

// Lazily constructed, memoized singleton. Returns null (never throws) when
// Upstash isn't configured, so every caller can treat "no Redis" as just
// another branch to fall back from instead of special-casing missing env
// vars themselves.
export function getRedisClient() {
  if (attempted) return client;
  attempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.startsWith('TODO') || token.startsWith('TODO')) {
    client = null;
    return client;
  }

  client = new Redis({ url, token });
  return client;
}
