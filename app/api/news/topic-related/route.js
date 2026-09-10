import { json, preflight } from '@/lib/api/cors';
import { getFirstMatchingTag, getArticlesByTag } from '@/lib/seo/data';

export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

// Backs the article page's "More From This Topic" widget. Mirrors the
// already-existing same-category Related Articles widget's client-fetch
// pattern (fetched on every article change, not seeded from SSR props) —
// see app/news/[id]/NewsClient.js's relatedNews effect.
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const tags = (url.searchParams.get('tags') || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const excludeId = url.searchParams.get('excludeId') || undefined;

    const topic = await getFirstMatchingTag(tags);
    if (!topic) {
      return json({ topic: null, articles: [] });
    }

    const { articles } = await getArticlesByTag(topic.name, { limit: 6, excludeId });
    return json({ topic, articles });
  } catch (error) {
    console.error('GET /api/news/topic-related error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
