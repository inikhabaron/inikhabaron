import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canAccessAdminPanel, checkRole } from '@/lib/auth/permissions';
import { getJob, requeueJob, cancelJob } from '@/lib/services/notifications/notificationJobService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/** Full lifecycle of one job: timestamps, attempts, progress, failure reason. */
export async function GET(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !canAccessAdminPanel(user)) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }
    const job = await getJob(params.id);
    if (!job) return json({ error: 'Job not found' }, { status: 404 });
    return json({ success: true, data: job }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/notifications/jobs/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

/**
 * Operational actions on a job.
 *   { action: 'requeue' }                     resume a failed/stuck job
 *   { action: 'requeue', fromScratch: true }  re-send from the beginning
 *   { action: 'cancel' }                      never send this
 *
 * Mutations are admin-only: requeue can cause real pushes to real devices, which
 * is a heavier action than reading the queue.
 */
export async function POST(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !checkRole(user, ['admin'])) {
      return json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const { action, fromScratch } = body;

    if (action === 'requeue') {
      const job = await requeueJob(params.id, { fromScratch: fromScratch === true });
      if (!job) return json({ error: 'Job not found, or not in a requeueable state (failed/processing)' }, { status: 409 });
      return json({ success: true, message: 'Job requeued', data: job }, { status: 200 });
    }

    if (action === 'cancel') {
      const job = await cancelJob(params.id);
      if (!job) return json({ error: 'Job not found, or already sent/cancelled' }, { status: 409 });
      return json({ success: true, message: 'Job cancelled', data: job }, { status: 200 });
    }

    return json({ error: "Invalid action. Expected 'requeue' or 'cancel'" }, { status: 400 });
  } catch (error) {
    console.error('POST /api/admin/notifications/jobs/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
