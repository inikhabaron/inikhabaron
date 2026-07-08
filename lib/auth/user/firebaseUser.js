import crypto from 'crypto';
import { adminAuth } from './firebase-admin';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function getFirebaseUserFromToken(idToken) {
  try {
    // Verify Firebase ID Token
    const decoded = await adminAuth.verifyIdToken(idToken);

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Find existing user
    let user = await usersCollection.findOne({
      firebaseUid: decoded.uid,
    });

    const now = new Date();

    // First login → create MongoDB user
    if (!user) {
      user = {
        id: crypto.randomUUID(),

        firebaseUid: decoded.uid,

        email: decoded.email || null,

        name: decoded.name || '',

        avatar: decoded.picture || '',

        phone: decoded.phone_number || null,

        provider: decoded.firebase?.sign_in_provider || 'unknown',

        role: 'user',

        isActive: true,

        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      await usersCollection.insertOne(user);
    } else {
      // Existing user → keep profile in sync
      await usersCollection.updateOne(
        { firebaseUid: decoded.uid },
        {
          $set: {
            updatedAt: now,
            lastLoginAt: now,
            name: decoded.name || user.name,
            avatar: decoded.picture || user.avatar,
          },
        }
      );

      user = await usersCollection.findOne({
        firebaseUid: decoded.uid,
      });
    }

    return user;
  } catch (error) {
    console.error('Firebase Authentication Error:', error);
    return null;
  }
}

export async function getFirebaseUser(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.substring(7);

  return getFirebaseUserFromToken(idToken);
}