import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getReel } from '@/lib/services/reels/reelService';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const reel = await getReel(id);

    if (!reel || reel.isDeleted || reel.status !== 'published') {
      return failure('Reel not found', 404, { code: 'REEL_NOT_FOUND' });
    }

    return success(reel, 'Reel fetched successfully');
  } catch (error) {
    logApiError('GET /api/reels/[id]', error);
    return failure('Unable to fetch reel', 500);
  }
}
