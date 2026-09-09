import { json, preflight } from '@/lib/api/cors';
import { getLiveBlogs } from '@/lib/services/liveBlogs/liveBlogService';

// Public read — cors.js, matching /api/news and /api/tags (confirmed
// precedent, see docs/mvp3-phase1-architecture.md).
export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/** GET /api/live-blogs — list, public. Only status:'live'|'completed' ever shows. */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const data = await getLiveBlogs({ status, page, limit, publicOnly: true });
    return json(data, {
      request,
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('GET /api/live-blogs error:', error);
    return json({ error: 'Failed to load live blogs' }, { status: 500, request });
  }
}
