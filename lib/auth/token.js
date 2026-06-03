import jwt from 'jsonwebtoken';
import { getCollection } from '@/lib/mongodb';
import logger from '@/lib/logger';

const JWT_SECRET_KEY = 'JWT_SECRET';
function getJwtSecret() {
  const secret = process.env[JWT_SECRET_KEY];
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be 32+ characters in .env.local');
  }
  return secret;
}

export function encodeToken(userId, role = 'user') {
  return jwt.sign(
    { userId, role },
    getJwtSecret(),
    {
      expiresIn: '7d',
      algorithm: 'HS256',
      issuer: 'khabaron-admin',
    }
  );
}

export function decodeToken(token) {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
  } catch (error) {
    logger.error('Token verification error', { error: error.message });
    return null;
  }
}

export async function getUserFromToken(request) {
  const authHeader = request.headers.get('authorization')?.toString().trim();
  const fallbackHeader = request.headers.get('x-admin-token')?.toString().trim();
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : fallbackHeader;

  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload?.userId) return null;

  try {
    const usersCollection = await getCollection('users');
    return await usersCollection.findOne({ id: payload.userId });
  } catch {
    return null;
  }
}
