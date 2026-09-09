import { json, preflight } from '@/lib/api/cors';
import { getLiveBlogById } from '@/lib/services/liveBlogs/liveBlogService';
import { getPublicLiveBlogUpdates } from '@/lib/services/liveBlogs/liveBlogUpdateService';
import { refreshIntervalForLiveBlog } from '@/lib/liveBlogs/pollStatus';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/**
 * GET /api/live-blogs/[id]/updates — public feed, published only.
 * Echoes `refreshIntervalMs` (null once the blog is no longer 'live') the
 * same way the cricket match-detail API does, so the client always polls
 * at the rate the server currently thinks is right rather than a rate
 * baked in at page load.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const blog = await getLiveBlogById(id);
    if (!blog) return json({ error: 'Live blog not found' }, { status: 404, request });

    const data = await getPublicLiveBlogUpdates(id, { page, limit });

    return json(
      {
        ...data,
        refreshIntervalMs: refreshIntervalForLiveBlog(blog),
        // Included so callers that only have the blog id (e.g. the inline
        // ticker on an article, which only knows article.liveBlogId) can
        // still link to the full page without a second lookup by slug.
        blog: { id: blog.id, title: blog.title, slug: blog.slug, status: blog.status },
      },
      { request, headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' } },
    );
  } catch (error) {
    console.error('GET /api/live-blogs/[id]/updates error:', error);
    return json({ error: 'Failed to load updates' }, { status: 500, request });
  }
}
