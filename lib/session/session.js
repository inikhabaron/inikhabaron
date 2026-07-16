import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { headers } from 'next/headers';
import { getSessionCookie } from './cookies';
import { verifySession } from './jwt';

// Mobile clients (React Native / Expo) can't rely on httpOnly cookies the
// way a browser does, so they authenticate via `Authorization: Bearer <token>`
// instead. Web keeps using the httpOnly cookie. Cookie takes precedence when
// both are present (shouldn't normally happen).
async function getBearerToken() {
  const headerList = await headers();
  const authHeader =
    headerList.get('authorization') || headerList.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export async function getCurrentUser() {
  const token = (await getSessionCookie()) || (await getBearerToken());

  if (!token) {
    return null;
  }

  const payload = verifySession(token);

  if (!payload) {
    return null;
  }

  const usersCollection = await getCollection(COLLECTIONS.USERS);

  const user = await usersCollection.findOne({
    id: payload.id,
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}