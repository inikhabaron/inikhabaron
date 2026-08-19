import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { getAdminAuth } from '@/lib/auth/user/firebase-admin';

export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

/**
 * Identity comes from a verified Firebase ID token, never from the body.
 *
 * This route used to take `firebaseUid`, `email` and `name` straight off the
 * request with no authentication of any kind, then `$set` them onto whichever
 * user matched. Two ways that went wrong:
 *
 *  - Supply someone else's uid and you overwrite their profile.
 *  - Omit `firebaseUid` entirely and the driver sends `{firebaseUid: null}`,
 *    which in MongoDB also matches documents that have no such field — all
 *    three staff accounts. An unauthenticated POST could therefore rewrite an
 *    admin's email address, and login resolves accounts by email.
 *
 * Verifying the token first makes both impossible: the uid is whatever Firebase
 * says it is, and the caller can only ever write their own record.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const authHeader = request.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : typeof body.idToken === 'string' ? body.idToken.trim() : '';

    if (!idToken) {
      return json({ error: 'Firebase ID token is required' }, { status: 401 });
    }

    let decoded;
    try {
      const adminAuth = await getAdminAuth();
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('POST /api/users/sync token verification failed:', error?.message);
      return json({ error: 'Invalid Firebase token' }, { status: 401 });
    }

    // Everything identifying is taken from the token. `body` may still supply
    // the purely cosmetic bits below that the token does not carry.
    const firebaseUid = decoded.uid;
    const email = decoded.email || null;
    const name = decoded.name || body.name || '';
    const avatar = decoded.picture || body.avatar || '';

    const usersCollection = await getCollection('users');
    const existingUser = await usersCollection.findOne({ firebaseUid });

    if (existingUser) {
      await usersCollection.updateOne(
        { firebaseUid },
        {
          $set: {
            email,
            name,
            avatar,
            lastLogin: new Date(),
            updatedAt: new Date(),
          },
        }
      );
      const updatedUser = await usersCollection.findOne({ firebaseUid });
      return json({ success: true, user: updatedUser, isNew: false });
    }

    const newUser = {
      id: uuidv4(),
      firebaseUid,
      email,
      name,
      avatar,
      phone: body.phone || null,
      role: 'reader',
      isVerified: false,
      bio: '',
      fcmToken: body.fcmToken || null,
      preferences: { categories: [], notifications: true },
      followedCategories: [],
      followedAuthors: [],
      followedCities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    };

    await usersCollection.insertOne(newUser);
    return json({ success: true, user: newUser, isNew: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/users/sync error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
