// Builds an in-memory index of every Cloudinary asset the database still
// points at, in ONE pass per collection.
//
// WHY AN INDEX AND NOT PER-ASSET QUERIES
// imageCleanupService asks "is this one URL still used?" and issues a query to
// find out. That is right for deleting an article's 1-5 author photos. It is
// wrong for a maintenance scan: with N assets it becomes N round trips, so a
// few thousand assets would mean a few thousand queries and a scan that takes
// minutes. Here the cost is instead one scan per source collection, after
// which every asset lookup is an O(1) Map hit.
//
// KEYED BY PUBLIC_ID, NOT URL
// The same asset legitimately appears under several URLs — a reel video is
// stored as the raw upload plus `f_auto,q_auto` and `q_auto:low` delivery
// variants, and its thumbnails are `.jpg` transforms of the very same
// public_id. Indexing by URL would treat those as different assets and report
// the underlying video as unreferenced.
import { getCollection } from '@/lib/mongodb';
import { publicIdFromCloudinaryUrl } from '@/lib/media/cloudinaryUrl';
import {
  REFERENCE_SOURCES,
  projectionForSource,
  extractAtPaths,
} from '@/lib/media/referenceRegistry';

const CLOUDINARY_HOST = 'res.cloudinary.com';

/**
 * @returns {Promise<{
 *   byPublicId: Map<string, Array<{collection,label,docId,title,field}>>,
 *   unparseable: Array<{raw,label,docId,field}>,
 *   scanned: Record<string, number>,
 * }>}
 */
export async function buildReferenceIndex() {
  const byPublicId = new Map();
  const unparseable = [];
  const scanned = {};

  const add = (publicId, ref) => {
    const list = byPublicId.get(publicId);
    if (list) list.push(ref);
    else byPublicId.set(publicId, [ref]);
  };

  for (const source of REFERENCE_SOURCES) {
    let collection;
    try {
      collection = await getCollection(source.collection);
    } catch (error) {
      // A collection that cannot be read is a hole in our knowledge of what is
      // referenced. Surface it rather than silently scanning without it —
      // callers refuse to classify anything as orphaned when this happens.
      throw new Error(`Cannot read collection "${source.collection}": ${error.message}`);
    }

    const docs = await collection.find({}, { projection: projectionForSource(source) }).toArray();
    scanned[source.collection] = docs.length;

    for (const doc of docs) {
      const common = {
        collection: source.collection,
        label: source.label,
        docId: doc.id ?? String(doc._id ?? ''),
        title: source.titleField ? doc[source.titleField] : undefined,
      };

      // Bare public ids need no parsing and cannot be misread.
      for (const { value, location } of extractAtPaths(doc, source.publicIdPaths)) {
        add(value, { ...common, field: location });
      }

      for (const { value, location } of extractAtPaths(doc, source.urlPaths)) {
        const publicId = publicIdFromCloudinaryUrl(value);
        if (publicId) {
          add(publicId, { ...common, field: location });
        } else if (value.includes(CLOUDINARY_HOST)) {
          // Points at Cloudinary but we could not derive a public_id — an
          // unrecognised transform shape, or another cloud. We cannot prove
          // which asset it protects, so it is recorded and later treated as a
          // reason to refuse deletion rather than ignored.
          unparseable.push({ raw: value, label: source.label, docId: common.docId, field: location });
        }
        // Anything else is an external URL and irrelevant here.
      }
    }
  }

  return { byPublicId, unparseable, scanned };
}

/**
 * Conservative safety net for the unparseable references above: if a raw
 * stored URL contains this public_id as a path segment, assume it refers to
 * this asset and treat the asset as in use.
 */
export function matchesUnparseable(unparseable, publicId) {
  if (!publicId) return [];
  return unparseable.filter((u) => u.raw.includes(`/${publicId}.`) || u.raw.includes(`/${publicId}/`) || u.raw.endsWith(`/${publicId}`));
}
