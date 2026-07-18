import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';

export const OPTIONS = preflight;

export async function GET(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const newsCollection = await getCollection('news');
    const article = await newsCollection.findOne({ id });

    if (!article) {
      return json({ error: 'Article not found' }, { status: 404 });
    }

    const versions = (article.versionHistory || [])
      .map((v, i) => ({
        id: v.id,
        version: i + 1,
        title: v.title,
        status: v.status,
        editedBy: v.editedBy,
        editedByName: v.editedByName,
        editedAt: v.editedAt,
      }))
      .reverse();

    return json({ success: true, articleId: article.id, title: article.title, versions });
  } catch (error) {
    console.error('GET /api/admin/news/[id]/versions error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
