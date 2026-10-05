import crypto from 'crypto';

/**
 * Server-signed "form was shown at" token for guest comments.
 *
 * The minimum-completion-time check used to trust a browser-supplied
 * timestamp, which a bot can simply fake. Now the server issues
 * `<issuedAtMs>.<signature>` when the comments load and verifies the signature
 * on submit, so the elapsed time is measured from a moment the client cannot
 * choose. A bot can still fetch a token and wait, but it has to do that for
 * real, and it is still bound by the rate limits.
 *
 * Stateless (HMAC only), so it works across serverless instances.
 */

export const FORM_TOKEN_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function sign(issuedAt) {
  // JWT_SECRET is always present (lib/session/jwt.js refuses to load without
  // it). The prefix domain-separates this HMAC from the key's other uses.
  return crypto
    .createHmac('sha256', `guest-comment-form:${process.env.JWT_SECRET || ''}`)
    .update(String(issuedAt))
    .digest('hex')
    .slice(0, 32);
}

export function issueFormToken(now = Date.now()) {
  return `${now}.${sign(now)}`;
}

/**
 * Returns `{ ok: true, ageMs }`, or `{ ok: false, reason }` where reason is
 * 'missing' | 'invalid' | 'expired'.
 */
export function verifyFormToken(token, now = Date.now()) {
  if (typeof token !== 'string' || !token) {
    return { ok: false, reason: 'missing' };
  }

  const [issuedRaw, signature, ...rest] = token.split('.');
  const issuedAt = Number(issuedRaw);

  if (rest.length || !signature || !Number.isInteger(issuedAt)) {
    return { ok: false, reason: 'invalid' };
  }

  const expected = Buffer.from(sign(issuedAt));
  const actual = Buffer.from(signature);

  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    return { ok: false, reason: 'invalid' };
  }

  const ageMs = now - issuedAt;

  // A future-dated token can only come from a forged clock.
  if (ageMs < 0) {
    return { ok: false, reason: 'invalid' };
  }

  if (ageMs > FORM_TOKEN_MAX_AGE_MS) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, ageMs };
}
