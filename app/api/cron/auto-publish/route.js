import { json } from '@/lib/api/cors';
import { verifyCronRequest } from '@/lib/auth/cron/verifyCronRequest';
import { autoPublishScheduledArticles } from '@/lib/services/news';
import { runGuestCommentAlertCheck } from '@/lib/services/comments/guestCommentAlertService';

export const dynamic = 'force-dynamic';

/**
 * Auto-publishes scheduled articles — moved here from the request path of
 * /api/news, /api/news/breaking and /api/admin/news, which each ran this as
 * an `updateMany` write *before every read* (see git history: it used to be
 * debounced in-memory, but that debounce doesn't survive across separate
 * serverless instances, so in practice it fired on nearly every homepage
 * load). A struggling MongoDB connection then dragged down reads that had
 * nothing to do with publishing.
 *
 * This follows the exact same decoupling as
 * app/api/cron/notifications/route.js: the editorial/read routes stay on the
 * fast path, and this worker is the only place the write happens.
 *
 * SCHEDULING — same tradeoff as the notifications cron:
 *   Vercel Hobby   crons run once/day at minimum interval, hence the daily
 *                  vercel.json entry. A scheduled article could sit up to 24h
 *                  past its scheduledAt before this runs.
 *   Vercel Pro     tighten the vercel.json schedule (e.g. every 5 minutes).
 *   External       any scheduler can call this route with
 *                  `Authorization: Bearer $CRON_SECRET` (GitHub Actions
 *                  `schedule`, cron-job.org, Better Uptime) for sub-minute
 *                  publish latency without a plan upgrade.
 */
export async function GET(request) {
  const gate = verifyCronRequest(request);
  if (!gate.ok) return gate.response;

  const modifiedCount = await autoPublishScheduledArticles();

  // Backstop for the guest-comment review alert (see
  // guestCommentAlertService.js). That check normally piggybacks on guest
  // activity; this guarantees it also runs on the schedule when nobody is
  // posting or loading comments, so an overdue queue can't go unnoticed
  // overnight. It runs *after* publishing so it can never delay it, and it
  // cannot throw or take longer than a few seconds. Calling this route from an
  // external scheduler (see SCHEDULING above) makes the alert check as
  // frequent as the schedule — it is throttled and cooled down internally.
  const commentAlert = await runGuestCommentAlertCheck();

  return json({ success: true, modifiedCount, commentAlert });
}
