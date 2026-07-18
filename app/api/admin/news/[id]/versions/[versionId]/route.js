import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';

export const OPTIONS = preflight;

export async function GET(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id, versionId } = await params;
    const newsCollection = await getCollection('news');
    const article = await newsCollection.findOne({ id });

    if (!article) {
      return json({ error: 'Article not found' }, { status: 404 });
    }

    const idx = (article.versionHistory || []).findIndex(v => v.id === versionId);
    if (idx === -1) {
      return json({ error: 'Version not found' }, { status: 404 });
    }

    const version = { ...article.versionHistory[idx], version: idx + 1 };

    return json({ success: true, articleId: article.id, version });
  } catch (error) {
    console.error('GET /api/admin/news/[id]/versions/[versionId] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
