import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * Firebase Admin SDK, initialized lazily on first use.
 *
 * This used to run at module scope, which made any missing or malformed
 * FIREBASE_* value throw during module *evaluation* — before the importing
 * route handler's own try/catch exists. Every route that imported this file
 * (POST /api/auth/session, and the four admin actions that notify:
 * approve-breaking, approve-trending, breaking, publish) then answered with an
 * unhandleable HTML 500 instead of its own JSON error, so the real reason
 * never reached a log or response the app controls — a login failure and an
 * "approve breaking" failure looked like unrelated mystery 500s.
 *
 * Deferring the work to first call means a config fault surfaces inside the
 * caller's try/catch, where it becomes a readable message, and routes that
 * merely import this module keep working.
 */

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `Firebase Admin is not configured: environment variable ${name} is missing or empty.`
        );
    }
    return value;
}

let cachedApp;

function getAdminApp() {
    if (cachedApp) return cachedApp;

    // Reuse an app initialized elsewhere in the process (Next reuses module
    // scope across warm invocations, and initializeApp twice would throw).
    if (getApps().length > 0) {
        cachedApp = getApps()[0];
        return cachedApp;
    }

    cachedApp = initializeApp({
        credential: cert({
            projectId: requireEnv('FIREBASE_PROJECT_ID'),
            clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
            // Vercel/`.env` carry the PEM as a single line with escaped \n
            // sequences; cert() needs them as real newlines.
            privateKey: requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
        }),
    });

    return cachedApp;
}

export function getAdminAuth() {
    return getAuth(getAdminApp());
}

export function getAdminMessaging() {
    return getMessaging(getAdminApp());
}
