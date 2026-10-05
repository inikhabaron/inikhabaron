/**
 * Request-derived sender signals for abuse limiting (see
 * lib/services/comments/guestCommentGuard.js). They are only ever hashed with a
 * server secret before use — the raw values are never stored.
 */

/**
 * Best-effort client IP from proxy headers.
 *
 * x-real-ip / x-forwarded-for are set (and overwritten) by the platform edge
 * on Vercel, so the first hop is the real client there. Behind a proxy that
 * merely appends, the left-most entry is client-controllable; that only lets
 * an attacker pick a different bucket, which the device and site-wide caps
 * still cover.
 */
export function getClientIp(request) {
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

/**
 * A coarse browser fingerprint from headers the browser sends anyway. It is
 * deliberately weak (millions of phones share a user-agent + language) and is
 * used only for a loose ceiling, never to identify a person.
 */
export function getClientFingerprint(request) {
  const userAgent = request.headers.get('user-agent') || '';
  const language = request.headers.get('accept-language') || '';
  return `${userAgent}|${language}`;
}
