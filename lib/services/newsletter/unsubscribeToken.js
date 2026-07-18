import crypto from 'crypto';

// One-click unsubscribe links need to be usable from a plain <a href> (a GET
// request, no auth header), but a bare ?email= link would let anyone
// unsubscribe any known address. HMAC-signing the email with JWT_SECRET
// (already required app-wide, see lib/session/jwt.js) closes that gap without
// a new secret or a new dependency.
const SECRET = process.env.JWT_SECRET;

export function createUnsubscribeToken(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return crypto.createHmac('sha256', SECRET).update(normalized).digest('hex');
}

export function verifyUnsubscribeToken(email, token) {
  if (!email || !token) return false;
  const expected = createUnsubscribeToken(email);
  const expectedBuf = Buffer.from(expected);
  const tokenBuf = Buffer.from(String(token));
  if (expectedBuf.length !== tokenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, tokenBuf);
}
