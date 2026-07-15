import { NextResponse } from 'next/server';

/**
 * CORS handling with an origin allowlist instead of a blanket `*`.
 *
 * Allowed origins come from CORS_ORIGINS (comma-separated) plus the site URL.
 * Same-origin requests (your own site) and non-browser clients (mobile apps,
 * which don't send an Origin header) are unaffected. Only cross-origin browser
 * requests from unknown sites are now blocked — which is the point.
 */
const ALLOWED_ORIGINS = new Set(
  [
    ...(process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()),
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://www.inikhabaron.com',
    'https://inikhabaron.com',
  ].filter(Boolean)
);

const BASE_CORS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
  Vary: 'Origin',
};

/** Resolve the Access-Control-Allow-Origin value for a given request. */
function corsHeadersFor(request) {
  const origin = request?.headers?.get?.('origin');
  // Reflect the origin only when it is explicitly allowed.
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return { ...BASE_CORS, 'Access-Control-Allow-Origin': origin };
  }
  // No Origin header (same-origin / server-to-server / mobile) → no CORS needed.
  return { ...BASE_CORS };
}

// Back-compat export (some routes import corsHeaders directly). Defaults to the
// primary site origin.
export const corsHeaders = {
  ...BASE_CORS,
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || 'https://www.inikhabaron.com',
};

export function json(data, init = {}) {
  const { status, headers: extraHeaders, request } = init;
  return NextResponse.json(data, {
    status,
    headers: { ...(request ? corsHeadersFor(request) : corsHeaders), ...(extraHeaders || {}) },
  });
}

export function preflight(request) {
  return NextResponse.json({}, { headers: corsHeadersFor(request) });
}
