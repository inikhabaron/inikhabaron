'use client';

/**
 * Timing instrumentation for the login → session → first-authenticated-request
 * sequence. Development only; a no-op in production builds.
 *
 * This exists because the ordering here is a real bug class, not a curiosity:
 * every consumer of `user` treats it as "safe to call authenticated APIs", so
 * publishing it before the httpOnly `khabaron_session` cookie exists produces a
 * burst of 401s that only reproduces when the cookie is genuinely absent
 * (first sign-in, cleared cookies, expiry lapsed). Timestamps make that window
 * visible instead of leaving it to be re-diagnosed from symptoms.
 *
 * Read the output in DevTools console, filtered to `[session]`.
 */

const enabled = process.env.NODE_ENV !== 'production';
let t0 = null;

function stamp(label, detail) {
  if (!enabled || typeof performance === 'undefined') return;
  const now = performance.now();
  if (t0 === null) t0 = now;
  const since = (now - t0).toFixed(1);
  // eslint-disable-next-line no-console
  console.log(`[session] +${String(since).padStart(8)}ms  ${label}${detail ? '  ' + detail : ''}`);
}

/** Firebase resolved an auth state (sign-in restored or completed). */
export function markFirebaseAuthResolved(uid) {
  t0 = null; // start a fresh timeline per auth event
  stamp('firebase auth resolved', uid ? `uid=${String(uid).slice(0, 8)}…` : '(signed out)');
}

export function markSessionRequestStart() {
  stamp('POST /api/auth/session  started');
}

/**
 * The fetch promise resolving is the closest observable proxy for "Set-Cookie
 * processed": the browser commits Set-Cookie before the promise settles, and an
 * httpOnly cookie is by definition invisible to JS, so it cannot be asserted
 * directly from here. Verify the cookie itself in DevTools → Application.
 */
export function markSessionRequestEnd(status) {
  stamp('POST /api/auth/session  completed', `status=${status} (Set-Cookie committed by now)`);
}

export function markSessionReady() {
  stamp('sessionReady = true', '-> authenticated requests unblocked');
}

/** Called by the first authenticated fetch that the gate lets through. */
export function markFirstAuthedRequest(endpoint) {
  stamp('first authenticated request', endpoint);
}
