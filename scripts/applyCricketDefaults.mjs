import { MongoClient } from 'mongodb';

// Applies the production defaults for the cricket module to the singleton
// `cricket_module` settings document.
//
// Why a script and not just getDefaultSettings(): that function only ever
// runs on the *first* read, when no document exists yet. Once the document
// has been created — which happens the moment anyone loads /cricket — a
// changed default is invisible to it. This is the deploy-time step that
// pushes a retuned default onto an environment that already has one.
//
// Only the keys listed below are touched, so anything an admin has since
// changed by hand in Admin > Cricket Settings survives unless it's a key
// this script is explicitly asserting. Safe to re-run.
const SETTINGS_ID = 'cricket_module';

// Kept literal rather than imported from cricketSettingsService.js — that
// module resolves through the '@/...' alias, which a plain `node` process
// running this file has no resolver for.
const DEFAULTS = {
  enabled: true,
  homepageWidgetEnabled: true,
  homepageWidgetSize: 'compact',
  preferredLeagues: ['ipl', 'india', 'icc', 'international'],
  // The important one: null means the adaptive 60s-live rate, which is
  // ~1440 upstream requests/day against a 100/day free plan.
  refreshIntervalSeconds: 1800,
};

async function run() {
  const { MONGO_URL, DB_NAME } = process.env;
  if (!MONGO_URL || !DB_NAME) {
    console.error('❌ MONGO_URL and DB_NAME must be set (run via `node --env-file=.env`).');
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const collection = client.db(DB_NAME).collection('system_settings');

    const before = await collection.findOne({ _id: SETTINGS_ID });
    await collection.updateOne(
      { _id: SETTINGS_ID },
      { $set: { ...DEFAULTS, updatedAt: new Date() } },
      { upsert: true },
    );
    const after = await collection.findOne({ _id: SETTINGS_ID });

    console.log(before ? '✅ Cricket settings updated.' : '✅ Cricket settings created.');
    for (const key of Object.keys(DEFAULTS)) {
      const from = JSON.stringify(before?.[key]);
      const to = JSON.stringify(after?.[key]);
      console.log(`   ${key}: ${from === to ? `${to} (unchanged)` : `${from} -> ${to}`}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ applyCricketDefaults failed.');
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
