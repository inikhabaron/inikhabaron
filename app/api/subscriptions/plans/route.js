import { SUBSCRIPTION_PLANS } from '@/lib/services/subscriptions';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  return json({ plans: SUBSCRIPTION_PLANS });
}
