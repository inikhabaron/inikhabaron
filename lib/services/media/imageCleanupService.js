// Deletes Cloudinary images that no document references any more.
//
// WHY REFERENCE COUNTING IS NOT OPTIONAL
// A journalist's photo is uploaded once and then reused on every article they
// write — editors pick the same file, and re-saving an article carries the
// same URL forward. So "this article no longer uses image X" does NOT mean
// "X is unused". Deleting on that assumption would blank that reporter's
// photo on every other article at once, and Cloudinary destroys are not
// reversible. Every candidate is therefore checked against all documents that
// can hold an image URL before anything is destroyed.
//
// WHY IT CAN NEVER THROW AT THE CALLER
// Cleanup runs after the database write that triggered it. Deleting an
// article is a product guarantee; reclaiming storage is housekeeping. Per the
// editorial/delivery separation this codebase already enforces (see
// CLAUDE.md), the housekeeping must not be able to fail the guarantee — if
// Cloudinary is down, the article is still deleted and the image is simply
// left behind, which is exactly the state the app was in before this existed.
import { getCollection } from '@/lib/mongodb';
import { publicIdFromCloudinaryUrl } from '@/lib/media/cloudinaryUrl';
import { REFERENCE_SOURCES } from '@/lib/media/referenceRegistry';
import { COLLECTIONS } from '@/lib/constants/collections';

// Registry paths use `[]` to mark arrays for the in-memory walker; MongoDB
// traverses arrays implicitly, so `authors[].image` queries as `authors.image`.
const toMongoPath = (path) => path.replace(/\[\]/g, '');

/**
 * Is this URL still referenced anywhere?
 *
 * The field list comes from lib/media/referenceRegistry.js rather than being
 * written out here, so this check and the maintenance scan can never disagree
 * about where images live — a field added for one is automatically seen by the
 * other. Missing a field means deleting an image that is still on screen, so
 * having exactly one list is the point.
 */
async function isStillReferenced(url, { excludeArticleId } = {}) {
  const publicId = publicIdFromCloudinaryUrl(url);

  const checks = REFERENCE_SOURCES.map(async (source) => {
    const clauses = (source.urlPaths || []).map((p) => ({ [toMongoPath(p)]: url }));
    // Sources that store a bare public_id (reels) are matched on that too.
    if (publicId) {
      for (const p of source.publicIdPaths || []) clauses.push({ [toMongoPath(p)]: publicId });
    }
    if (!clauses.length) return false;

    const filter = { $or: clauses };
    // The article being deleted or re-saved must not count as a reference to
    // its own outgoing image.
    if (excludeArticleId && source.collection === COLLECTIONS.NEWS) {
      filter.id = { $ne: excludeArticleId };
    }

    const collection = await getCollection(source.collection);
    return Boolean(await collection.findOne(filter, { projection: { _id: 1 } }));
  });

  // If any single check fails, treat the image as referenced rather than
  // risking a delete on incomplete information.
  const results = await Promise.allSettled(checks);
  return results.some((r) => r.status === 'rejected' || r.value === true);
}

/**
 * Destroys any of `urls` that nothing references any more.
 *
 * @param {string[]} urls candidate URLs (duplicates and nulls are fine)
 * @param {{ excludeArticleId?: string }} opts the article whose references
 *   should be ignored — the one being deleted, or the pre-update state of the
 *   one being saved.
 * @returns {Promise<{ deleted: string[], kept: string[], failed: string[] }>}
 */
export async function cleanupImages(urls, { excludeArticleId } = {}) {
  const result = { deleted: [], kept: [], failed: [] };

  const candidates = [...new Set((urls || []).filter(Boolean))];
  if (!candidates.length) return result;

  // Loaded lazily so the `cloudinary` SDK stays out of the module-load graph
  // of any route that calls this — the rule enforced by
  // scripts/checkInfraBoundary.mjs.
  let deleteImage;
  try {
    ({ deleteImage } = await import('@/lib/cloudinary'));
  } catch (error) {
    console.error('[imageCleanup] Cloudinary SDK unavailable, skipping cleanup:', error.message);
    return { ...result, failed: candidates };
  }

  for (const url of candidates) {
    try {
      const publicId = publicIdFromCloudinaryUrl(url);
      // Not ours (external URL, other cloud, unparseable) — never touch it.
      if (!publicId) {
        result.kept.push(url);
        continue;
      }

      if (await isStillReferenced(url, { excludeArticleId })) {
        result.kept.push(url);
        continue;
      }

      const { success, error } = await deleteImage(publicId);
      if (success) result.deleted.push(url);
      else {
        console.error(`[imageCleanup] destroy failed for ${publicId}:`, error);
        result.failed.push(url);
      }
    } catch (error) {
      console.error('[imageCleanup] unexpected error for', url, error.message);
      result.failed.push(url);
    }
  }

  return result;
}

/** The author-photo URLs on an article document. */
export function authorImageUrls(article) {
  if (!article) return [];
  const fromAuthors = Array.isArray(article.authors)
    ? article.authors.map((a) => a?.image).filter(Boolean)
    : [];
  return fromAuthors;
}
