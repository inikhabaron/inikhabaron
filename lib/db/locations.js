import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

let initialized = false;

export async function getLocationsCollection() {
  const collection = await getCollection(COLLECTIONS.LOCATIONS);

  if (!initialized) {
    await Promise.all([
      collection.createIndex(
        { type: 1, parentId: 1, order: 1 },
        { name: 'type_parent_order_idx' }
      ),

      collection.createIndex(
        { slug: 1 },
        { unique: true, name: 'slug_unique_idx' }
      ),

      collection.createIndex(
        { id: 1 },
        { unique: true, name: 'id_unique_idx' }
      ),

      collection.createIndex(
        { parentId: 1 },
        { name: 'parent_idx' }
      ),

      collection.createIndex(
        { isActive: 1 },
        { name: 'active_idx' }
      ),
    ]);

    initialized = true;
  }

  return collection;
}