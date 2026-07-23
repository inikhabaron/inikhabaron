import { v4 as uuidv4 } from 'uuid';
import { getPromotionsCollection } from '@/lib/db/promotions';

export const LINK_TYPES = Object.freeze(['none', 'article', 'category', 'external']);

// PromotionFormDialog's <input type="datetime-local"> gives back a bare
// string like "2026-01-26T10:00" with no timezone. Per the ECMAScript Date
// spec, a date-time string with no offset parses as *local time of
// whichever machine runs this code* — fine on a laptop in IST, wrong the
// moment this deploys to a UTC-timezone host, where an admin's "10:00"
// would silently get stored as 10:00 UTC (15:30 IST). KhabarON is an
// India-only publication, so every admin-entered schedule date is pinned
// to IST (UTC+5:30) here rather than trusting the server's ambient
// timezone. Strings that already carry an offset (or "Z") are left as-is.
function parseAsIst(value) {
  if (!value) return null;
  const hasOffset = /[Zz]|[+-]\d{2}:\d{2}$/.test(value);
  const parsed = new Date(hasOffset ? value : `${value}+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Turns the admin's chosen link (an article id, a category slug, or a raw
// external URL) into the single href the frontend CTA button actually
// navigates to — computed once here at write time so every consumer (the
// homepage card, a future push notification, etc.) can just use
// `promotion.buttonLink` without knowing about linkType/linkValue at all.
export function resolveButtonLink(linkType, linkValue) {
  const value = (linkValue || '').trim();
  if (!value) return '';
  switch (linkType) {
    case 'article': return `/news/${value}`;
    case 'category': return `/category/${value}`;
    case 'external': return value;
    default: return '';
  }
}

// Admin-facing lifecycle label, derived from status + the date window
// rather than stored, so it can never drift out of sync with "now".
export function getPromotionState(promotion, now = new Date()) {
  if (promotion.status !== 'active') return 'disabled';
  const start = promotion.startDate ? new Date(promotion.startDate) : null;
  const end = promotion.endDate ? new Date(promotion.endDate) : null;
  if (start && now < start) return 'scheduled';
  if (end && now > end) return 'expired';
  return 'live';
}

function sanitizeInput(body) {
  const linkType = LINK_TYPES.includes(body.linkType) ? body.linkType : 'none';
  const linkValue = body.linkValue || '';

  return {
    title: (body.title || '').trim(),
    description: body.description || '',
    bannerImage: body.bannerImage || '',
    eventDate: parseAsIst(body.eventDate),
    startDate: parseAsIst(body.startDate) || new Date(),
    endDate: parseAsIst(body.endDate),
    status: body.status === 'inactive' ? 'inactive' : 'active',
    priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 0,
    buttonText: body.buttonText || 'Read More',
    linkType,
    linkValue,
    buttonLink: resolveButtonLink(linkType, linkValue),
    category: body.category || '',
    isFeatured: body.isFeatured === true,
    showCountdown: body.showCountdown === true,
  };
}

export async function createPromotion(body) {
  const promotions = await getPromotionsCollection();
  const promotion = {
    id: uuidv4(),
    ...sanitizeInput(body),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await promotions.insertOne(promotion);
  return promotion;
}

export async function updatePromotion(id, body) {
  const promotions = await getPromotionsCollection();
  const update = { ...sanitizeInput(body), updatedAt: new Date() };
  const result = await promotions.findOneAndUpdate(
    { id },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result?.value || result || null;
}

export async function deletePromotion(id) {
  const promotions = await getPromotionsCollection();
  const result = await promotions.deleteOne({ id });
  return result.deletedCount > 0;
}

// Admin list — every promotion regardless of status/date window, ordered
// the same way the public list is (featured first, then priority, then
// soonest event), so the admin table previews the real display order.
export async function getAllPromotions() {
  const promotions = await getPromotionsCollection();
  const all = await promotions
    .find({})
    .sort({ isFeatured: -1, priority: 1, eventDate: 1 })
    .toArray();
  return all.map((p) => ({ ...p, state: getPromotionState(p) }));
}

// Public list — only promotions an admin has enabled AND whose visibility
// window (startDate..endDate) includes right now. endDate is optional (no
// expiry); startDate defaults to creation time so "not yet started" only
// applies when an admin deliberately schedules one for the future.
export async function getActivePromotions() {
  const promotions = await getPromotionsCollection();
  const now = new Date();
  const active = await promotions
    .find({
      status: 'active',
      startDate: { $lte: now },
      $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }],
    })
    .project({ _id: 0 })
    .sort({ isFeatured: -1, priority: 1, eventDate: 1 })
    .toArray();
  return active;
}
