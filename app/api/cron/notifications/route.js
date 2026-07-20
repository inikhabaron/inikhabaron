import { json } from '@/lib/api/cors';
import { verifyCronRequest } from '@/lib/auth/cron/verifyCronRequest';
import { resetStuckJobs } from '@/lib/services/notifications/notificationJobService';
import { runNextPendingJob } from '@/lib/services/notifications/dispatchNotificationJob';

export const dynamic = 'force-dynamic';

// Safety-net sweep only — real delivery happens inline from the admin
// approval routes the moment a job is created. This just recovers jobs that
// never got dispatched (e.g. the creating request crashed) or got stuck
// mid-send. Runs once/day on the current Vercel plan (see vercel.json).
export async function GET(request) {
  const gate = verifyCronRequest(request);
  if (!gate.ok) return gate.response;

  const recovered = await resetStuckJobs();

  const processedIds = [];
  // Bounded loop so a runaway backlog can't turn this into a timeout.
  for (let i = 0; i < 50; i += 1) {
    const jobId = await runNextPendingJob();
    if (!jobId) break;
    processedIds.push(jobId);
  }

  return json({ success: true, recovered, processed: processedIds.length, jobIds: processedIds });
}
