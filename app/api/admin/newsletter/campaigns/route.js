import { getUserFromToken } from '@/lib/auth/admin/token';
import { checkRole } from '@/lib/auth/permissions';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getRecentCampaigns } from '@/lib/services/newsletter/campaignService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return failure('Unauthorized', 401);
    if (!checkRole(user, ['admin', 'editor'])) return failure('Forbidden', 403);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Number(searchParams.get('limit')) || 10);

    // getRecentCampaigns() already excludes the `failures` field (subscriber
    // emails) at the query level — see lib/services/newsletter/campaignService.js.
    const campaigns = await getRecentCampaigns({ limit });

    return success({ campaigns }, 'Campaigns fetched successfully');
  } catch (error) {
    logApiError('GET /api/admin/newsletter/campaigns', error);
    return failure('Unable to fetch campaigns', 500);
  }
}
