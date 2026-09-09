import { json, preflight } from '@/lib/api/cors';
import { getPublicLiveBlogBySlug } from '@/lib/services/liveBlogs/liveBlogService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

// Folder is named [id] (not [slug]) only because Next.js requires every
// dynamic segment at this path level to share one param name, and the
// sibling updates/ route is legitimately id-keyed — the value passed here
// is still a slug, matching /live-blogs/[slug]/page.js's URLs exactly.
/** GET /api/live-blogs/[id] — public detail by slug. 404s for draft/archived, same as an unpublished article. */
export async function GET(request, { params }) {
  try {
    const { id: slug } = await params;
    const blog = await getPublicLiveBlogBySlug(slug);
    if (!blog) return json({ error: 'Live blog not found' }, { status: 404, request });

    return json({ blog }, {
      request,
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch (error) {
    console.error('GET /api/live-blogs/[id] error:', error);
    return json({ error: 'Failed to load live blog' }, { status: 500, request });
  }
}
