import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

export const FOLLOW_TYPE_FIELDS = Object.freeze({
  category: 'followedCategories',
  author: 'followedAuthors',
  city: 'followedCities',
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
    { projection: { followedCategories: 1, followedAuthors: 1, followedCities: 1 } }
  );

  const categorySlugs = user?.followedCategories || [];
  const authorIds = user?.followedAuthors || [];
  const cityNames = user?.followedCities || [];

  const [categoryDocs, authorDocs] = await Promise.all([
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
  ]);

  const categoryMap = new Map(categoryDocs.map((c) => [c.slug, c]));
  const authorMap = new Map(authorDocs.map((a) => [a.id, a]));

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
  };
}
