import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { getSubscriptionFeatures } from '@/lib/services/subscriptions';

export const OPTIONS = preflight;

export async function GET(_request, { params }) {
  try {
    const subscriptionsCollection = await getCollection('subscriptions');
    const subscription = await subscriptionsCollection.findOne({ userId: params.id, status: 'active' });
    return json({
      subscription: subscription || { plan: 'free', features: getSubscriptionFeatures('free') },
    });
  } catch (error) {
    console.error('GET /api/subscriptions/user/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
