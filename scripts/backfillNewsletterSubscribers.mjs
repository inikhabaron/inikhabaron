import { getCollection } from '../lib/mongodb.js';
import { COLLECTIONS } from '../lib/constants/collections.js';

// Subscribers created before the Newsletter module's schema extension only
// have { email, createdAt } — no status/language/categories/source. They were
// implicitly active (no unsubscribe mechanism existed yet), so this backfill
// is additive-only and safe to re-run (idempotent via the status:exists:false filter).
async function backfillNewsletterSubscribers() {
  try {
    const newsletterCollection = await getCollection(COLLECTIONS.NEWSLETTER);

    const legacyDocs = await newsletterCollection
      .find({ status: { $exists: false } })
      .toArray();

    let updated = 0;

    for (const doc of legacyDocs) {
      await newsletterCollection.updateOne(
        { _id: doc._id },
        {
          $set: {
            userId: doc.userId ?? null,
            language: doc.language || 'en',
            categories: doc.categories || [],
            status: 'active',
            source: doc.source || 'website',
            subscribedAt: doc.subscribedAt || doc.createdAt || new Date(),
            unsubscribedAt: null,
            updatedAt: new Date(),
          },
        }
      );
      updated += 1;
    }

    console.log(`✅ Backfilled ${updated} legacy newsletter subscriber(s).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Newsletter subscriber backfill failed.');
    console.error(error);
    process.exit(1);
  }
}

backfillNewsletterSubscribers();
