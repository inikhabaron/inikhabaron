import { getCurrentUser } from '@/lib/session/session';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { recordAnalyticsEvent, REEL_ANALYTICS_EVENTS } from '@/lib/services/reels/reelService';

// One extensible event endpoint instead of a dedicated route per signal
// (view/threeSecond/complete/replay/exit/share) — public/no-auth, since these
// are passive engagement signals, not identity-bound actions (unlike
// like/bookmark/report, which stay on their own requireUser()-gated routes).
// Auth is resolved *softly* here (never a 401) purely to get a stable viewer
// identity for view-count dedup when a session happens to be present.
export async function POST(request, { params }) {
  try {
    const { id: reelId } = await params;
    const body = await request.json();
    const { event, platform, watchDurationMs, viewerKey } = body;

    if (!REEL_ANALYTICS_EVENTS.includes(event)) {
      return failure(`Invalid event. Must be one of: ${REEL_ANALYTICS_EVENTS.join(', ')}`, 400);
    }
    if (event === 'share' && !platform) {
      return failure('platform is required for share events', 400);
    }

    const user = await getCurrentUser().catch(() => null);
    const resolvedViewerKey = user?.id || viewerKey || null;

    const result = await recordAnalyticsEvent(reelId, event, { platform, watchDurationMs, viewerKey: resolvedViewerKey });

    if (!result.success) {
      if (result.reason === 'NOT_FOUND') {
        return failure('Reel not found', 404, { code: 'REEL_NOT_FOUND' });
      }
      if (result.reason === 'WATCH_DURATION_TOO_SHORT') {
        return failure('A view only counts after a minimum watch duration', 400, { code: 'WATCH_DURATION_TOO_SHORT' });
      }
      return failure('Unable to record event', 400);
    }

    return success(result, 'Event recorded successfully');
  } catch (error) {
    logApiError('POST /api/reels/[id]/analytics', error);
    return failure('Unable to record event', 500);
  }
}
