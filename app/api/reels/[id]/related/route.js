import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getRelatedReels } from '@/lib/services/reels/reelService';

export async function GET(request, { params }) {
  try {
    const { id: reelId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Number(searchParams.get('limit')) || 10);

    const items = await getRelatedReels(reelId, limit);

    return success({ items }, 'Related reels fetched successfully');
  } catch (error) {
    logApiError('GET /api/reels/[id]/related', error);
    return failure('Unable to fetch related reels', 500);
  }
}
