import { getNewsDraftsCollection } from '@/lib/db/newsDrafts';

/**
 * Auto-save service for news editor drafts.
 *
 * Follows the project's service-layer pattern: named exports, plain
 * primitives, no Request object. The route owns request parsing.
 *
 * Draft lifecycle:
 *   1. Editor opens → client generates a draftId (for new articles) or
 *      looks up the existing draft by newsId (for edits).
 *   2. Every 5s of inactivity + every 30s unconditionally, the client POSTs
 *      the current form state here.
 *   3. On successful manual save/publish, the client DELETEs the draft.
 *   4. Abandoned drafts are garbage-collected by the TTL index (7 days).
 */

/**
 * Upsert a draft. For existing articles (newsId is set), the draft is
 * keyed by { userId, newsId } so there's one per user per article.
 * For new articles (newsId is null), the draft is keyed by { draftId }
 * so a user can have multiple unsaved drafts simultaneously.
 *
 * Returns { draftVersion, autoSavedAt, conflict } where `conflict` is
 * true if an existing draft for the same article was created by a
 * different editor session.
 */
export async function saveDraft(userId, draftId, newsId, sessionId, formData) {
  const collection = await getNewsDraftsCollection();
  const now = new Date();

  // Determine the filter: for existing articles, match by userId+newsId.
  // For new articles, match by draftId (allows multiple new-article drafts).
  const filter = newsId
    ? { userId, newsId }
    : { draftId };

  // Check for conflict: different session editing the same article
  let conflict = false;
  if (newsId) {
    const existing = await collection.findOne(filter, { projection: { sessionId: 1 } });
    if (existing && existing.sessionId && existing.sessionId !== sessionId) {
      conflict = true;
    }
  }

  const result = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        userId,
        draftId,
        newsId: newsId || null,
        sessionId,
        ...formData,
        autoSavedAt: now,
      },
      $inc: { draftVersion: 1 },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const doc = result.value || result;
  return {
    draftVersion: doc.draftVersion,
    autoSavedAt: doc.autoSavedAt,
    conflict,
  };
}

/**
 * Retrieve the latest draft for an existing article being edited.
 * Returns the draft document or null.
 */
export async function getDraftByNewsId(userId, newsId) {
  const collection = await getNewsDraftsCollection();
  return collection.findOne({ userId, newsId });
}

/**
 * Retrieve a specific draft by its draftId (used for new-article drafts).
 * Returns the draft document or null.
 */
export async function getDraftById(draftId) {
  const collection = await getNewsDraftsCollection();
  return collection.findOne({ draftId });
}

/**
 * List all new-article drafts for a user (newsId is null).
 * Sorted by most recently saved first.
 */
export async function listNewDrafts(userId) {
  const collection = await getNewsDraftsCollection();
  return collection
    .find({ userId, newsId: null })
    .sort({ autoSavedAt: -1 })
    .toArray();
}

/**
 * Delete a draft for an existing article after a successful save/publish.
 */
export async function deleteDraftByNewsId(userId, newsId) {
  const collection = await getNewsDraftsCollection();
  const result = await collection.deleteOne({ userId, newsId });
  return { deleted: result.deletedCount > 0 };
}

/**
 * Delete a specific draft by its draftId (for new-article drafts).
 */
export async function deleteDraftById(draftId) {
  const collection = await getNewsDraftsCollection();
  const result = await collection.deleteOne({ draftId });
  return { deleted: result.deletedCount > 0 };
}
