import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canAccessAdminPanel, canCreateReel } from '@/lib/auth/permissions';
import { createReel, listReelsAdmin } from '@/lib/services/reels/reelService';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }
    // getUserFromToken only checks the JWT is valid and the user is active —
    // it does NOT filter by role, so without this a regular reader with a
    // valid session token could list every reel (drafts/reported/sensitive
    // included) via the admin API.
    if (!canAccessAdminPanel(user)) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const reporterId = searchParams.get('reporterId') || undefined;
    const search = searchParams.get('search') || undefined;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const { items, pagination } = await listReelsAdmin({
      page,
      limit,
      status,
      category,
      reporterId,
      search,
      includeDeleted,
    });

    return json({ reels: items, pagination });
  } catch (error) {
    console.error('GET /api/admin/reels error:', error);
    return json({ error: error.message || 'Failed to load reels' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!canCreateReel(user)) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.title) {
      return json({ error: 'Title is required' }, { status: 400 });
    }
    if (!body.video?.url) {
      return json({ error: 'A video upload is required' }, { status: 400 });
    }

    const reel = await createReel({
      ...body,
      reporterId: body.reporterId || user.id,
      createdBy: user.id,
    });

    return json({ success: true, reel }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/reels error:', error);
    return json({ error: error.message || 'Failed to create reel' }, { status: 500 });
  }
}
