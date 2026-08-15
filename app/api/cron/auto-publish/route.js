import { json } from '@/lib/api/cors';
import { verifyCronRequest } from '@/lib/auth/cron/verifyCronRequest';
import { autoPublishScheduledArticles } from '@/lib/services/news';

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

  return json({ success: true, modifiedCount });
}
