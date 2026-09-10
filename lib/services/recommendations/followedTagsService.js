import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

/**
 * followedTags on the user document stores tag ids (the generic Follow
 * pattern — see lib/services/follow/followService.js), but article.tags is
 * free text with no foreign key into the tags collection. Scoring needs
 * names to match against, so this resolves ids -> lowercased names once per
 * request rather than teaching the scorer about ids and names both.
 */
export async function getFollowedTagNames(followedTagIds = []) {
  if (!followedTagIds.length) return [];

  const tagsCollection = await getCollection(COLLECTIONS.TAGS);
  const docs = await tagsCollection
    .find({ id: { $in: followedTagIds } }, { projection: { _id: 0, name: 1 } })
    .toArray();

  return docs.map((doc) => doc.name.trim().toLowerCase());
}
