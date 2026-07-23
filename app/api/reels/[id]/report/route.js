import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getReelsCollection } from '@/lib/db/reels';
import { addReelReport } from '@/lib/services/reels/reelReportService';

export async function POST(request, { params }) {
  try {
    const auth = await requireUser();
    if (!auth.success) {
      return auth.response;
    }

    const { id: reelId } = await params;
    const body = await request.json().catch(() => ({}));

    const reels = await getReelsCollection();
    const reel = await reels.findOne({ id: reelId });
    if (!reel) {
      return failure('Reel not found', 404, { code: 'REEL_NOT_FOUND' });
    }

    const result = await addReelReport(auth.user.id, reelId, body.reason);

    return success(
      result,
      result.alreadyExists ? 'You already reported this reel' : 'Reel reported successfully'
    );
  } catch (error) {
    logApiError('POST /api/reels/[id]/report', error);
    return failure('Unable to report reel', 500);
  }
}
