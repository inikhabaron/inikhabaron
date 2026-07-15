/**
 * SEO text utilities — title/description optimisation, keyword generation and
 * de-duplication, HTML stripping and plain-text extraction.
 *
 * These run on the server (inside generateMetadata / JSON-LD builders) so every
 * article is optimised automatically, with no manual editor intervention.
 */

import { SITE, SEO_LIMITS } from './config';

/** Strip HTML tags and collapse whitespace to plain text. */
export function stripHtml(html = '') {
  if (!html) return '';
  return String(html)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Truncate text on a word boundary, appending an ellipsis if cut. */
export function truncate(text = '', max = 160) {
  const clean = String(text).trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

/**
 * Build an SEO title. Appends " | Site Name" unless doing so would push the
 * title well past the SEO limit, in which case the bare (possibly trimmed)
 * headline is used so it isn't truncated by search engines.
 */
export function optimizeTitle(rawTitle, { withSuffix = true } = {}) {
  const base = (rawTitle || SITE.name).trim();
  const suffix = ` | ${SITE.name}`;
  if (!withSuffix) return truncate(base, SEO_LIMITS.titleMaxWithSuffix);

  if (base.length + suffix.length <= SEO_LIMITS.titleMaxWithSuffix) {
    return `${base}${suffix}`;
  }
  // Headline alone is long — trim it and skip the suffix to avoid a cut brand.
  if (base.length > SEO_LIMITS.titleMaxWithSuffix) {
    return truncate(base, SEO_LIMITS.titleMaxWithSuffix);
  }
  return base;
}

/**
 * Build an SEO meta description. Prefers an explicit description; otherwise
 * derives one from the article body. Length is optimised automatically.
 */
export function optimizeDescription(description, fallbackContent = '') {
  let text = stripHtml(description || '').trim();
  if (text.length < SEO_LIMITS.descriptionMin) {
    const body = stripHtml(fallbackContent || '').trim();
    if (body) text = text ? `${text} ${body}` : body;
  }
  if (!text) return SITE.description;
  return truncate(text, SEO_LIMITS.descriptionMax);
}

// Common English + Hindi stop words removed from auto-generated keywords.
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
  'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its',
  'let', 'put', 'say', 'she', 'too', 'use', 'that', 'this', 'with', 'from',
  'they', 'will', 'have', 'what', 'been', 'were', 'said', 'into', 'your', 'when',
  'them', 'than', 'then', 'some', 'over', 'also', 'more', 'most', 'such', 'only',
  'में', 'से', 'का', 'के', 'की', 'को', 'है', 'और', 'पर', 'यह', 'था', 'हैं', 'कर',
]);

/**
 * Generate a de-duplicated keyword list from an article's structured fields and
 * text. Mixes explicit signals (tags, category, entities) with mined n-grams
 * (long-tail / semantic keywords) so LLMs and search engines get rich context.
 */
export function generateKeywords({
  title = '',
  description = '',
  category = '',
  tags = [],
  entities = {},
  extra = [],
} = {}) {
  const keywords = [];

  const push = (value) => {
    if (!value) return;
    const v = String(value).trim();
    if (v.length < 2) return;
    keywords.push(v);
  };

  // 1. Highest-signal explicit fields first.
  (Array.isArray(tags) ? tags : []).forEach(push);
  push(category);
  (extra || []).forEach(push);

  // 2. Named entities (people / orgs / locations) — great for AI search.
  ['people', 'organizations', 'locations'].forEach((k) => {
    (entities?.[k] || []).forEach(push);
  });

  // 3. Mined single-word keywords from the title.
  const words = `${title} ${description}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  words.slice(0, 12).forEach(push);

  // 4. Two-word phrases from the title (long-tail keywords).
  const titleWords = title
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  for (let i = 0; i < titleWords.length - 1 && i < 8; i += 1) {
    const bigram = `${titleWords[i]} ${titleWords[i + 1]}`.trim();
    if (bigram.length > 6) push(bigram);
  }

  // De-duplicate case-insensitively, preserve first-seen order, cap at 25.
  const seen = new Set();
  const deduped = [];
  for (const kw of keywords) {
    const key = kw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(kw);
    if (deduped.length >= 25) break;
  }
  return deduped;
}

/** Estimated reading time in minutes from HTML/plain content. */
export function readingTimeMinutes(content = '') {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Word count of the article body (used in schema wordCount). */
export function wordCount(content = '') {
  return stripHtml(content).split(/\s+/).filter(Boolean).length;
}

/**
 * Validate/normalise a URL slug. Returns a clean, lowercase, hyphenated slug.
 */
export function normalizeSlug(input = '') {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}
