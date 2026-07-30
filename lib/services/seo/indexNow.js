import { SITE_URL } from '@/lib/seo/config';

/**
 * IndexNow — instantly notifies Bing, Yandex, Seznam and Naver (and therefore
 * Bing-powered AI like Microsoft Copilot) that a URL changed. One ping is shared
 * across all participating engines. Google does NOT use IndexNow (we cover
 * Google via the Indexing API), but this gets you fast coverage everywhere else.
 *
 * Required env (leave unset to disable — becomes a safe no-op):
 *   INDEXNOW_KEY   a self-generated key (any 8-128 hex chars). The same value is
 *                  served at /indexnow-key.txt so engines can verify ownership.
 */

const ENDPOINT = 'https://api.indexnow.org/indexnow';

export function getIndexNowKey() {
  return process.env.INDEXNOW_KEY || null;
}

export function isIndexNowConfigured() {
  return !!getIndexNowKey();
}

/**
 * Submit one or more URLs to IndexNow.
 * @param {string[]} urls  Absolute URLs on this site.
 */
export async function notifyIndexNow(urls) {
  try {
    const key = getIndexNowKey();
    if (!key) return false;
    const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
    if (!list.length) return false;

    const host = new URL(SITE_URL).host;
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${SITE_URL}/indexnow-key.txt`,
        urlList: list,
      }),
    });
    // IndexNow returns 200/202 on success.
    if (!res.ok && res.status !== 202) {
      console.error('[indexNow] error:', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[indexNow] notify failed:', err?.message);
    return false;
  }
}
