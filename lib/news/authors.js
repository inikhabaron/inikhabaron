// The one place that knows an article can carry its byline in two shapes.
//
// New shape (written by the admin news form):
//   authors: [{ name, image }, ...]
// Legacy shape (every article created before per-article author photos):
//   authorName / author / writer / byline  +  authorAvatar
//
// Everything that renders or describes a byline — the article page, the home
// modal, JSON-LD, OpenGraph, RSS — goes through getArticleAuthors() so old
// articles keep working without a migration and no caller has to remember the
// fallback chain. Pure functions, no DB or React, so both server and client
// code can import this.

// Covers virtually every real byline, including co-reported investigations.
// Enforced in the form (the "Add Another Author" button disappears at the
// limit) and again server-side, so a crafted payload can't exceed it either.
export const MAX_AUTHORS = 5;

/**
 * Display-ready byline for an article, oldest-shape-tolerant.
 * @returns {Array<{ name: string, image: string|null }>} possibly empty
 */
export function getArticleAuthors(article) {
  if (!article) return [];

  if (Array.isArray(article.authors) && article.authors.length) {
    const authors = article.authors
      .map((a) => ({
        name: typeof a?.name === 'string' ? a.name.trim() : '',
        image: typeof a?.image === 'string' && a.image.trim() ? a.image.trim() : null,
      }))
      .filter((a) => a.name);
    if (authors.length) return authors;
    // An authors array that holds nothing usable (all blank names) falls
    // through to the legacy fields rather than rendering an empty byline.
  }

  const legacyName = article.authorName || article.author || article.writer || article.byline;
  if (!legacyName) return [];

  return [{
    name: String(legacyName).trim(),
    // authorAvatar is the old profile-photo snapshot. Still honoured for
    // articles written before per-article photos existed.
    image: article.authorAvatar || null,
  }];
}

/**
 * Sanitizes what the admin form posts before it reaches MongoDB. Returns null
 * when there is nothing worth storing, so callers can leave the field off the
 * document entirely rather than writing an empty array.
 */
export function normalizeAuthorsInput(input) {
  if (!Array.isArray(input)) return null;

  const authors = input
    .map((a) => ({
      name: typeof a?.name === 'string' ? a.name.trim() : '',
      image: typeof a?.image === 'string' && a.image.trim() ? a.image.trim() : null,
    }))
    .filter((a) => a.name)
    .slice(0, MAX_AUTHORS);

  return authors.length ? authors : null;
}

/**
 * "A", "A and B", "A, B and C" — for plain-text bylines (RSS, meta tags,
 * aria-labels) where the structured list isn't available.
 */
export function formatAuthorNames(authors) {
  const names = (authors || []).map((a) => a.name).filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * "John Doe • Jane Smith" — the compact byline used on social cards, where
 * the prose form ("and") reads oddly next to a headline and space is tight.
 */
export function joinAuthorNames(authors, separator = ' • ') {
  return (authors || []).map((a) => a.name).filter(Boolean).join(separator);
}

/**
 * The single name legacy consumers still read off the document
 * (`authorName`): editorial calendar filters, the admin list column, the
 * recommendation scorer. Kept in sync on write so nothing downstream has to
 * learn about the array.
 */
export function primaryAuthorName(authors) {
  return authors?.[0]?.name || '';
}
