import { getCollection } from '@/lib/mongodb';
import { signSession, verifySession } from '@/lib/session/jwt';

/**
 * Admin authentication tokens.
 *
 * SECURITY: previously the "token" was base64("<userId>:<timestamp>") with no
 * signature — anyone who knew a user id (leaked via the public API's authorId)
 * could forge an admin token. Tokens are now signed JWTs (HMAC via JWT_SECRET),
 * so they cannot be forged, and they carry an expiry.
 *
 * Transport: `Authorization: Bearer <token>` or the `x-admin-token` header.
 * The insecure `?token=` query-string path has been removed (it leaked tokens
 * into logs, referrers and browser history).
 */

/** Issue a signed admin token for a user object (or bare id, for back-compat). */
export function encodeToken(user) {
  const u = typeof user === 'string' ? { id: user } : user;
  return signSession({ id: u.id, firebaseUid: u.firebaseUid, role: u.role });
}

/** Resolve the authenticated admin user from the request, or null. */
export async function getUserFromToken(request) {
  const authHeader = request.headers.get('authorization')?.toString().trim();
  const fallbackHeader = request.headers.get('x-admin-token')?.toString().trim();
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : fallbackHeader || null;

  if (!token) return null;

  const payload = verifySession(token);
  if (!payload?.id) return null;

  try {
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ id: payload.id });
    if (!user || user.isActive === false) return null;
    return user;
  } catch {
    return null;
  }
}
