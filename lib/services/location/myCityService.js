import { getCollection } from '@/lib/mongodb';
import { buildLocationQuery } from './buildLocationQuery';

const DEFAULT_LOCATION = {
  enabled: false,
  scope: 'national',
  country: 'India',
};

/**
 * Returns the national + state + district feed for a user's saved
 * location, plus the meta describing which scope was applied. Shared by
 * My City, and intended for reuse by Personalized Feed / Home / push
 * notifications so location targeting stays consistent everywhere.
 */
export async function getMyCityFeed(user, { limit = 20 } = {}) {
  const location = user?.location || DEFAULT_LOCATION;

  const newsCollection = await getCollection('news');
  const query = buildLocationQuery(location);

  const articles = await newsCollection
    .find(query)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .toArray();

  return {
    articles,
    meta: {
      scope: location.scope || 'national',
      stateId: location.stateId || null,
      stateName: location.stateName || null,
      stateSlug: location.stateSlug || null,
      districtId: location.districtId || null,
      districtName: location.districtName || null,
      districtSlug: location.districtSlug || null,
    },
  };
}
