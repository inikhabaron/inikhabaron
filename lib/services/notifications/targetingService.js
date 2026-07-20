import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { FOLLOW_TYPE_FIELDS } from '@/lib/services/follow/followService';

// A user with preferences.notifications explicitly set to false is opted
// out of every push, regardless of targeting mode. Absent/true both count
// as opted-in (matches how the field is only ever written by an explicit
// Settings toggle, never defaulted on the user document).
const NOTIFICATIONS_ENABLED_FILTER = { 'preferences.notifications': { $ne: false } };

async function resolveByCategory(category) {
  if (!category) return [];
  const users = await getCollection(COLLECTIONS.USERS);
  const docs = await users
    .find({ followedCategories: category, ...NOTIFICATIONS_ENABLED_FILTER })
    .project({ id: 1 })
    .toArray();
  return docs.map((d) => d.id);
}

async function resolveByLocation(location) {
  if (!location) return [];
  const users = await getCollection(COLLECTIONS.USERS);
  const cityField = FOLLOW_TYPE_FIELDS.city;

  const or = [];
  if (location.districtId) or.push({ 'location.districtId': location.districtId });
  if (location.stateId) or.push({ 'location.stateId': location.stateId });
  if (location.districtName) or.push({ [cityField]: location.districtName });
  if (location.stateName) or.push({ [cityField]: location.stateName });
  if (!or.length) return [];

  const docs = await users
    .find({ $or: or, ...NOTIFICATIONS_ENABLED_FILTER })
    .project({ id: 1 })
    .toArray();
  return docs.map((d) => d.id);
}

async function resolveAll() {
  const users = await getCollection(COLLECTIONS.USERS);
  const docs = await users.find(NOTIFICATIONS_ENABLED_FILTER).project({ id: 1 }).toArray();
  return docs.map((d) => d.id);
}

export async function resolveTargetUserIds(targeting) {
  const { mode, category, location } = targeting || {};

  switch (mode) {
    case 'category':
      return resolveByCategory(category);
    case 'location':
      return resolveByLocation(location);
    case 'category_or_location': {
      const [byCategory, byLocation] = await Promise.all([
        resolveByCategory(category),
        resolveByLocation(location),
      ]);
      return [...new Set([...byCategory, ...byLocation])];
    }
    case 'all':
    default:
      return resolveAll();
  }
}
