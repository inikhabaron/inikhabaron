import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { getSubscriptionFeatures } from '@/lib/services/subscriptions';
import { requireUser } from '@/lib/auth/user/requireUser';
import { verifyPaymentSignature } from '@/lib/services/payments/razorpay';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    // Must be signed in — the subscription is bound to the session user, NOT to
    // an arbitrary userId from the request body.
    const auth = await requireUser();
    if (!auth.success) return auth.response;
    const user = auth.user;

    const body = await request.json().catch(() => ({}));
    const plan = (body.plan || 'free').toString();

    // Paid plans require a verified Razorpay payment. Previously ANY plan was
    // activated with no payment check at all.
    if (plan !== 'free') {
      const ok = verifyPaymentSignature({
        orderId: body.razorpayOrderId || body.razorpay_order_id,
        paymentId: body.razorpayPaymentId || body.razorpay_payment_id,
        signature: body.razorpaySignature || body.razorpay_signature,
      });
      if (!ok) {
        return json({ error: 'Payment verification failed' }, { status: 402, request });
      }
    }

    const subscriptionsCollection = await getCollection('subscriptions');

    const subscription = {
      id: uuidv4(),
      userId: user.id,
      email: user.email || null,
      plan,
      status: 'active',
      startDate: new Date(),
      endDate: plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      features: getSubscriptionFeatures(plan),
      paymentMethod: plan === 'free' ? null : 'razorpay',
      paymentId: body.razorpayPaymentId || body.razorpay_payment_id || null,
      autoRenew: body.autoRenew !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await subscriptionsCollection.insertOne(subscription);
    return json({ success: true, subscription }, { status: 201, request });
  } catch (error) {
    console.error('POST /api/subscriptions error:', error);
    return json({ error: 'Failed to create subscription' }, { status: 500, request });
  }
}
