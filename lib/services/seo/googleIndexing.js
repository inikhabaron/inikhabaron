import crypto from 'crypto';

/**
 * Google Indexing API client — notifies Google the instant a URL is published
 * or removed so it gets crawled within minutes (critical for being credited as
 * the ORIGINAL source on breaking news).
 *
 * Auth uses a Google Cloud service account via the JWT-bearer OAuth2 flow,
 * signed with Node's built-in crypto (no external dependency).
 *
 * Required env (leave unset to disable — calls become safe no-ops):
 *   GOOGLE_INDEXING_CLIENT_EMAIL   service account email
 *   GOOGLE_INDEXING_PRIVATE_KEY    service account private key (PEM; \n escaped)
 *
 * Setup: create a service account in Google Cloud, enable the "Indexing API",
 * and add the service-account email as an *Owner* of the property in Google
 * Search Console. (Google officially supports JobPosting/BroadcastEvent here;
 * in practice it also prompts fast crawling of news URLs.)
 */

const SCOPE = 'https://www.googleapis.com/auth/indexing';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const PUBLISH_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

function getCredentials() {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;
  // Env-stored PEM keys usually have literal "\n" — restore real newlines.
  privateKey = privateKey.replace(/\\n/g, '\n');
  return { clientEmail, privateKey };
}

export function isIndexingConfigured() {
  return getCredentials() !== null;
}

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Cache the access token across warm invocations (~1h validity).
async function getAccessToken() {
  const creds = getCredentials();
  if (!creds) return null;

  const now = Math.floor(Date.now() / 1000);
  if (global._gIndexToken && global._gIndexTokenExp - 60 > now) {
    return global._gIndexToken;
  }

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({ iss: creds.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  );
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${claim}`)
    .sign(creds.privateKey);
  const assertion = `${header}.${claim}.${b64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    console.error('[googleIndexing] token error:', await res.text());
    return null;
  }
  const data = await res.json();
  global._gIndexToken = data.access_token;
  global._gIndexTokenExp = now + (data.expires_in || 3600);
  return global._gIndexToken;
}

/**
 * Notify Google that a URL was updated or deleted.
 * @param {string} url  Absolute canonical URL.
 * @param {'URL_UPDATED'|'URL_DELETED'} type
 * @returns {Promise<boolean>} success
 */
export async function notifyGoogle(url, type = 'URL_UPDATED') {
  try {
    if (!url) return false;
    const token = await getAccessToken();
    if (!token) return false;

    const res = await fetch(PUBLISH_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type }),
    });
    if (!res.ok) {
      console.error('[googleIndexing] publish error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[googleIndexing] notify failed:', err?.message);
    return false;
  }
}
