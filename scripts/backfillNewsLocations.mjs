import { getCollection } from '../lib/mongodb.js';

const DEFAULT_LOCATION = {
  enabled: false,
  scope: 'national',
  country: 'India',
};

async function backfillNewsLocations() {
  try {
    const collection = await getCollection('news');

    const result = await collection.updateMany(
      {
        $or: [
          { location: { $exists: false } },
          { location: null },
          { location: undefined },
        ],
      },
      {
        $set: {
          location: DEFAULT_LOCATION,
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} article(s) with default location data.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ News location backfill failed.');
    console.error(error);
    process.exit(1);
  }
}

backfillNewsLocations();
