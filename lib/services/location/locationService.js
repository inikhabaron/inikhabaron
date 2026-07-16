import { getLocationsCollection } from '@/lib/db/locations';
import { LOCATION_TYPES } from '@/lib/location/constants';
import { mapLocation } from '@/lib/services/location/locationMapper';

export async function getStates() {
  const collection = await getLocationsCollection();

  const documents = await collection
    .find({
      type: LOCATION_TYPES.STATE,
      isActive: true,
    })
    .sort({ order: 1, name: 1 })
    .project({
      id: 1,
      name: 1,
      nameHi: 1,
      slug: 1,
      _id: 0,
    })
    .toArray();

  return documents.map((location) => mapLocation(location, { includeSlug: true }));
}

export async function getDistricts(stateId) {
  if (!stateId) {
    throw new Error('stateId is required.');
  }

  const collection = await getLocationsCollection();

  const documents = await collection
    .find({
      type: LOCATION_TYPES.DISTRICT,
      parentId: stateId,
      isActive: true,
    })
    .sort({ order: 1, name: 1 })
    .project({
      id: 1,
      name: 1,
      nameHi: 1,
      slug: 1,
      _id: 0,
    })
    .toArray();

  return documents.map((location) => mapLocation(location, { includeSlug: false }));
}
