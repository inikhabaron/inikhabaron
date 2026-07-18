import { getNewsletterCollection } from '@/lib/db/newsletter';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function isValidEmail(email) {
  return EMAIL_RE.test(email);
}

export async function subscribeToNewsletter({
  email,
  userId = null,
  language = 'en',
  categories = [],
  source = 'website',
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { success: false, code: 'INVALID_EMAIL' };
  }

  const collection = await getNewsletterCollection();
  const existing = await collection.findOne({ email: normalizedEmail });
  const now = new Date();

  if (existing && existing.status === 'active') {
    return { success: false, code: 'ALREADY_SUBSCRIBED' };
  }

  if (existing) {
    await collection.updateOne(
      { email: normalizedEmail },
      {
        $set: {
          status: 'active',
          language,
          categories,
          source,
          userId: userId ?? existing.userId ?? null,
          subscribedAt: now,
          unsubscribedAt: null,
          updatedAt: now,
        },
      }
    );
    return { success: true, reactivated: true };
  }

  try {
    await collection.insertOne({
      email: normalizedEmail,
      userId,
      language,
      categories,
      status: 'active',
      source,
      subscribedAt: now,
      unsubscribedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    // Unique index on email is the race-condition safety net around the
    // findOne-then-write above (same non-atomic pattern bookmarks/likes use).
    if (error?.code === 11000) {
      return { success: false, code: 'ALREADY_SUBSCRIBED' };
    }
    throw error;
  }

  return { success: true, reactivated: false };
}

export async function unsubscribeFromNewsletter({ email, userId = null }) {
  const collection = await getNewsletterCollection();
  const normalizedEmail = email ? normalizeEmail(email) : null;
  const query = normalizedEmail ? { email: normalizedEmail } : userId ? { userId } : null;

  if (!query) {
    return { success: false, code: 'MISSING_IDENTIFIER' };
  }

  const existing = await collection.findOne(query);
  if (!existing) {
    return { success: false, code: 'NOT_FOUND' };
  }

  if (existing.status === 'unsubscribed') {
    return { success: true, alreadyUnsubscribed: true };
  }

  await collection.updateOne(query, {
    $set: { status: 'unsubscribed', unsubscribedAt: new Date(), updatedAt: new Date() },
  });

  return { success: true, alreadyUnsubscribed: false };
}

export async function getNewsletterSubscribers({
  search,
  status,
  language,
  page = 1,
  limit = 20,
}) {
  const collection = await getNewsletterCollection();
  const query = {};

  if (status && status !== 'all') query.status = status;
  if (language && language !== 'all') query.language = language;
  if (search) query.email = { $regex: escapeRegex(search), $options: 'i' };

  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    collection.countDocuments(query),
    collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
  ]);

  return { items, total, page, limit, hasNext: skip + items.length < total };
}

export async function getNewsletterStats() {
  const collection = await getNewsletterCollection();
  const [active, unsubscribed, total] = await Promise.all([
    collection.countDocuments({ status: 'active' }),
    collection.countDocuments({ status: 'unsubscribed' }),
    collection.countDocuments({}),
  ]);
  return { active, unsubscribed, total };
}

export async function updateNewsletterSubscriber(id, updates = {}) {
  const collection = await getNewsletterCollection();
  const setFields = { updatedAt: new Date() };

  if (updates.status && ['active', 'unsubscribed'].includes(updates.status)) {
    setFields.status = updates.status;
    setFields.unsubscribedAt = updates.status === 'unsubscribed' ? new Date() : null;
  }
  if (typeof updates.language === 'string' && updates.language) {
    setFields.language = updates.language;
  }
  if (Array.isArray(updates.categories)) {
    setFields.categories = updates.categories;
  }

  const result = await collection.updateOne({ _id: id }, { $set: setFields });
  return { success: result.matchedCount > 0 };
}

export async function deleteNewsletterSubscriber(id) {
  const collection = await getNewsletterCollection();
  const result = await collection.deleteOne({ _id: id });
  return { success: result.deletedCount > 0 };
}
