import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const subscribersCollection = await getCollection('email_subscribers');
    const subscribers = await subscribersCollection.find({ isActive: true }).toArray();
    return json({ subscribers, count: subscribers.length });
  } catch (error) {
    console.error('GET /api/subscribers error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
