import crypto from 'crypto';

/**
 * Razorpay signature verification (uses Node crypto — no SDK/network needed).
 *
 * SECURITY: previously subscriptions were activated with no payment check at
 * all. These helpers let the server confirm that a payment/webhook genuinely
 * came from Razorpay before granting a paid plan.
 */

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

function safeEqualHex(aHex, bHex) {
  try {
    const a = Buffer.from(aHex, 'hex');
    const b = Buffer.from(bHex, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Verify a Razorpay Checkout success payload.
 * Signature = HMAC_SHA256(`${order_id}|${payment_id}`, key_secret).
 */
export function verifyPaymentSignature({ orderId, paymentId, signature } = {}) {
  if (!KEY_SECRET || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqualHex(expected, signature);
}

/**
 * Verify a Razorpay webhook. `rawBody` MUST be the exact request body string.
 * Signature arrives in the `x-razorpay-signature` header.
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!WEBHOOK_SECRET || !rawBody || !signature) return false;
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return safeEqualHex(expected, signature);
}
