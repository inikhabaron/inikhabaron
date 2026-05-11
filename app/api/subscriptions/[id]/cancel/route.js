import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(_request, { params }) {
  try {
    const subscriptionsCollection = await getCollection('subscriptions');
    await subscriptionsCollection.updateOne(
      { id: params.id },
      { $set: { status: 'cancelled', autoRenew: false, updatedAt: new Date() } }
    );
    return json({ success: true });
  } catch (error) {
    console.error('POST /api/subscriptions/[id]/cancel error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
