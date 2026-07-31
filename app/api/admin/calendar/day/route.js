import { getUserFromToken } from '@/lib/auth/admin/token';
import { checkRole } from '@/lib/auth/permissions';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getDayActivity } from '@/lib/services/calendar/calendarService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

function parseFilters(searchParams) {
  const types = searchParams.get('type');
  return {
    types: types ? types.split(',').filter(Boolean) : [],
    category: searchParams.get('category') || null,
    role: searchParams.get('role') || null,
    authorName: searchParams.get('author') || null,
  };
}

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return failure('Unauthorized', 401);
    if (!checkRole(user, ['admin', 'editor'])) return failure('Forbidden', 403);

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    if (!dateParam) return failure('date query param is required', 400);

    const date = new Date(dateParam);
    if (Number.isNaN(date.getTime())) return failure('date must be a valid date', 400);

    const activity = await getDayActivity({ date, filters: parseFilters(searchParams) });
    return success({ activity }, 'Day activity fetched successfully');
  } catch (error) {
    logApiError('GET /api/admin/calendar/day', error);
    return failure('Unable to fetch day activity', 500);
  }
}
