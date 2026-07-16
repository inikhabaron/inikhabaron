import fs from 'fs';
import path from 'path';

import { getCollection } from '../lib/mongodb.js';

const GENERATED_FILE = path.join(
  process.cwd(),
  'data',
  'generated',
  'locations.json'
);

async function seedLocations() {
  try {
    console.log('📖 Reading generated locations...');

    const { locations } = JSON.parse(
      fs.readFileSync(GENERATED_FILE, 'utf8')
    );

    if (!Array.isArray(locations)) {
      throw new Error('Invalid locations.json format.');
    }

    const COLLECTION_NAME = 'locations';

    const collection = await getCollection(COLLECTION_NAME);

    console.log('🗑 Rebuilding locations collection...');
    await collection.drop().catch(() => {});

    const freshCollection = await getCollection(COLLECTION_NAME);

    console.log(`📥 Importing ${locations.length} locations...`);

    const documents = locations.map((location) => ({
      ...location,
      createdAt: location.createdAt
        ? new Date(location.createdAt)
        : new Date(),
      updatedAt: location.updatedAt
        ? new Date(location.updatedAt)
        : new Date(),
    }));

    await freshCollection.insertMany(documents);

    console.log(
      `✅ Successfully imported ${documents.length} locations.`
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Location seeding failed.');
    console.error(error);

    process.exit(1);
  }
}

seedLocations();