import { MongoClient } from 'mongodb';
import { startScheduledPublishing } from '@/lib/cron-jobs';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'newsdesk_db';

let client;
let clientPromise;
let cronStarted = false;

if (!MONGO_URL) {
  throw new Error('Please add MONGO_URL to .env file');
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
  client = new MongoClient(MONGO_URL, mongoOptions);
  clientPromise = client.connect();
}

export async function getDatabase() {
  const client = await clientPromise;
  
  // Start cron job once on first database connection (production only)
  if (!cronStarted && process.env.NODE_ENV === 'production') {
    cronStarted = true;
    startScheduledPublishing();
  }
  
  return client.db(DB_NAME);
}

export async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

export default clientPromise;
