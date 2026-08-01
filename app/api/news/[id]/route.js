import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

export async function GET(_request, { params }) {
  try {
    const { id: newsId } = await params;
    const newsCollection = await getCollection('news');
    const news = await newsCollection.findOne({ id: newsId });

    if (!news) {
      return json({ error: 'News not found' }, { status: 404 });
    }

    // The author photo is deliberately NOT re-resolved from the user profile
    // here any more. It used to be: this route overwrote `authorAvatar` with
    // the author's current users.avatar on every read, so updating a
    // journalist's profile photo retroactively changed the byline on every
    // article they had ever written. Bylines are part of the published
    // record — an article keeps the photo it went out with.
    //
    // Articles now carry their byline in `authors: [{ name, image }]`
    // (scripts/backfillArticleAuthors.mjs migrated the legacy ones), and
    // lib/news/authors.js resolves it. Removing the lookup also drops a
    // per-request users query from this route.

    return json(
      { news },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/news/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}