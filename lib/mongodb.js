import { MongoClient } from 'mongodb';
import { startScheduledPublishing } from '@/lib/cron-jobs';
import { getOptionalEnv, getRequiredEnvString, validateOptionalEnvs, validateRequiredEnvs } from '@/lib/env';

validateRequiredEnvs(['MONGO_URL', 'JWT_SECRET']);
validateOptionalEnvs(['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']);

const MONGO_URL = getOptionalEnv('MONGO_URL');
const DB_NAME = process.env.DB_NAME || 'newsdesk_db';

let client;
let clientPromise;
let cronStarted = false;
let indexesStarted = false;

function getMongoUrl() {
  return getRequiredEnvString('MONGO_URL', { hint: 'Database connection URL' });
}

const mongoOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 45000,
  waitQueueTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
};

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGO_URL, mongoOptions);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(getMongoUrl(), mongoOptions);
  clientPromise = client.connect();
}

export async function getDatabase() {
  if (!clientPromise) {
    throw new Error('[mongodb] MongoDB clientPromise is not initialized. Check MONGO_URL and server startup logs.');
  }

  const client = await clientPromise;
  
  // Start cron job once on first database connection (production only)
  if (!cronStarted && process.env.NODE_ENV === 'production') {
    cronStarted = true;
    startScheduledPublishing();
  }
  // Ensure indexes are created once after initial connection
  const db = client.db(DB_NAME);
  if (!indexesStarted) {
    indexesStarted = true;
    try {
      const { createIndexesFromDb } = await import('@/lib/db-init');
      // run in background, don't block the request
      createIndexesFromDb(db).catch(async (err) => {
        const logger = (await import('@/lib/logger')).default;
        logger.error('createIndexesFromDb error', { error: err?.message || err });
      });
    } catch (err) {
      const logger = (await import('@/lib/logger')).default;
      logger.error('Failed to import createIndexesFromDb', { error: err?.message || err });
    }
  }

  return db;
}

export async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

export default clientPromise;
