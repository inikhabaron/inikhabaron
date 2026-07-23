import { MongoClient } from 'mongodb';
import { ensureIndexes } from './db/ensureIndexes.js';

const MONGO_URL = process.env.MONGO_URL;
// const DB_NAME = process.env.DB_NAME || 'newsdesk_db_MVP2';
const DB_NAME = process.env.DB_NAME || 'newsdesk_db';

if (!MONGO_URL) {
  throw new Error('Please add MONGO_URL to .env file');
}

/**
 * Cache the client promise on `global` in ALL environments.
 *
 * Previously only development cached; production created a brand new
 * MongoClient (and connection pool) on every serverless invocation, which
 * exhausts Atlas connection limits under load. Serverless functions reuse the
 * module scope across warm invocations, so caching here reuses the pool.
 *
 * The options below are specifically tuned for Vercel Serverless Functions +
 * Atlas at MVP launch traffic — not a generic "bigger is better" pool:
 *
 * - maxPoolSize stays deliberately LOW (10). In serverless, concurrency comes
 *   from having many function instances running in parallel, each with its
 *   OWN pool — Atlas's connection budget is consumed by
 *   (concurrent warm instances × maxPoolSize), not by this number alone. A
 *   high per-instance pool is the wrong lever and risks exhausting Atlas
 *   under a real traffic spike; a low one is the standard guidance for this
 *   deployment shape. (Confirmed empirically during load testing: raising
 *   this to 50 did not improve latency and was reverted — the bottleneck
 *   there was network round-trip time to Atlas, not pool size.)
 * - minPoolSize stays 0: idle/frozen serverless instances shouldn't hold
 *   open connections against Atlas's budget while not actively serving
 *   traffic.
 * - maxIdleTimeMS bounds how long a pooled connection can sit idle inside a
 *   long-lived warm instance before the driver retires it — long enough to
 *   survive normal gaps between requests on the same warm instance, short
 *   enough not to accumulate stale connections indefinitely.
 * - serverSelectionTimeoutMS / connectTimeoutMS / socketTimeoutMS are all
 *   shortened from the driver's defaults (which assume a long-lived server
 *   process, not a function with its own execution time budget) so a
 *   connectivity problem fails fast and returns an error response instead of
 *   silently burning most of the function's execution time waiting.
 * - family: 4 skips IPv6 address resolution — a known source of slow or
 *   flaky connection attempts on some serverless/cloud networking setups,
 *   with no downside here since Atlas is reachable over IPv4 regardless.
 * - retryWrites/retryReads make transient network blips (common when a cold
 *   function is establishing its first connection) retry once automatically
 *   instead of failing the request outright.
 * - appName makes this app's connections identifiable in Atlas's own
 *   connection/metrics views — free operational visibility, no cost.
 */
let clientPromise;

if (!global._mongoClientPromise) {
  const client = new MongoClient(MONGO_URL, {
    maxPoolSize: 10,
    minPoolSize: 0,
    maxIdleTimeMS: 60_000,
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 20_000,
    retryWrites: true,
    retryReads: true,
    family: 4,
    appName: 'khabaron-vercel',
  });
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function getDatabase() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // Create indexes once per process (fire-and-forget; never blocks a request).
  if (!global._indexesEnsured) {
    global._indexesEnsured = true;
    Promise.resolve(ensureIndexes(db)).catch((err) => {
      global._indexesEnsured = false; // allow a later retry
      console.error('[mongodb] ensureIndexes failed:', err?.message);
    });
  }

  return db;
}

export async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

export default clientPromise;
