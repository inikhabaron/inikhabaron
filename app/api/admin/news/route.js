import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canCreateArticle, normalizeStatus } from '@/lib/auth/permissions';
import { autoPublishScheduledArticles } from '@/lib/services/news';
import { normalizeAuthorsInput, primaryAuthorName } from '@/lib/news/authors';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    await autoPublishScheduledArticles();
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const newsCollection = await getCollection('news');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const [news, total] = await Promise.all([
      newsCollection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      newsCollection.countDocuments(query),
    ]);

    return json({
      news,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/admin/news error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !canCreateArticle(user)) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const newsCollection = await getCollection('news');
    const status = normalizeStatus(body.status) || 'draft';
    const authors = normalizeAuthorsInput(body.authors);

    const newsItem = {
      id: uuidv4(),
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content: body.content,
      excerpt: body.excerpt || body.content?.substring(0, 200),
      category: body.category,
      tags: (body.tags || []).filter(
        tag => tag?.toLowerCase() !== body.category?.toLowerCase()
      ),
      featuredImage: body.featuredImage || null,
      images: body.images || [],
      location: body.location || { enabled: false, scope: "national", country: "India", },
      status,
      scheduledAt: status === 'scheduled' && body.scheduledAt ? new Date(body.scheduledAt) : null,
      publishedAt: status === 'published' ? new Date() : null,
      isBreaking: false,
      breakingApproved: false,
      breakingSuggested: body.breakingSuggested || false,
      isTrending: false,
      trendingSuggested: body.trendingSuggested || false,
      isFeatured: body.isFeatured || false,
      shares: {
        whatsapp: 0,
        twitter: 0,
        facebook: 0,
      },
      authorId: user.id,
      authorLabel: body.authorLabel || 'Author',
      // Per-article byline. `authorName` stays populated (from the first
      // author) because the calendar, admin list, RSS and recommendation
      // scorer all still read it — see lib/news/authors.js.
      authors: authors || [{ name: user.name, image: null }],
      authorName: primaryAuthorName(authors) || body.authorName || user.name,
      // Retained for articles whose byline still comes from the creator's
      // profile photo. New articles carry their photos in `authors`.
      authorAvatar: user.avatar || null,
      source: body.source || null,
      sourceUrl: body.sourceUrl || null,
      seoTitle: body.seoTitle || body.title,
      seoDescription: body.seoDescription || body.excerpt,
      seoKeywords: body.seoKeywords || [],
      reviewedBy: null,
      approvedBy: null,
      versionHistory: [],
      corrections: [],
      approvalHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await newsCollection.insertOne(newsItem);
    return json({ success: true, news: newsItem }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/news error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
