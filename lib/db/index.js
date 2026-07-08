import { getCollection } from '@/lib/mongodb';

const initializedCollections = new Set();

export async function getDbCollection(name, indexes = []) {
  const collection = await getCollection(name);

  if (!initializedCollections.has(name)) {
    for (const index of indexes) {
      await collection.createIndex(
        index.keys,
        index.options || {}
      );
    }

    initializedCollections.add(name);
  }

  return collection;
}