import { getNewsletterCampaignsCollection } from '@/lib/db/newsletterCampaigns';

/** 'YYYY-MM' for the current month, used to key monthly-send idempotency. */
export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

/** Most recent successfully-sent monthly campaign for a given month, if any. */
export async function findSentMonthlyCampaign(month) {
  const collection = await getNewsletterCampaignsCollection();
  return collection.findOne(
    { type: 'monthly', month, status: 'sent' },
    { sort: { startedAt: -1 } }
  );
}

/**
 * Persists a finished send run. failures is kept here (server-side storage
 * only) — API responses must not echo subscriber emails back to the client,
 * see app/api/admin/newsletter/send/route.js.
 */
export async function recordCampaign({
  type,
  subject,
  month = null,
  status,
  startedAt,
  finishedAt,
  sent,
  failed,
  skipped,
  total,
  failures = [],
  initiatedBy = null,
}) {
  const collection = await getNewsletterCampaignsCollection();
  const doc = {
    type,
    subject,
    month,
    status,
    startedAt,
    finishedAt,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    sent,
    failed,
    skipped,
    total,
    failures,
    initiatedBy,
  };
  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/** Recent campaigns for the admin "send history" panel — no failure details. */
export async function getRecentCampaigns({ limit = 10 } = {}) {
  const collection = await getNewsletterCampaignsCollection();
  const docs = await collection
    .find({}, { projection: { failures: 0 } })
    .sort({ startedAt: -1 })
    .limit(limit)
    .toArray();
  return docs;
}
