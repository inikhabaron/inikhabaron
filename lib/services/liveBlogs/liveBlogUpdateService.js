import { v4 as uuidv4 } from 'uuid';
import { getLiveBlogUpdatesCollection } from '@/lib/db/liveBlogUpdates';

export const LIVE_BLOG_UPDATE_STATUSES = ['draft', 'published'];

export function isValidLiveBlogUpdateStatus(status) {
  return LIVE_BLOG_UPDATE_STATUSES.includes(status);
}

// A drafted update lets an editor queue text before it goes live — a
// raw-typo update going instantly live on a breaking-election feed is the
// failure mode this exists to avoid (see docs/mvp3-phase1-architecture.md,
// Task 2). publishedAt is only set once status is 'published', so a draft
// never appears in the newest-first public feed ordering.
export async function createLiveBlogUpdate(blogId, { content, media, status, authorId }) {
  const collection = await getLiveBlogUpdatesCollection();
  const now = new Date();
  const resolvedStatus = status === 'draft' ? 'draft' : 'published';

  const update = {
    id: uuidv4(),
    blogId,
    content,
    media: media || [],
    status: resolvedStatus,
    authorId,
    publishedAt: resolvedStatus === 'published' ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(update);
  return update;
}

export async function updateLiveBlogUpdate(blogId, updateId, changes) {
  const collection = await getLiveBlogUpdatesCollection();
  const existing = await collection.findOne({ id: updateId, blogId });
  if (!existing) return null;

  const now = new Date();
  const set = { updatedAt: now };

  if (changes.content !== undefined) set.content = changes.content;
  if (changes.media !== undefined) set.media = changes.media;
  if (changes.status !== undefined) {
    set.status = changes.status;
    // Publishing a drafted update for the first time stamps publishedAt
    // now, not at creation — that's what puts it in the right place in
    // the newest-first feed ordering instead of back-dated to when it was
    // merely drafted.
    if (changes.status === 'published' && !existing.publishedAt) {
      set.publishedAt = now;
    }
  }

  await collection.updateOne({ id: updateId, blogId }, { $set: set });
  return collection.findOne({ id: updateId, blogId });
}

export async function deleteLiveBlogUpdate(blogId, updateId) {
  const collection = await getLiveBlogUpdatesCollection();
  const result = await collection.deleteOne({ id: updateId, blogId });
  return { deleted: result.deletedCount > 0 };
}

/** Admin: every update regardless of status, newest-first, for the manage view. */
export async function getLiveBlogUpdatesForAdmin(blogId, { page = 1, limit = 50 } = {}) {
  const collection = await getLiveBlogUpdatesCollection();
  const skip = (page - 1) * limit;

  const [updates, total] = await Promise.all([
    collection.find({ blogId }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments({ blogId }),
  ]);

  return { updates, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

/** Public: published only, newest-first. */
export async function getPublicLiveBlogUpdates(blogId, { page = 1, limit = 20 } = {}) {
  const collection = await getLiveBlogUpdatesCollection();
  const query = { blogId, status: 'published' };
  const skip = (page - 1) * limit;

  const [updates, total] = await Promise.all([
    collection.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(query),
  ]);

  return { updates, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
