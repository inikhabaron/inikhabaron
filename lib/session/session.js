import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { getSessionCookie } from './cookies';
import { verifySession } from './jwt';

export async function getCurrentUser() {
  const token = await getSessionCookie();

  console.log('SESSION TOKEN:', token);

  if (!token) {
    return null;
  }

  const payload = verifySession(token);

  console.log('JWT PAYLOAD:', payload);

  if (!payload) {
    return null;
  }

  const usersCollection = await getCollection(COLLECTIONS.USERS);

  const user = await usersCollection.findOne({
    id: payload.id,
  });

  console.log('MONGO USER:', user);

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}