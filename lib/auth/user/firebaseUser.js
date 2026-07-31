import crypto from 'crypto';
import { getAdminAuth } from './firebase-admin';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function getFirebaseUserFromToken(idToken) {
  // Resolved outside the try on purpose. A misconfigured Firebase Admin (a
  // missing FIREBASE_* variable) is a server fault, not a bad token, so it
  // propagates to the caller — which reports it as a 500 and logs the real
  // reason. Swallowing it here would answer "Invalid Firebase token" (401) and
  // send everyone hunting the wrong problem.
  const adminAuth = await getAdminAuth();

  try {
    // Verify Firebase ID Token
    const decoded = await adminAuth.verifyIdToken(idToken);

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    const now = new Date();

    // Build disjoint $set / $setOnInsert (Mongo rejects a field in both).
    // Only sync name/avatar the token actually provides, so we never overwrite
    // an existing value with a blank; fall back to a default only on insert.
    const set = { updatedAt: now, lastLoginAt: now };
    const setOnInsert = {
      id: crypto.randomUUID(),
      firebaseUid: decoded.uid,
      email: decoded.email || null,
      phone: decoded.phone_number || null,
      provider: decoded.firebase?.sign_in_provider || 'unknown',
      role: 'user',
      isActive: true,
      createdAt: now,
    };
    if (decoded.name) set.name = decoded.name;
    else setOnInsert.name = '';
    if (decoded.picture) set.avatar = decoded.picture;
    else setOnInsert.avatar = '';

    // Atomic upsert avoids the find-then-insert race that could create duplicate
    // users when two first-login requests arrive concurrently (common on OAuth).
    await usersCollection.updateOne(
      { firebaseUid: decoded.uid },
      { $set: set, $setOnInsert: setOnInsert },
      { upsert: true }
    );

    return usersCollection.findOne({ firebaseUid: decoded.uid });
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