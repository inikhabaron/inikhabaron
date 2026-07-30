import { articleUrl } from '@/lib/seo/config';
import { notifyGoogle } from './googleIndexing';
import { notifyIndexNow } from './indexNow';

/**
 * Central "tell the search engines a story just changed" helper.
 *
 * Fire-and-forget and fully error-safe: never throws, never blocks the response.
 * Call it right after an article is published or updated.
 *
 * @param {object|string} article  An article object (uses its id) or an absolute URL.
 * @param {{ deleted?: boolean }} opts
 */
export function pingArticle(article, opts = {}) {
  try {
    const url = typeof article === 'string' ? article : articleUrl(article);
    if (!url) return;
    const type = opts.deleted ? 'URL_DELETED' : 'URL_UPDATED';

    // Run both notifications in the background; log but never surface errors.
    Promise.allSettled([
      notifyGoogle(url, type),
      notifyIndexNow([url]),
    ]).then((results) => {
      const [g, i] = results;
      if (g.status === 'fulfilled' && g.value === false && i.status === 'fulfilled' && i.value === false) {
        // Both no-op'd — likely not configured yet. Quiet by design.
      }
    }).catch(() => {});
  } catch (err) {
    console.error('[searchPing] pingArticle failed:', err?.message);
  }
}

/** Ping many articles at once (e.g. scheduled auto-publish batch). */
export function pingArticles(articles = []) {
  for (const a of articles) pingArticle(a);
}
