import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET(_request, { params }) {
  try {
    const authorId = params.id;
    const usersCollection = await getCollection('users');
    const author = await usersCollection.findOne({
      id: authorId,
      role: { $in: ['reporter', 'editor', 'admin'] },
    });

    if (!author) {
      return json({ error: 'Author not found' }, { status: 404 });
    }

    const newsCollection = await getCollection('news');
    const articles = await newsCollection
      .find({ authorId, status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10)
      .toArray();

    return json({ author: { ...author, password: undefined }, articles });
  } catch (error) {
    console.error('GET /api/authors/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
