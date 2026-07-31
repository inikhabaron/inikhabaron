import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getRelatedReels } from '@/lib/services/reels/reelService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

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
