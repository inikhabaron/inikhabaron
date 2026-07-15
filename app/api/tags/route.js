import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

// Public, read-only counterpart to /api/admin/tags. The web frontend
// (app/page.js, app/news/[id]/NewsClient.js, app/live/page.js) has always
// called `fetch('/api/tags')` for its trending-topics bar, but this route
// never existed — only the admin-auth-gated /api/admin/tags did, so those
// calls have been silently failing. This adds the missing public route.
//
// Note: the existing tag documents (see app/api/admin/tags/route.js) only
// have an `isActive` flag — there is no `popular` field in the data model,
// so "trending tags" today just means "active tags", ordered newest first.
// Consumers that want a "popular" subset will need that field added to the
// admin tag form later; that's a product decision, not addressed here.
export async function GET() {
  try {
    const tagsCollection = await getCollection('tags');

    const tags = await tagsCollection
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    return json({ tags });
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
