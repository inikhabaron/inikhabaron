import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { checkRole } from '@/lib/auth/permissions';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getNewsletterSubscribers, getNewsletterStats } from '@/lib/services/newsletter/newsletterService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

function toCsv(items) {
  const header = ['email', 'status', 'language', 'categories', 'source', 'subscribedAt', 'unsubscribedAt'];
  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = items.map((item) => [
    item.email,
    item.status,
    item.language,
    Array.isArray(item.categories) ? item.categories.join('; ') : '',
    item.source,
    item.subscribedAt ? new Date(item.subscribedAt).toISOString() : '',
    item.unsubscribedAt ? new Date(item.unsubscribedAt).toISOString() : '',
  ].map(escapeCell).join(','));

  return [header.join(','), ...rows].join('\n');
}

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return failure('Unauthorized', 401);
    if (!checkRole(user, ['admin', 'editor'])) return failure('Forbidden', 403);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    const filters = {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'all',
      language: searchParams.get('language') || 'all',
    };

    if (format === 'csv') {
      const { items } = await getNewsletterSubscribers({ ...filters, page: 1, limit: 10000 });
      return new NextResponse(toCsv(items), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="newsletter-subscribers.csv"',
        },
      });
    }

    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Number(searchParams.get('limit')) || 20);

    const [result, stats] = await Promise.all([
      getNewsletterSubscribers({ ...filters, page, limit }),
      getNewsletterStats(),
    ]);

    return success({ ...result, stats }, 'Subscribers fetched successfully');
  } catch (error) {
    logApiError('GET /api/admin/newsletter', error);
    return failure('Unable to fetch subscribers', 500);
  }
}
