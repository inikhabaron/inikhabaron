import { getCollection } from '../lib/mongodb.js';
import { COLLECTIONS } from '../lib/constants/collections.js';

async function backfillUserLocationSlugs() {
  try {
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const locationsCollection = await getCollection(COLLECTIONS.LOCATIONS);

    const users = await usersCollection
      .find({
        $or: [
          { 'location.stateId': { $exists: true, $ne: '' }, 'location.stateSlug': { $exists: false } },
          { 'location.districtId': { $exists: true, $ne: '' }, 'location.districtSlug': { $exists: false } },
        ],
      })
      .toArray();

    let updated = 0;

    for (const user of users) {
      const { stateId, districtId } = user.location || {};
      const set = {};

      if (stateId) {
        const state = await locationsCollection.findOne({ id: stateId }, { projection: { slug: 1 } });
        if (state?.slug) set['location.stateSlug'] = state.slug;
      }

      if (districtId) {
        const district = await locationsCollection.findOne({ id: districtId }, { projection: { slug: 1 } });
        if (district?.slug) set['location.districtSlug'] = district.slug;
      }

      if (Object.keys(set).length === 0) continue;

      await usersCollection.updateOne({ id: user.id }, { $set: set });
      updated += 1;
    }

    console.log(`✅ Backfilled location slugs for ${updated} user(s).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ User location slug backfill failed.');
    console.error(error);
    process.exit(1);
  }
}

backfillUserLocationSlugs();
