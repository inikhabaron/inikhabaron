/**
 * Firebase Admin SDK — both *loaded* and *initialized* lazily, on first use.
 *
 * Nothing here runs at module scope, deliberately. Two separate failures used
 * to happen before an importing route's try/catch existed, and both surfaced as
 * an unhandleable 500 (Next's production server renders its `/500` error page
 * when a route module throws at import time, so the reason never reached a log
 * or response this app controls):
 *
 *  1. Initialization: reading a missing/malformed FIREBASE_* value.
 *  2. Loading: the `firebase-admin` import itself failing — a version or
 *     platform mismatch, a broken install, a missing transitive dependency.
 *     This one is invisible locally when the deployment platform resolves a
 *     different dependency tree (e.g. Vercel installing with yarn while the
 *     repo also carries a package-lock.json).
 *
 * Deferring both into async functions means either failure reaches the caller
 * as an ordinary rejection, catchable and reportable. Routes that merely import
 * this module keep working; only the code paths that genuinely need Firebase
 * are affected — and for push notifications, which are best-effort by design,
 * that means an editor can still publish when the push stack is broken.
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

async function getAdminApp() {
    if (cachedApp) return cachedApp;

    const { cert, getApps, initializeApp } = await import('firebase-admin/app');

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

export async function getAdminAuth() {
    const { getAuth } = await import('firebase-admin/auth');
    return getAuth(await getAdminApp());
}

export async function getAdminMessaging() {
    const { getMessaging } = await import('firebase-admin/messaging');
    return getMessaging(await getAdminApp());
}
