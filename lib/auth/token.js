import { getCollection } from '@/lib/mongodb';

export async function getUserFromToken(request) {
  const authHeader = request.headers.get('authorization')?.toString().trim();
  const fallbackHeader = request.headers.get('x-admin-token')?.toString().trim();
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token')?.toString().trim();
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : fallbackHeader || queryToken;

  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64').toString().split(':');
    const userId = decoded[0];
    const usersCollection = await getCollection('users');
    return await usersCollection.findOne({ id: userId });
  } catch {
    return null;
  }
}

export function encodeToken(userId) {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
}
