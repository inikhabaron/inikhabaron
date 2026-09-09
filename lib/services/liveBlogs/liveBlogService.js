import { v4 as uuidv4 } from 'uuid';
import { getLiveBlogsCollection } from '@/lib/db/liveBlogs';
import { getLiveBlogUpdatesCollection } from '@/lib/db/liveBlogUpdates';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

// Locked 2026-09-09 — do not introduce synonyms (active/published/running/
// closed). Every API validates against this exact list.
export const LIVE_BLOG_STATUSES = ['draft', 'live', 'completed', 'archived'];
// Drives the polling interval (see refreshIntervalForLiveBlog in
// lib/liveBlogs/pollStatus.js) and the admin type selector.
export const LIVE_BLOG_TYPES = ['election', 'sports', 'breaking', 'general'];
// Public listing/detail only ever shows these — 'draft' is admin-preview
// only, 'archived' is retired, same spirit as news' status !== 'published'
// staying unlisted.
const PUBLIC_STATUSES = ['live', 'completed'];

export function isValidLiveBlogStatus(status) {
  return LIVE_BLOG_STATUSES.includes(status);
}

export function isValidLiveBlogType(type) {
  return LIVE_BLOG_TYPES.includes(type);
}

function slugify(title) {
  return String(title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Keeps a linked article's isLive/liveBlogId in sync with this blog's own
// linkedArticleId/status. isLive tracks "show the inline ticker right
// now", which is only true while the blog itself is status:'live' — a
// draft or completed/archived blog stays linked (liveBlogId persists, so a
// finished event can still be referenced) but the ticker disappears.
async function syncLinkedArticle({ previousArticleId, nextArticleId, blogId, status }) {
  const newsCollection = await getCollection(COLLECTIONS.NEWS);

  if (previousArticleId && previousArticleId !== nextArticleId) {
    await newsCollection.updateOne(
      { id: previousArticleId, liveBlogId: blogId },
      { $set: { isLive: false, liveBlogId: null } },
    );
  }

  if (nextArticleId) {
    await newsCollection.updateOne(
      { id: nextArticleId },
      { $set: { isLive: status === 'live', liveBlogId: blogId } },
    );
  }
}

export async function createLiveBlog({ title, type, featuredImage, summary, linkedArticleId, createdBy }) {
  const collection = await getLiveBlogsCollection();
  const now = new Date();
  const id = uuidv4();
  const status = 'draft';

  const blog = {
    id,
    title,
    slug: slugify(title),
    type,
    status,
    featuredImage: featuredImage || '',
    summary: summary || '',
    linkedArticleId: linkedArticleId || null,
    createdBy,
    createdAt: now,
    updatedAt: now,
    endedAt: null,
  };

  await collection.insertOne(blog);

  if (linkedArticleId) {
    await syncLinkedArticle({ previousArticleId: null, nextArticleId: linkedArticleId, blogId: id, status });
  }

  return blog;
}

export async function updateLiveBlog(id, updates) {
  const collection = await getLiveBlogsCollection();
  const existing = await collection.findOne({ id });
  if (!existing) return null;

  const now = new Date();
  const set = { updatedAt: now };

  if (updates.title !== undefined) {
    set.title = updates.title;
    set.slug = slugify(updates.title);
  }
  if (updates.type !== undefined) set.type = updates.type;
  if (updates.featuredImage !== undefined) set.featuredImage = updates.featuredImage;
  if (updates.summary !== undefined) set.summary = updates.summary;
  if (updates.status !== undefined) {
    set.status = updates.status;
    if (updates.status === 'completed' || updates.status === 'archived') {
      set.endedAt = existing.endedAt || now;
    }
  }
  if (updates.linkedArticleId !== undefined) set.linkedArticleId = updates.linkedArticleId || null;

  await collection.updateOne({ id }, { $set: set });

  const nextStatus = set.status || existing.status;
  const nextArticleId = updates.linkedArticleId !== undefined ? (updates.linkedArticleId || null) : existing.linkedArticleId;

  if (updates.linkedArticleId !== undefined || updates.status !== undefined) {
    await syncLinkedArticle({
      previousArticleId: existing.linkedArticleId,
      nextArticleId,
      blogId: id,
      status: nextStatus,
    });
  }

  return collection.findOne({ id });
}

// Deleting a blog cascade-deletes its updates (locked 2026-09-09) — an
// update has no standalone value without its parent, unlike an article
// surviving its category's deletion.
export async function deleteLiveBlog(id) {
  const collection = await getLiveBlogsCollection();
  const existing = await collection.findOne({ id });
  if (!existing) return { deleted: false };

  if (existing.linkedArticleId) {
    await syncLinkedArticle({ previousArticleId: existing.linkedArticleId, nextArticleId: null, blogId: id, status: existing.status });
  }

  await (await getLiveBlogUpdatesCollection()).deleteMany({ blogId: id });
  const result = await collection.deleteOne({ id });

  return { deleted: result.deletedCount > 0 };
}

export async function getLiveBlogs({ status, page = 1, limit = 20, publicOnly = false } = {}) {
  const collection = await getLiveBlogsCollection();
  const query = {};

  if (publicOnly) {
    query.status = status && PUBLIC_STATUSES.includes(status) ? status : { $in: PUBLIC_STATUSES };
  } else if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const [blogs, total] = await Promise.all([
    collection.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(query),
  ]);

  return { blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getLiveBlogById(id) {
  return (await getLiveBlogsCollection()).findOne({ id });
}

// Public detail lookup — a draft or archived blog doesn't exist as far as
// a reader is concerned, same as an unpublished article 404ing.
export async function getPublicLiveBlogBySlug(slug) {
  const blog = await (await getLiveBlogsCollection()).findOne({ slug });
  if (!blog || !PUBLIC_STATUSES.includes(blog.status)) return null;
  return blog;
}
