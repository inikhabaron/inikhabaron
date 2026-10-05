/**
 * Server-side data access for SEO / SSR.
 *
 * These helpers query MongoDB directly (via lib/mongodb) instead of doing an
 * HTTP self-fetch to /api/*. That makes server rendering faster and more
 * reliable (no localhost round-trip), and lets us render article content in the
 * initial HTML so it is crawlable by search engines and AI agents that don't
 * execute JavaScript.
 *
 * Everything returned is JSON-serialisable (Mongo _id dropped, Dates → ISO
 * strings) so it can be passed as props into client components.
 */

import { cache } from 'react';
import { getCollection } from '@/lib/mongodb';
import { timeAsync } from '@/lib/perf/perfLog';

/** Convert a Mongo document into a plain, serialisable object. */
// Internal editorial fields. Every public article LIST already projects these
// out (see LIST_EXCLUDE_PROJECTION in app/api/news/route.js); the single-article
// reads below did not, so the article page's HTML carried the full previous
// bodies of every edit (a corrected mistake stayed readable in the page source),
// the reviewers' internal notes and staff ids. Nothing public reads them.
export const INTERNAL_ARTICLE_FIELDS = ['versionHistory', 'approvalHistory', 'corrections', 'headlineVariants'];

export function serialize(doc) {
  if (!doc) return null;
  const { _id, password, ...rest } = doc;
  for (const field of INTERNAL_ARTICLE_FIELDS) delete rest[field];
  const out = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value instanceof Date) out[key] = value.toISOString();
    else if (Array.isArray(value)) out[key] = value.map((v) => (v instanceof Date ? v.toISOString() : v));
    else out[key] = value;
  }
  return out;
}

const PUBLISHED = () => ({ status: 'published', publishedAt: { $lte: new Date() } });

/**
 * Fetch a single published (or any-status, for preview) article by id.
 * Wrapped in React's cache() so generateMetadata() and the page body (both
 * of which call this with the same id) share one Mongo round trip per
 * request instead of two.
 */
export const getArticle = cache(async function getArticle(id) {
  if (!id) return null;
  try {
    const news = await getCollection('news');
    const doc = await news.findOne({ id });
    if (!doc) return null;

    // The author photo is deliberately NOT re-resolved from the user profile
    // here any more — see the same note in app/api/news/[id]/route.js. An
    // article keeps the byline photo it was published with; the byline lives
    // on the article in `authors: [{ name, image }]` and is read through
    // lib/news/authors.js.
    return serialize(doc);
  } catch (err) {
    console.error('[seo/data] getArticle failed:', err.message);
    return null;
  }
});

/**
 * Latest published articles (optionally filtered by category), newest first.
 * Wrapped in React's cache() for the same reason as getArticle above.
 */
/**
 * `projection` defaults to full documents (the original behaviour — RSS and
 * the newsletter both need `content`/`excerpt`). Callers that only need
 * list-view fields (a sidebar, a JSON-LD ItemList) should pass one — those
 * results get seeded straight into a client component's initial props/state,
 * and an unprojected article carries its entire HTML `content` body, which
 * measurably bloats the page: on the article page, passing 8 full articles
 * into NewsClient's initial props was the dominant contributor to a 4.6MB
 * response (Twitter's card validator failed with "response too large";
 * WhatsApp/Facebook's crawlers tolerated it, Twitter's didn't).
 */
export const getLatestArticles = cache(async function getLatestArticles({ limit = 12, category, excludeId, projection } = {}) {
  try {
    return await timeAsync('getLatestArticles() [homepage SSR data loader]', async () => {
      const news = await getCollection('news');
      const query = PUBLISHED();
      if (category && category !== 'all') query.category = category;
      if (excludeId) query.id = { $ne: excludeId };
      const docs = await timeAsync('news.find() (getLatestArticles)', () =>
        news
          .find(query, projection ? { projection } : undefined)
          .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
          .limit(limit)
          .toArray()
      );
      return docs.map(serialize);
    });
  } catch (err) {
    console.error('[seo/data] getLatestArticles failed:', err.message);
    return [];
  }
});

/** Field set a "latest news" sidebar/list card actually renders — see
 * components/home/LatestNews.jsx and components/home/MobileSearch.jsx. */
export const LATEST_NEWS_CARD_PROJECTION = { id: 1, title: 1, category: 1, publishedAt: 1, featuredImage: 1 };

