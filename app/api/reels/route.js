import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getFeed } from '@/lib/services/reels/reelService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Number(searchParams.get('limit')) || 10);
    const sort = ['latest', 'trending', 'personalized'].includes(searchParams.get('sort'))
      ? searchParams.get('sort')
      : 'latest';
    const category = searchParams.get('category') || undefined;

    const result = await getFeed({ page, limit, sort, category });

    return success(result, 'Reels feed fetched successfully');
  } catch (error) {
    logApiError('GET /api/reels', error);
    return failure('Unable to fetch reels feed', 500);
  }
}
