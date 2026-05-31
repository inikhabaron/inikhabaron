import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { getSubscriptionFeatures } from '@/lib/services/subscriptions';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json();
    const subscriptionsCollection = await getCollection('subscriptions');

    const subscription = {
      id: uuidv4(),
      userId: body.userId,
      email: body.email,
      plan: body.plan || 'free',
      status: 'active',
      startDate: new Date(),
      endDate: body.plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      features: getSubscriptionFeatures(body.plan || 'free'),
      paymentMethod: body.paymentMethod || null,
      autoRenew: body.autoRenew !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await subscriptionsCollection.insertOne(subscription);
    return json({ success: true, subscription }, { status: 201 });
  } catch (error) {
    console.error('POST /api/subscriptions error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
