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

    // authorAvatar stored on the article is a snapshot from when it was
    // created/backfilled — resolve the author's current avatar live here
    // (a single extra lookup, cheap for a one-item fetch) so a later profile
    // photo update shows up immediately instead of only on the next edit.
    if (news.authorId) {
      const usersCollection = await getCollection('users');
      const author = await usersCollection.findOne(
        { id: news.authorId },
        { projection: { avatar: 1 } }
      );
      news.authorAvatar = author?.avatar || null;
    }

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