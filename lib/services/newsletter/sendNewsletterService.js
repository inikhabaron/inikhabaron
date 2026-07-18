import { getNewsletterSubscribers } from './newsletterService';
import { sendEmail } from './emailService';
import { buildMonthlyContent, buildBreakingContent } from './newsletterContentService';
import { buildMonthlyNewsletter } from './templates/monthlyNewsletter';
import { buildBreakingNewsletter } from './templates/breakingNewsletter';
import { currentMonthKey, findSentMonthlyCampaign, recordCampaign } from './campaignService';

// Resend's rate limits and typical provider guidance favor sending in
// moderate chunks with a pause between them rather than one massive
// concurrent burst.
const BATCH_SIZE = 75;
const BATCH_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAllActiveSubscribers() {
  // getNewsletterSubscribers() paginates for the admin list UI (route caps
  // limit at 100) — sending needs the full active list, so it's called
  // directly here with a high limit rather than looping pages.
  const { items } = await getNewsletterSubscribers({ status: 'active', page: 1, limit: 100000 });
  return items;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function buildEmail(type, email, content) {
  return type === 'breaking'
    ? buildBreakingNewsletter({ email, ...content })
    : buildMonthlyNewsletter({ email, ...content });
}

/**
 * Sends a newsletter to every active subscriber. Used identically by the
 * admin "send" API route and the standalone scheduler script, so both share
 * one implementation of batching/idempotency/logging.
 *
 * `failures` in the return value carries subscriber emails — it's meant for
 * server-side use (script console output, the campaign log) only. Callers
 * exposing this over HTTP (see app/api/admin/newsletter/send/route.js) must
 * strip it before responding.
 */
export async function sendNewsletter({ type = 'monthly', articleId, initiatedBy = null, force = false } = {}) {
  const resolvedType = type === 'breaking' ? 'breaking' : 'monthly';
  const month = resolvedType === 'monthly' ? currentMonthKey() : null;

  if (resolvedType === 'monthly' && !force) {
    const existing = await findSentMonthlyCampaign(month);
    if (existing) {
      return {
        success: false,
        type: resolvedType,
        sent: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        alreadySent: true,
        error: `The monthly newsletter for ${month} was already sent on ${existing.finishedAt.toISOString().slice(0, 10)}. Pass force to resend.`,
      };
    }
  }

  const content = resolvedType === 'breaking'
    ? await buildBreakingContent({ articleId })
    : await buildMonthlyContent();

  const hasContent = resolvedType === 'breaking'
    ? content.articles.length > 0
    : Object.values(content).some((list) => list.length > 0);

  if (!hasContent) {
    console.warn(`[sendNewsletterService] No ${resolvedType} content available — nothing sent.`);
    return { success: false, type: resolvedType, sent: 0, failed: 0, skipped: 0, total: 0, error: 'No content available to send' };
  }

  const { subject } = buildEmail(resolvedType, 'placeholder@inikhabaron.com', content);

  const subscribers = await getAllActiveSubscribers();

  const seenEmails = new Set();
  const recipients = [];
  let skipped = 0;

  for (const subscriber of subscribers) {
    const email = String(subscriber.email || '').trim().toLowerCase();
    if (!email || seenEmails.has(email)) {
      skipped += 1;
      continue;
    }
    seenEmails.add(email);
    recipients.push(email);
  }

  const startedAt = new Date();
  let sent = 0;
  let failed = 0;
  const failures = [];

  const batches = chunk(recipients, BATCH_SIZE);
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];

    const results = await Promise.allSettled(
      batch.map(async (email) => {
        const built = buildEmail(resolvedType, email, content);
        const result = await sendEmail({ to: email, subject: built.subject, html: built.html, text: built.text });
        if (!result.success) throw new Error(result.error || 'Unknown send failure');
      })
    );

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        sent += 1;
      } else {
        failed += 1;
        const email = batch[i];
        const message = result.reason?.message || String(result.reason);
        console.error(`[sendNewsletterService] Failed to send to ${email}: ${message}`);
        failures.push({ email, error: message });
      }
    });

    const isLastBatch = batchIndex === batches.length - 1;
    if (!isLastBatch) await sleep(BATCH_DELAY_MS);
  }

  const finishedAt = new Date();
  console.log(`[sendNewsletterService] type=${resolvedType} sent=${sent} failed=${failed} skipped=${skipped} total=${subscribers.length}`);

  await recordCampaign({
    type: resolvedType,
    subject,
    month,
    status: 'sent',
    startedAt,
    finishedAt,
    sent,
    failed,
    skipped,
    total: subscribers.length,
    failures,
    initiatedBy,
  }).catch((error) => {
    // A logging failure shouldn't mask a real (already-completed) send.
    console.error('[sendNewsletterService] Failed to record campaign log:', error.message);
  });

  return {
    success: true,
    type: resolvedType,
    sent,
    failed,
    skipped,
    total: subscribers.length,
    // Capped so a large failure run doesn't bloat the return value — full
    // detail lives in the campaign log (lib/db/newsletterCampaigns.js).
    failures: failures.slice(0, 20),
  };
}
