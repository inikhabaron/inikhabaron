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

import { getCollection } from '@/lib/mongodb';

/** Convert a Mongo document into a plain, serialisable object. */
export function serialize(doc) {
  if (!doc) return null;
  const { _id, password, ...rest } = doc;
  const out = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value instanceof Date) out[key] = value.toISOString();
    else if (Array.isArray(value)) out[key] = value.map((v) => (v instanceof Date ? v.toISOString() : v));
    else out[key] = value;
  }
  return out;
}

const PUBLISHED = () => ({ status: 'published', publishedAt: { $lte: new Date() } });

/** Fetch a single published (or any-status, for preview) article by id. */
export async function getArticle(id) {
  if (!id) return null;
  try {
    const news = await getCollection('news');
    const doc = await news.findOne({ id });
    if (!doc || doc.status !== 'published') return doc ? serialize(doc) : null;
    return serialize(doc);
  } catch (err) {
    console.error('[seo/data] getArticle failed:', err.message);
    return null;
  }
}

/** Latest published articles (optionally filtered by category), newest first. */
export async function getLatestArticles({ limit = 12, category, excludeId } = {}) {
  try {
    const news = await getCollection('news');
    const query = PUBLISHED();
    if (category && category !== 'all') query.category = category;
    if (excludeId) query.id = { $ne: excludeId };
    const docs = await news
      .find(query)
      .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();
    return docs.map(serialize);
  } catch (err) {
    console.error('[seo/data] getLatestArticles failed:', err.message);
    return [];
  }
}

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

/** An author (editorial user) plus their published articles. */
export async function getAuthorWithArticles(id, { limit = 20 } = {}) {
  try {
    const users = await getCollection('users');
    const author = await users.findOne({ id, role: { $in: ['reporter', 'editor', 'admin'] } });
    if (!author) return null;
    const news = await getCollection('news');
    const docs = await news
      .find({ authorId: id, ...PUBLISHED() })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .toArray();
    return { author: serialize(author), articles: docs.map(serialize) };
  } catch (err) {
    console.error('[seo/data] getAuthorWithArticles failed:', err.message);
    return null;
  }
}

/**
 * All published articles for sitemaps. Returns only the light fields needed to
 * build sitemap / news-sitemap / image-sitemap entries.
 */
export async function getArticlesForSitemap({ limit = 5000, sinceHours } = {}) {
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
      .sort({ publishedAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(serialize);
  } catch (err) {
    console.error('[seo/data] getArticlesForSitemap failed:', err.message);
    return [];
  }
}
