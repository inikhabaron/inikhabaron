import { json } from '@/lib/api/cors';
import { verifyCronRequest } from '@/lib/auth/cron/verifyCronRequest';
import { resetStuckJobs } from '@/lib/services/notifications/notificationJobService';
import { runNextPendingJob } from '@/lib/services/notifications/delivery/dispatchNotificationJob';

export const dynamic = 'force-dynamic';

// Allow room to drain a backlog; delivery is the one place in the app where
// slow FCM work is expected, because no user is waiting on the response.
export const maxDuration = 60;

/**
 * How many jobs one invocation drains. Configurable because the right value
 * depends on how often the worker runs, which is a *hosting* decision, not an
 * architectural one — the queue works either way.
 *
 * DELIVERY SCHEDULING — pick per deployment, do not hardcode assumptions:
 *
 *   Vercel Hobby    crons are limited to once per day. `vercel.json` therefore
 *                   ships the daily schedule, which is the only universally
 *                   valid option. Breaking-news latency would be up to 24h, so
 *                   Hobby deployments should ALSO drive this route from an
 *                   external scheduler (below) and raise DRAIN_LIMIT.
 *   Vercel Pro      set the vercel.json cron to a 5-minute interval (or
 *                   tighter). A small DRAIN_LIMIT is fine since passes are
 *                   frequent.
 *   External        any scheduler can call this route with
 *                   `Authorization: Bearer $CRON_SECRET` — GitHub Actions
 *                   `schedule`, cron-job.org, Better Uptime. This preserves the
 *                   decoupling exactly: the publish path is untouched either
 *                   way, and it is the recommended way to get sub-minute
 *                   delivery without a plan upgrade.
 *
 * Override with NOTIFICATION_DRAIN_LIMIT.
 */
const DEFAULT_DRAIN_LIMIT = 50;
const DRAIN_LIMIT = Math.max(1, Number(process.env.NOTIFICATION_DRAIN_LIMIT) || DEFAULT_DRAIN_LIMIT);

/**
 * The notification delivery worker — Layer 2's only entry point.
 *
 * This is the *sole* place push notifications are sent. Editorial routes only
 * enqueue jobs (see lib/services/notifications/articleNotificationQueue.js);
 * everything Firebase-related lives behind this handler, so a broken push stack
 * degrades to "notifications are late" instead of "editors cannot publish".
 *
 * Each pass recovers jobs orphaned by a crashed invocation, then drains due
 * jobs. Failures are rescheduled with exponential backoff by the dispatcher
 * rather than dropped, so a job created while Firebase was down is delivered by
 * a later run once it recovers.
 */
export async function GET(request) {
  const gate = verifyCronRequest(request);
  if (!gate.ok) return gate.response;

  const recovered = await resetStuckJobs();

  const outcomes = { sent: 0, retry: 0, failed: 0 };
  const jobIds = [];

  // Bounded so a runaway backlog can't turn this into a timeout.
  for (let i = 0; i < DRAIN_LIMIT; i += 1) {
    const result = await runNextPendingJob();
    if (!result) break;
    outcomes[result.outcome] = (outcomes[result.outcome] || 0) + 1;
    jobIds.push(result.id);
  }

  return json({
    success: true,
    recovered,
    processed: jobIds.length,
    outcomes,
    jobIds,
  });
}