/** Most-viewed published articles (by the `views` counter). */
export async function getTopViewedArticles({ limit = 10 } = {}) {
  try {
    const news = await getCollection('news');
    const docs = await news
      .find(PUBLISHED())
      .sort({ views: -1, publishedAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(serialize);
  } catch (err) {
    console.error('[seo/data] getTopViewedArticles failed:', err.message);
    return [];
  }
}

/** Published breaking-news articles, newest first. */
export async function getBreakingArticles({ limit = 10 } = {}) {
  try {
    const news = await getCollection('news');
    const docs = await news
      .find({ ...PUBLISHED(), isBreaking: true })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(serialize);
  } catch (err) {
    console.error('[seo/data] getBreakingArticles failed:', err.message);
    return [];
  }
}

/** Published featured articles, newest first. */
export async function getFeaturedArticles({ limit = 10 } = {}) {
  try {
    const news = await getCollection('news');
    const docs = await news
      .find({ ...PUBLISHED(), isFeatured: true })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(serialize);
  } catch (err) {
    console.error('[seo/data] getFeaturedArticles failed:', err.message);
    return [];
  }
}

/** Articles in a category, with total count for pagination. */
export async function getArticlesByCategory(category, { page = 1, limit = 12 } = {}) {
  try {
    const news = await getCollection('news');
    const query = { ...PUBLISHED(), category };
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      news.find(query).sort({ publishedAt: -1, _id: -1 }).skip(skip).limit(limit).toArray(),
      news.countDocuments(query),
    ]);
    return { articles: docs.map(serialize), total, pages: Math.ceil(total / limit) };
  } catch (err) {
    console.error('[seo/data] getArticlesByCategory failed:', err.message);
    return { articles: [], total: 0, pages: 0 };
  }
}

/** Active categories. */
export async function getCategories() {
  try {
    const col = await getCollection('categories');
    const docs = await col.find({ isActive: true }).sort({ order: 1 }).toArray();
    const seen = new Set();
    return docs.filter((c) => (seen.has(c.slug) ? false : seen.add(c.slug))).map(serialize);
  } catch (err) {
    console.error('[seo/data] getCategories failed:', err.message);
    return [];
  }
}

/** Single active category by slug. */
export async function getCategory(slug) {
  try {
    const col = await getCollection('categories');
    const doc = await col.findOne({ slug });
    return doc ? serialize(doc) : null;
  } catch (err) {
    console.error('[seo/data] getCategory failed:', err.message);
    return null;
  }
}

/** Single active tag ("topic") by slug — the entity /topics/[slug] renders. */
export async function getTag(slug) {
  try {
    const col = await getCollection('tags');
    const doc = await col.findOne({ slug, isActive: true });
    return doc ? serialize(doc) : null;
  } catch (err) {
    console.error('[seo/data] getTag failed:', err.message);
    return null;
  }
}

/**
 * Articles for a topic page, with total count for pagination. Deliberately
 * the same $text mechanism as the Trending Bar's click-through and
 * getFollowedTopicsFeed (lib/services/follow/followService.js) rather than
 * an exact `tags: {$in:[tagName]}` match — news.tags is free text with no
 * foreign key into the tags collection (see docs/mvp3-phase1-architecture.md,
 * Topic vs. Tag), so an exact match would silently miss articles whose tags
 * were typed with different casing/spacing.
 */
export async function getArticlesByTag(tagName, { page = 1, limit = 12, excludeId } = {}) {
  try {
    const news = await getCollection('news');
    const query = { ...PUBLISHED(), $text: { $search: tagName } };
    if (excludeId) query.id = { $ne: excludeId };
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      news
        .find(query, { projection: { score: { $meta: 'textScore' } } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .toArray(),
      news.countDocuments(query),
    ]);
    return { articles: docs.map(serialize), total, pages: Math.ceil(total / limit) };
  } catch (err) {
    console.error('[seo/data] getArticlesByTag failed:', err.message);
    return { articles: [], total: 0, pages: 0 };
  }
}

/**
 * The first of an article's free-text tags that matches a real, active
 * topic (tags collection) — same name-normalized matching NewsClient.js's
 * tagsByName/followingTagIds already use, for the same reason (no foreign
 * key from news.tags into the tags collection). Backs "More From This
 * Topic": most articles have several tags, but only one section is shown.
 */
export async function getFirstMatchingTag(tagNames = []) {
  if (!Array.isArray(tagNames) || !tagNames.length) return null;
  try {
    const col = await getCollection('tags');
    const wanted = new Set(tagNames.map((t) => String(t).trim().toLowerCase()));
    const docs = await col.find({ isActive: true }, { projection: { _id: 0 } }).toArray();
    const match = docs.find((doc) => wanted.has(String(doc.name).trim().toLowerCase()));
    return match ? serialize(match) : null;
  } catch (err) {
    console.error('[seo/data] getFirstMatchingTag failed:', err.message);
    return null;
  }
}

/** An author (editorial user) plus a page of their published articles. */
export async function getAuthorWithArticles(id, { page = 1, limit = 20 } = {}) {
  try {
    const users = await getCollection('users');
    const author = await users.findOne({ id, role: { $in: ['reporter', 'editor', 'admin'] } });
    if (!author) return null;
    const news = await getCollection('news');
    const query = { authorId: id, ...PUBLISHED() };
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      news.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit).toArray(),
      news.countDocuments(query),
    ]);
    return {
      author: serialize(author),
      articles: docs.map(serialize),
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (err) {
    console.error('[seo/data] getAuthorWithArticles failed:', err.message);
    return null;
  }
}

