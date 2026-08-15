import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { timeAsync } from '@/lib/perf/perfLog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

const FEED_LIMIT = 10;

// `isBreaking` is never cleared once set, so the flag accumulates: without a
// window the ticker fills with months-old articles and stops reflecting what
// the desk just approved.
const FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Ordered by when the article was *marked* breaking, not when it was
 * published. Sorting on publishedAt meant approving breaking on an existing
 * article placed it wherever its publish date happened to fall — normally far
 * outside the 10-item window — so the ticker never changed in response to the
 * approval. `breakingAt` is only written by the routes that set the flag, so
 * articles flagged before it existed fall back to publishedAt.
 *
 * The freshness filter has to run after $addFields because it applies to the
 * resolved breakingSince, not to either underlying field on its own.
 */
function feedPipeline(since) {
  return [
    { $match: { status: 'published', isBreaking: true, publishedAt: { $lte: new Date() } } },
    { $addFields: { breakingSince: { $ifNull: ['$breakingAt', '$publishedAt'] } } },
    ...(since ? [{ $match: { breakingSince: { $gte: since } } }] : []),
    { $sort: { breakingSince: -1 } },
    { $limit: FEED_LIMIT },
    { $unset: 'breakingSince' },
  ];
}

export async function GET() {
  try {
    const newsCollection = await getCollection('news');

    const cutoff = new Date(Date.now() - FRESHNESS_MS);
    let news = await timeAsync('news.aggregate() (breaking, windowed)', () =>
      newsCollection.aggregate(feedPipeline(cutoff)).toArray()
    );

    // A quiet week shouldn't blank the ticker out entirely — fall back to the
    // most recently flagged articles regardless of age.
    if (news.length === 0) {
      news = await timeAsync('news.aggregate() (breaking, fallback)', () =>
        newsCollection.aggregate(feedPipeline(null)).toArray()
      );
    }

    return json({ news },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/news/breaking error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
