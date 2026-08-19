import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { canCreateArticle, checkRole, normalizeStatus } from '@/lib/auth/permissions';
import { normalizeAuthorsInput, primaryAuthorName } from '@/lib/news/authors';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

// The admin list renders title/excerpt/category/tags/status/date per row and
// never the article body or its editorial history — but `content` (~34 KB avg)
// and `versionHistory` (~32 KB avg) are together ~96% of a news document's
// bytes. Unprojected, a single `?limit=1000` list request tried to serialize
// ~56 MB across 844 articles; the cursor blew past the driver's
// socketTimeoutMS (lib/mongodb.js) long before it finished, so the route threw
// and returned 500 for every admin list call — Posts, the promotions article
// picker, and the calendar's schedule modal all showed empty. The editor loads
// the full document from GET /api/admin/news/[id] when an article is opened.
const LIST_EXCLUDE_PROJECTION = {
  content: 0,
  versionHistory: 0,
  approvalHistory: 0,
  corrections: 0,
  headlineVariants: 0,
};

// A hard ceiling on how much one request can ask for. The projection above
// keeps a page small, but nothing stopped a caller from asking for every
// article at once — which is exactly how this endpoint broke. The cap makes
// the payload bounded by the API rather than by the caller's good behaviour.
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function GET(request) {
  try {
    // Staff-only. This listing exposes drafts, rejected articles and
    // in-review copy, none of which is public — it previously had no auth
    // check at all, so any unauthenticated caller could read all of it.
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const newsCollection = await getCollection('news');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const skip = (page - 1) * limit;

    let query = {};

    // Reporters see only their own work. This is derived from the token, not
    // from the caller-supplied `authorId` the client used to send — that param
    // was never read, so a reporter's token returned the entire collection,
    // and a hand-made request could have claimed any author id it liked.
    // Admins and editors see everything, which is what the review and
    // publishing workflows need.
    if (checkRole(gate.user, ['reporter'])) {
      query.authorId = gate.user.id;
    }

    if (status && status !== 'all') {
      // Comma-separated accepted so a caller can ask for a set of statuses in
      // one query — the schedule picker wants "everything not yet published",
      // which it previously got by over-fetching and discarding published
      // articles in the browser. That stops working the moment the response
      // is paged, since a page can be entirely published articles.
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 1) query.status = { $in: statuses };
      else if (statuses.length === 1) query.status = statuses[0];
    }

    if (search) {
      // Substring match rather than the news_text_search index: this backs a
      // filter-as-you-type box, and $text matches stemmed whole words, so
      // partial words — the normal state of a half-typed query, and most of
      // what gets typed in Hindi — would stop matching what the previous
      // client-side `includes` filter found.
      const pattern = new RegExp(escapeRegex(search), 'i');
      query.$or = [{ title: pattern }, { category: pattern }, { tags: pattern }];
    }

    const [news, total] = await Promise.all([
      newsCollection
        .find(query, { projection: LIST_EXCLUDE_PROJECTION })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
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
