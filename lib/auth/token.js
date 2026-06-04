import jwt from 'jsonwebtoken';
import { getCollection } from '@/lib/mongodb';
import logger from '@/lib/logger';
import { getRequiredSecret } from '@/lib/env';

const JWT_SECRET_KEY = 'JWT_SECRET';
function getJwtSecret() {
  return getRequiredSecret(JWT_SECRET_KEY, { minLength: 32, hint: 'JWT signing secret' });
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

  // console.log('AUTH HEADER:', authHeader);
  // console.log('X TOKEN:', fallbackHeader);

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : fallbackHeader;

  // console.log('TOKEN:', token);

  if (!token) return null;

  const payload = decodeToken(token);

  // console.log('PAYLOAD:', payload);

  if (!payload?.userId) return null;

  try {
    const usersCollection = await getCollection('users');

    const user = await usersCollection.findOne({
      id: payload.userId
    });

    // console.log('FOUND USER:', user);

    return user;
  } catch (error) {
    // console.error('GET USER ERROR:', error);
    return null;
  }
}