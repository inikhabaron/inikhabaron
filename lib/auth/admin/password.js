import crypto from 'crypto';

/**
 * Password hashing using Node's built-in scrypt (no external dependency).
 *
 * Stored format:  scrypt$<saltHex>$<hashHex>
 *
 * We deliberately avoid bcrypt so no new npm dependency / lockfile change is
 * needed (which would risk the Vercel build). scrypt is memory-hard and a solid
 * choice for password storage.
 */

const KEYLEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

/** Hash a plaintext password. Returns a self-describing string. */
export function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(plain), salt, KEYLEN, SCRYPT_PARAMS);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/** True if a stored value is already a scrypt hash (vs legacy plaintext). */
export function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith('scrypt$');
}

/**
 * Constant-time verify of a plaintext password against a stored hash.
 * Returns false for any malformed input.
 */
export function verifyPassword(plain, stored) {
  try {
    if (!isHashed(stored)) return false;
    const [, saltHex, hashHex] = stored.split('$');
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = crypto.scryptSync(String(plain), salt, expected.length, SCRYPT_PARAMS);
    return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}