/**
 * Distinct authorIds with at least one published article, for the sitemap —
 * mirrors the identity getAuthorWithArticles uses (authorId, not the
 * unlinked authors[] byline array).
 */
export async function getAuthorsForSitemap() {
  try {
    const news = await getCollection('news');
    const ids = await news.distinct('authorId', PUBLISHED());
    return ids.filter(Boolean);
  } catch (err) {
    console.error('[seo/data] getAuthorsForSitemap failed:', err.message);
    return [];
  }
}

/** Articles per article-sitemap file (protocol max is 50,000 URLs / 50MB). */
export const SITEMAP_CHUNK_SIZE = 10000;

/** Number of published articles — sizes the sitemap index. */
export async function countPublishedArticles() {
  try {
    const news = await getCollection('news');
    return await news.countDocuments(PUBLISHED());
  } catch (err) {
    console.error('[seo/data] countPublishedArticles failed:', err.message);
    return 0;
  }
}

/**
 * Published articles for sitemaps, light fields only.
 *
 * Without `sinceHours` this pages oldest-first (`skip`/`limit`), so every chunk
 * except the last is frozen once written — old sitemap files never shift when
 * new stories are published. With `sinceHours` (the Google News sitemap) it is
 * newest-first.
 */
export async function getArticlesForSitemap({ limit = SITEMAP_CHUNK_SIZE, skip = 0, sinceHours } = {}) {
  try {
    const news = await getCollection('news');
    const query = PUBLISHED();
    if (sinceHours) {
      query.publishedAt = {
        $lte: new Date(),
        $gte: new Date(Date.now() - sinceHours * 60 * 60 * 1000),
      };
    }
    const docs = await news
      .find(query, {
        projection: {
          id: 1, title: 1, publishedAt: 1, updatedAt: 1,
          featuredImage: 1, category: 1, language: 1, tags: 1,
        },
      })
      .sort(sinceHours ? { publishedAt: -1 } : { publishedAt: 1 })
      .skip(skip)
      .limit(limit)
      // Deep skip + ascending sort can make Mongo's planner try an in-memory
      // sort over full documents and abort at 32MB; let it spill to disk.
      .allowDiskUse(true)
      .toArray();
    return docs.map(serialize);
  } catch (err) {
    console.error('[seo/data] getArticlesForSitemap failed:', err.message);
    return [];
  }
}

/** Newest publishedAt per category slug, so category sitemap entries carry a real lastmod. */
export async function getCategoryLastModified() {
  try {
    const news = await getCollection('news');
    const rows = await news
      .aggregate([
        { $match: PUBLISHED() },
        { $group: { _id: '$category', lastmod: { $max: '$publishedAt' } } },
      ])
      .toArray();
    return Object.fromEntries(rows.map((r) => [r._id, r.lastmod]));
  } catch (err) {
    console.error('[seo/data] getCategoryLastModified failed:', err.message);
    return {};
  }
}

/** Same as above, keyed by authorId. */
export async function getAuthorLastModified() {
  try {
    const news = await getCollection('news');
    const rows = await news
      .aggregate([
        { $match: PUBLISHED() },
        { $group: { _id: '$authorId', lastmod: { $max: '$publishedAt' } } },
      ])
      .toArray();
    return Object.fromEntries(rows.filter((r) => r._id).map((r) => [r._id, r.lastmod]));
  } catch (err) {
    console.error('[seo/data] getAuthorLastModified failed:', err.message);
    return {};
  }
}

/** Active topic slugs for the sitemap. */
export async function getTagsForSitemap() {
  try {
    const col = await getCollection('tags');
    const docs = await col.find({ isActive: true }, { projection: { slug: 1, updatedAt: 1 } }).toArray();
    return docs.filter((t) => t.slug).map(serialize);
  } catch (err) {
    console.error('[seo/data] getTagsForSitemap failed:', err.message);
    return [];
  }
}

/**
 * First page of the homepage feed, shaped exactly like GET /api/news (same
 * filter, sort and list projection) so HomeClient can render real headlines in
 * the server HTML and skip its first client fetch.
 */
export const getHomeFeed = cache(async function getHomeFeed({ category, limit = 20 } = {}) {
  try {
    const news = await getCollection('news');
    const query = PUBLISHED();
    if (category && category !== 'all') query.category = category;
    const [docs, total] = await Promise.all([
      news
        .find(query, { projection: { approvalHistory: 0, headlineVariants: 0, versionHistory: 0, corrections: 0 } })
        .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
        .limit(limit)
        .toArray(),
      news.countDocuments(query),
    ]);
    return { news: docs.map(serialize), pages: Math.ceil(total / limit) };
  } catch (err) {
    console.error('[seo/data] getHomeFeed failed:', err.message);
    return null;
  }
});
