import { getUserFromToken } from '@/lib/auth/admin/token';
import { checkRole, canPublishScheduled } from '@/lib/auth/permissions';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getMonthActivityCounts, scheduleArticle } from '@/lib/services/calendar/calendarService';

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
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    if (!startParam || !endParam) {
      return failure('start and end query params are required', 400);
    }

    const start = new Date(startParam);
    const end = new Date(endParam);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return failure('start and end must be valid dates', 400);
    }

    const counts = await getMonthActivityCounts({ start, end, filters: parseFilters(searchParams) });
    return success({ counts }, 'Calendar activity counts fetched successfully');
  } catch (error) {
    logApiError('GET /api/admin/calendar', error);
    return failure('Unable to fetch calendar activity', 500);
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return failure('Unauthorized', 401);
    if (!canPublishScheduled(user, user.permissions)) {
      return failure('You do not have permission to schedule articles', 403);
    }

    const body = await request.json();
    const { articleId, scheduledAt } = body || {};
    if (!articleId || !scheduledAt) {
      return failure('articleId and scheduledAt are required', 400);
    }

    const result = await scheduleArticle({ articleId, scheduledAt });

    if (result.error === 'not_found') return failure('Article not found', 404);
    if (result.error === 'already_published') {
      return failure('Article is already published; unpublish it via PUT /api/admin/news/[id] before rescheduling', 400);
    }
    if (result.error === 'invalid_date') return failure('scheduledAt must be a valid future date', 400);

    return success({ article: result.article }, 'Article scheduled successfully');
  } catch (error) {
    logApiError('POST /api/admin/calendar', error);
    return failure('Unable to schedule article', 500);
  }
}
