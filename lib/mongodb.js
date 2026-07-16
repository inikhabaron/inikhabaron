import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL;
// const DB_NAME = process.env.DB_NAME || 'newsdesk_db_MVP2';
const DB_NAME = process.env.DB_NAME || 'newsdesk_db';


let client;
let clientPromise;

if (!MONGO_URL) {
  throw new Error('Please add MONGO_URL to .env file');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGO_URL);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(MONGO_URL);
  clientPromise = client.connect();
}

export async function getDatabase() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

export default clientPromise;
