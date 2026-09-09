import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

export const FOLLOW_TYPE_FIELDS = Object.freeze({
  category: 'followedCategories',
  author: 'followedAuthors',
  city: 'followedCities',
  // Topic Follow reuses the existing tags collection rather than a new
  // "topic" entity — see docs/mvp3-phase1-architecture.md's Topic vs. Tag
  // section. Followed by tags.id, same as author is followed by authorId.
  tag: 'followedTags',
});

export function isValidFollowType(type) {
  return Object.prototype.hasOwnProperty.call(FOLLOW_TYPE_FIELDS, type);
}

export async function follow(userId, type, id) {
  const field = FOLLOW_TYPE_FIELDS[type];
  const usersCollection = await getCollection(COLLECTIONS.USERS);

  await usersCollection.updateOne(
    { id: userId },
    { $addToSet: { [field]: id }, $set: { updatedAt: new Date() } }
  );

  return { following: true };
}

export async function unfollow(userId, type, id) {
  const field = FOLLOW_TYPE_FIELDS[type];
  const usersCollection = await getCollection(COLLECTIONS.USERS);

  await usersCollection.updateOne(
    { id: userId },
    { $pull: { [field]: id }, $set: { updatedAt: new Date() } }
  );

  return { following: false };
}

export async function getFollowing(userId) {
  const usersCollection = await getCollection(COLLECTIONS.USERS);

  const user = await usersCollection.findOne(
    { id: userId },
    { projection: { followedCategories: 1, followedAuthors: 1, followedCities: 1, followedTags: 1 } }
  );

  const categorySlugs = user?.followedCategories || [];
  const authorIds = user?.followedAuthors || [];
  const cityNames = user?.followedCities || [];
  const tagIds = user?.followedTags || [];

  const [categoryDocs, authorDocs, tagDocs] = await Promise.all([
    categorySlugs.length
      ? (await getCollection(COLLECTIONS.CATEGORIES))
          .find({ slug: { $in: categorySlugs } })
          .project({ _id: 0, slug: 1, name: 1, nameHi: 1, color: 1 })
          .toArray()
      : [],
    authorIds.length
      ? usersCollection
          .find({ id: { $in: authorIds } })
          .project({ _id: 0, id: 1, name: 1, avatar: 1 })
          .toArray()
      : [],
    tagIds.length
      ? (await getCollection(COLLECTIONS.TAGS))
          .find({ id: { $in: tagIds } })
          .project({ _id: 0, id: 1, name: 1, slug: 1, color: 1 })
          .toArray()
      : [],
  ]);

  const categoryMap = new Map(categoryDocs.map((c) => [c.slug, c]));
  const authorMap = new Map(authorDocs.map((a) => [a.id, a]));
  const tagMap = new Map(tagDocs.map((t) => [t.id, t]));

  return {
    categories: categorySlugs.map((slug) => {
      const doc = categoryMap.get(slug);
      return doc
        ? { id: doc.slug, name: doc.name, nameHi: doc.nameHi, color: doc.color, exists: true }
        : { id: slug, exists: false };
    }),
    authors: authorIds.map((id) => {
      const doc = authorMap.get(id);
      return doc
        ? { id: doc.id, name: doc.name, avatar: doc.avatar, exists: true }
        : { id, exists: false };
    }),
    cities: cityNames.map((name) => ({ id: name, name, exists: true })),
    tags: tagIds.map((id) => {
      const doc = tagMap.get(id);
      return doc
        ? { id: doc.id, name: doc.name, slug: doc.slug, color: doc.color, exists: true }
        : { id, exists: false };
    }),
  };
}

// Articles matching the tags a user follows, for the Topic Follow feed.
// Deliberately reuses the exact mechanism already powering the Trending
// Bar's click-through (GET /api/news?search=<tag>, the news_text_search
// $text index) rather than an exact `news.tags: {$in:[...]}` match —
// news.tags is free text with no foreign key into the tags collection, so
// an exact match would silently miss articles whose tags were typed with
// different casing/spacing. $text with a space-separated search string is
// an OR across terms, so this naturally becomes "articles matching any
// followed tag name," ranked by relevance like any other search.
export async function getFollowedTopicsFeed(userId, { page = 1, limit = 20 } = {}) {
  const usersCollection = await getCollection(COLLECTIONS.USERS);
  const user = await usersCollection.findOne(
    { id: userId },
    { projection: { followedTags: 1 } }
  );

  const tagIds = user?.followedTags || [];
  const emptyResult = { news: [], pagination: { page, limit, total: 0, pages: 0 } };

  if (!tagIds.length) return emptyResult;

  const tagDocs = await (await getCollection(COLLECTIONS.TAGS))
    .find({ id: { $in: tagIds } })
    .project({ _id: 0, name: 1 })
    .toArray();

  const searchTerms = tagDocs.map((t) => t.name).filter(Boolean).join(' ');
  if (!searchTerms) return emptyResult;

  const newsCollection = await getCollection(COLLECTIONS.NEWS);
  const skip = (page - 1) * limit;
  const query = {
    status: 'published',
    publishedAt: { $lte: new Date() },
    $text: { $search: searchTerms },
  };
  // Same list-view exclusions as GET /api/news (app/api/news/route.js).
  const projection = {
    approvalHistory: 0,
    headlineVariants: 0,
    versionHistory: 0,
    corrections: 0,
    score: { $meta: 'textScore' },
  };

  const [news, total] = await Promise.all([
    newsCollection
      .find(query, { projection })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .toArray(),
    newsCollection.countDocuments(query),
  ]);

  return { news, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
