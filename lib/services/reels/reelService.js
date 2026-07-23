import { v4 as uuidv4 } from 'uuid';
import { getReelsCollection } from '@/lib/db/reels';
import { getReelViewEventsCollection } from '@/lib/db/reelViewEvents';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { getReelThumbnailUrl, getOptimizedVideoUrl } from '@/lib/cloudinary';

export const REEL_STATUSES = ['draft', 'scheduled', 'published', 'unpublished'];
export const REEL_REPORT_STATUSES = ['none', 'pending', 'reviewed', 'actioned'];
export const REEL_ANALYTICS_EVENTS = ['view', 'threeSecond', 'complete', 'replay', 'exit', 'share'];
const SHARE_PLATFORMS = ['whatsapp', 'twitter', 'facebook', 'instagram', 'copyLink'];

const DEBOUNCE_MS = 30 * 1000;
let lastAutoPublishRunAt = 0;

// A "view" only counts once a client has actually watched some of the
// video, and only once per viewer per window — otherwise a single viewer
// (or a script) refreshing/re-firing the event can inflate the counter
// arbitrarily, which is exactly the kind of number an editor or a future
// ads/monetization decision would end up trusting.
const MIN_VIEW_WATCH_MS = 2000;
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;

// Returns true the first time this viewer is seen for this reel within the
// current window (and records it), false on every repeat within that same
// window. `viewerKey` is the authenticated userId when available, otherwise
// a client-generated anonymous key — if neither is supplied there is no
// identity to dedup against, so the view is counted (same as before this
// fix) rather than silently dropped.
async function shouldCountView(reelId, viewerKey) {
  if (!viewerKey) return true;

  const events = await getReelViewEventsCollection();
  const windowBucket = Math.floor(Date.now() / VIEW_DEDUP_WINDOW_MS);

  try {
    await events.insertOne({ reelId, viewerKey, windowBucket, createdAt: new Date() });
    return true;
  } catch (error) {
    if (error?.code === 11000) return false; // duplicate key => already counted this window
    throw error;
  }
}

function sanitizeContentFields(body) {
  return {
    title: (body.title || '').trim(),
    description: body.description || '',
    video: body.video || null,
    thumbnail: body.thumbnail || null,
    category: body.category || '',
    tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],
    reporterId: body.reporterId,
    location: body.location || { enabled: false, scope: 'national', country: 'India' },
    language: body.language || 'en',
    linkedArticleId: body.linkedArticleId || null,
    isFeatured: body.isFeatured === true,
    isAd: body.isAd === true,
    sponsorId: body.sponsorId || null,
    campaignId: body.campaignId || null,
  };
}

// scheduledAt/publishedAt are derived from status rather than trusted
// verbatim from the body, mirroring how app/api/admin/news handles the same
// transition (publishedAt is only stamped the moment status first becomes
// 'published', not re-stamped on every subsequent edit).
function sanitizeStatusFields(body, existingStatus, existingPublishedAt) {
  const status = REEL_STATUSES.includes(body.status) ? body.status : (existingStatus || 'draft');
  const fields = {
    status,
    scheduledAt: status === 'scheduled' && body.scheduledAt ? new Date(body.scheduledAt) : null,
  };
  if (status === 'published') {
    fields.publishedAt = existingPublishedAt || new Date();
  } else if (existingStatus === undefined) {
    fields.publishedAt = null;
  }
  return fields;
}

