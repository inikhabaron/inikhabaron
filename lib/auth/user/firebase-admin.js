import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

const firebaseAdmin =
    getApps().length > 0
        ? getApps()[0]
        : initializeApp({
              credential: cert({
                  projectId: process.env.FIREBASE_PROJECT_ID,
                  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
                      /\\n/g,
                      '\n'
                  ),
              }),
          });

export const adminAuth = getAuth(firebaseAdmin);
export const adminMessaging = getMessaging(firebaseAdmin);