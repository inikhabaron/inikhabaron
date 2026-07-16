import { MongoClient } from 'mongodb';
import { ensureIndexes } from './db/ensureIndexes';

const MONGO_URL = process.env.MONGO_URL;
// const DB_NAME = process.env.DB_NAME || 'newsdesk_db_MVP2';
const DB_NAME = process.env.DB_NAME || 'newsdesk_db';

<<<<<<< HEAD

let client;
let clientPromise;

=======
>>>>>>> a9800e16b2177bc51925b98898508e200bd16e2f
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
 */
let clientPromise;

if (!global._mongoClientPromise) {
  const client = new MongoClient(MONGO_URL, {
    maxPoolSize: 10,
    minPoolSize: 0,
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