// Batch-joins reporterId -> users and linkedArticleId -> news so callers get
// display-ready `reporter`/`linkedArticle` objects without a second request,
// mirroring the join lib/services/follow/followService.js already does for
// followedAuthors instead of snapshotting name/label onto the document.
async function enrichReels(reelDocs) {
  if (!reelDocs.length) return [];

  const reporterIds = [...new Set(reelDocs.map((r) => r.reporterId).filter(Boolean))];
  const articleIds = [...new Set(reelDocs.map((r) => r.linkedArticleId).filter(Boolean))];

  const [users, articles] = await Promise.all([
    reporterIds.length
      ? (await getCollection(COLLECTIONS.USERS))
          .find({ id: { $in: reporterIds } })
          .project({ _id: 0, id: 1, name: 1, avatar: 1 })
          .toArray()
      : [],
    articleIds.length
      ? (await getCollection(COLLECTIONS.NEWS))
          .find({ id: { $in: articleIds } })
          .project({ _id: 0, id: 1, title: 1, slug: 1 })
          .toArray()
      : [],
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const articleMap = new Map(articles.map((a) => [a.id, a]));

  return reelDocs.map((r) => ({
    ...r,
    reporter: userMap.get(r.reporterId) || null,
    linkedArticle: r.linkedArticleId ? (articleMap.get(r.linkedArticleId) || null) : null,
    thumbnails: buildThumbnailUrls(r),
    video: r.video ? { ...r.video, ...buildVideoPlaybackUrls(r.video) } : r.video,
  }));
}

// Cloudinary URL derivation needs the server-only `cloudinary` SDK
// (lib/cloudinary.js), so every client component gets ready-made thumbnail
// URL strings on the response instead of deriving them itself — the same
// "client just gets a URL string" shape ImageUpload's secure_url already
// establishes, never a public_id the client would need Cloudinary knowledge
// to render.
function buildThumbnailUrls(reel) {
  const customPublicId = reel.thumbnail?.publicId;
  const publicId = customPublicId || reel.video?.publicId;
  if (!publicId) return null;

  const isVideo = !customPublicId;
  return {
    small: getReelThumbnailUrl(publicId, 'small', { isVideo }),
    medium: getReelThumbnailUrl(publicId, 'medium', { isVideo }),
    large: getReelThumbnailUrl(publicId, 'large', { isVideo }),
  };
}

// `video.url` stays the raw Cloudinary secure_url from upload (full source
// bitrate/format) for reference; `playbackUrl`/`playbackUrlLowBandwidth` are
// the delivery URLs any client should actually play — f_auto/q_auto lets
// Cloudinary transcode+compress per requesting client with zero re-upload.
function buildVideoPlaybackUrls(video) {
  if (!video?.publicId) return {};
  const format = video.format || 'mp4';
  return {
    playbackUrl: getOptimizedVideoUrl(video.publicId, format, 'auto'),
    playbackUrlLowBandwidth: getOptimizedVideoUrl(video.publicId, format, 'auto:low'),
  };
}

export async function createReel(body) {
  const reels = await getReelsCollection();
  const statusFields = sanitizeStatusFields(body, undefined, null);

  const reel = {
    id: uuidv4(),
    ...sanitizeContentFields(body),
    ...statusFields,
    isSensitive: body.isSensitive === true,
    isReported: false,
    reportCount: 0,
    reportStatus: 'none',
    isDeleted: false,
    deletedAt: null,
    views: 0,
    threeSecondViews: 0,
    completedViews: 0,
    replayCount: 0,
    exitCount: 0,
    totalWatchTimeMs: 0,
    likeCount: 0,
    bookmarkCount: 0,
    commentCount: 0,
    shares: { whatsapp: 0, twitter: 0, facebook: 0, instagram: 0, copyLink: 0, other: 0 },
    createdBy: body.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await reels.insertOne(reel);
  return reel;
}

export async function getReel(id) {
  const reels = await getReelsCollection();
  const reel = await reels.findOne({ id });
  if (!reel) return null;
  const [enriched] = await enrichReels([reel]);
  return enriched;
}

// updateData is whatever the calling route has already decided is safe to
// apply (content fields, status/scheduledAt, and — only once the route has
// verified canModerateReel/admin-only — isSensitive/reportStatus/isDeleted).
// This never touches counters (views/likeCount/etc.) or id/createdAt/createdBy.
export async function updateReel(id, updateData) {
  const reels = await getReelsCollection();
  const existing = await reels.findOne({ id });
  if (!existing) return null;

  const patch = { ...updateData };
  if (updateData.status !== undefined) {
    Object.assign(patch, sanitizeStatusFields(updateData, existing.status, existing.publishedAt));
  }

  const result = await reels.findOneAndUpdate(
    { id },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  const reel = result?.value || result;
  if (!reel) return null;
  const [enriched] = await enrichReels([reel]);
  return enriched;
}

export async function deleteReel(id) {
  const reels = await getReelsCollection();
  const result = await reels.findOneAndUpdate(
    { id },
    { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return result?.value || result || null;
}

export async function restoreReel(id) {
  const reels = await getReelsCollection();
  const result = await reels.findOneAndUpdate(
    { id },
    { $set: { isDeleted: false, deletedAt: null, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return result?.value || result || null;
}

export async function listReelsAdmin({
  page = 1,
  limit = 20,
  status,
  category,
  reporterId,
  search,
  includeDeleted = false,
} = {}) {
  const reels = await getReelsCollection();
  const query = {};
  // A plain equality (every reel document always explicitly sets isDeleted
  // at creation, never leaves it undefined) rather than `{$ne:true}` — the
  // negation form defeats this collection's status+isDeleted+publishedAt/
  // createdAt compound indexes' ability to serve the sort without a
  // blocking in-memory SORT stage (confirmed via explain() against a
  // 5,000-doc seed: $ne examined the entire matching branch on every
  // request; equality drops that to just the page size).
  if (!includeDeleted) query.isDeleted = false;
  if (status && status !== 'all') query.status = status;
  if (category && category !== 'all') query.category = category;
  if (reporterId) query.reporterId = reporterId;

  const skip = (page - 1) * limit;

  let cursor;
  if (search) {
    query.$text = { $search: search };
    cursor = reels
      .find(query, { projection: { score: { $meta: 'textScore' } } })
      .sort({ score: { $meta: 'textScore' } });
  } else {
    cursor = reels.find(query).sort({ createdAt: -1 });
  }

  const [docs, total] = await Promise.all([
    cursor.skip(skip).limit(limit).toArray(),
    reels.countDocuments(query),
  ]);

  const items = await enrichReels(docs);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getFeed({ page = 1, limit = 10, sort = 'latest', category } = {}) {
  await autoPublishScheduledReels();

  const reels = await getReelsCollection();
  // Plain equality, not `{$ne:true}` — see the comment on the same pattern
  // in listReelsAdmin; this is what lets status+isDeleted+publishedAt serve
  // the sort below directly instead of triggering a blocking in-memory sort.
  const match = { status: 'published', isDeleted: false };
  if (category && category !== 'all') match.category = category;

  const skip = (page - 1) * limit;

  if (sort === 'latest') {
    const [docs, total] = await Promise.all([
      reels.find(match).sort({ publishedAt: -1 }).skip(skip).limit(limit).toArray(),
      reels.countDocuments(match),
    ]);
    const items = await enrichReels(docs);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // 'trending' and 'personalized' (personalized currently behaves like
  // trending — the intended extension point for a future recommendation
  // engine) both rank by a recency-decayed engagement score, computed at
  // query time rather than stored, factoring in completion rate: a reel
  // watched to 95% is a stronger signal than one abandoned at 5s.
  //
  // The candidate set is bounded to a recent window (unlike 'latest', which
  // legitimately shows everything) — confirmed via explain() that without
  // this bound, every trending request pulls the ENTIRE published corpus
  // through the scoring pipeline before sorting/limiting, which is fine at
  // a few thousand reels but grows unbounded forever. A month-old reel
  // being "trending" isn't a real product case anyway, so this is a
  // deliberate product+performance decision, not just a perf hack.
  const TRENDING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  const trendingMatch = { ...match, publishedAt: { $gte: new Date(Date.now() - TRENDING_WINDOW_MS) } };
  const pipeline = [
    { $match: trendingMatch },
    {
      $addFields: {
        _ageHours: { $divide: [{ $subtract: [new Date(), '$publishedAt'] }, 1000 * 60 * 60] },
        _completionRate: {
          $cond: [{ $gt: ['$views', 0] }, { $divide: ['$completedViews', '$views'] }, 0],
        },
        _shareTotal: {
          $add: [
            { $ifNull: ['$shares.whatsapp', 0] },
            { $ifNull: ['$shares.twitter', 0] },
            { $ifNull: ['$shares.facebook', 0] },
            { $ifNull: ['$shares.instagram', 0] },
            { $ifNull: ['$shares.copyLink', 0] },
            { $ifNull: ['$shares.other', 0] },
          ],
        },
      },
    },
    {
      $addFields: {
        _score: {
          $divide: [
            {
              $add: [
                { $multiply: ['$likeCount', 2] },
                '$views',
                { $multiply: ['$commentCount', 2] },
                { $multiply: ['$_shareTotal', 3] },
                { $multiply: ['$_completionRate', 50] },
              ],
            },
            { $pow: [{ $add: ['$_ageHours', 2] }, 1.5] },
          ],
        },
      },
    },
    { $sort: { _score: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const [docs, total] = await Promise.all([
    reels.aggregate(pipeline).toArray(),
    // Counts against the same bounded window the ranking pipeline used, so
    // `pages` reflects how many pages of *trending* results actually exist
    // rather than the full historical published count.
    reels.countDocuments(trendingMatch),
  ]);
  const items = await enrichReels(docs);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getRelatedReels(reelId, limit = 10) {
  const reels = await getReelsCollection();
  const reel = await reels.findOne({ id: reelId });
  if (!reel) return [];

  const docs = await reels
    .find({ id: { $ne: reelId }, category: reel.category, status: 'published', isDeleted: false })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .toArray();

  return enrichReels(docs);
}

// One handler + an event->mutation map instead of a route per signal, so new
// engagement events can be added later without growing the route surface.
export async function recordAnalyticsEvent(id, event, payload = {}) {
  if (!REEL_ANALYTICS_EVENTS.includes(event)) {
    return { success: false, reason: 'INVALID_EVENT' };
  }

  const reels = await getReelsCollection();

  // 'view' is handled separately: it requires a minimum watch duration and
  // is deduped per viewer per window (see MIN_VIEW_WATCH_MS/shouldCountView
  // above) — every other event is a plain, un-deduped counter, same as before.
  if (event === 'view') {
    if (!Number.isFinite(payload.watchDurationMs) || payload.watchDurationMs < MIN_VIEW_WATCH_MS) {
      return { success: false, reason: 'WATCH_DURATION_TOO_SHORT' };
    }

    const counted = await shouldCountView(id, payload.viewerKey || null);
    if (!counted) {
      const existing = await reels.findOne({ id });
      if (!existing) return { success: false, reason: 'NOT_FOUND' };
      return { success: true, event, counted: false };
    }

    const result = await reels.findOneAndUpdate(
      { id },
      { $inc: { views: 1, totalWatchTimeMs: payload.watchDurationMs }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    const reel = result?.value || result;
    if (!reel) return { success: false, reason: 'NOT_FOUND' };
    return { success: true, event, counted: true };
  }

  const inc = {};
  switch (event) {
    case 'threeSecond':
      inc.threeSecondViews = 1;
      break;
    case 'complete':
      inc.completedViews = 1;
      break;
    case 'replay':
      inc.replayCount = 1;
      break;
    case 'exit':
      inc.exitCount = 1;
      break;
    case 'share': {
      const platform = SHARE_PLATFORMS.includes(payload.platform) ? payload.platform : 'other';
      inc[`shares.${platform}`] = 1;
      break;
    }
  }

  const result = await reels.findOneAndUpdate(
    { id },
    { $inc: inc, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  const reel = result?.value || result;
  if (!reel) return { success: false, reason: 'NOT_FOUND' };

  return { success: true, event };
}

// Debounced the same way lib/services/news.js's autoPublishScheduledArticles
// is — called on nearly every feed GET, so at most once per 30s per warm
// instance rather than once per request.
export async function autoPublishScheduledReels() {
  const now = Date.now();
  if (now - lastAutoPublishRunAt < DEBOUNCE_MS) return 0;
  lastAutoPublishRunAt = now;

  try {
    const reels = await getReelsCollection();
    const nowDate = new Date();
    const result = await reels.updateMany(
      { status: 'scheduled', scheduledAt: { $lte: nowDate } },
      { $set: { status: 'published', publishedAt: nowDate, updatedAt: nowDate } }
    );
    return result.modifiedCount;
  } catch (error) {
    console.error('Reel auto-publish error:', error);
    return 0;
  }
}
