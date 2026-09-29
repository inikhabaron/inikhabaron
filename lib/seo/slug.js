/**
 * Article URL slugs.
 *
 * Canonical article path: /news/<title-slug>-<id>   (id = the article's uuid)
 *
 * The uuid is always the tail of the path segment, so lookup never depends on
 * the slug: no slug column, no backfill, no collisions. The slug part is
 * derived from the current title, and the article page 301s any other spelling
 * (old /news/<uuid> links, a stale slug after a headline edit) to the canonical
 * one. Pure and dependency-free so client components can import it too.
 */

const UUID_TAIL = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
// Non-Latin slugs percent-encode to ~9 bytes per character in shared links,
// so they are capped much shorter.
const MAX_SLUG_CHARS = 70;
const MAX_SLUG_CHARS_NON_LATIN = 40;

/**
 * Lowercased words joined with hyphens. Keeps letters/digits from any script
 * (Hindi headlines stay Devanagari — browsers and Google show them decoded),
 * drops punctuation, and cuts on a word boundary.
 */
export function slugify(title = '') {
  const words = String(title)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let slug = '';
  for (const word of words) {
    const next = slug ? `${slug}-${word}` : word;
    const limit = /[^\x00-\x7f]/.test(next) ? MAX_SLUG_CHARS_NON_LATIN : MAX_SLUG_CHARS;
    if (next.length > limit) break;
    slug = next;
  }
  return slug;
}

/** Canonical path for an article, e.g. /news/some-headline-<uuid>. */
export function articlePath(article) {
  if (!article?.id) return '/news';
  const slug = slugify(article.title);
  return `/news/${slug ? `${slug}-` : ''}${article.id}`;
}

/**
 * Split the [id] route param into the article id and whatever slug preceded
 * it. A param with no uuid tail is treated as a bare (legacy) id.
 */
export function parseArticleParam(param = '') {
  let decoded = String(param);
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // malformed escape — use as-is
  }
  const match = decoded.match(UUID_TAIL);
  if (!match) return { id: decoded, slug: '' };
  return { id: match[1], slug: decoded.slice(0, -match[1].length).replace(/-$/, '') };
}
