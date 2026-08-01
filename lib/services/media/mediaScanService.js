// Read-only scan: enumerate Cloudinary assets, cross-reference them against
// the database, and classify each one. Deletes nothing, ever.
//
// CLASSIFICATION IS DELIBERATELY THREE-WAY
// referenced / orphaned / unknown. "unknown" is the safety valve: any asset we
// cannot confidently prove is unused lands there instead of in "orphaned", and
// only "orphaned" is ever deletable. Every doubt resolves toward keeping the
// file.
import {
  buildReferenceIndex,
  matchesUnparseable,
} from '@/lib/services/media/mediaReferenceIndex';

// An asset uploaded seconds ago is normally not referenced yet — the editor is
// still filling in the form and has not saved. This scan walks
// Cloudinary -> database, the opposite direction from cleanup on save, so
// in-progress uploads look exactly like orphans. Anything younger than this is
// never deletable.
export const MIN_AGE_MS = 24 * 60 * 60 * 1000;

export const RESOURCE_TYPES = ['image', 'video'];

export const STATUS = Object.freeze({
  REFERENCED: 'referenced',
  ORPHANED: 'orphaned',
  UNKNOWN: 'unknown',
});

function folderOf(publicId) {
  const i = publicId.lastIndexOf('/');
  return i === -1 ? '(root)' : publicId.slice(0, i);
}

function classify(asset, index, now) {
  const refs = index.byPublicId.get(asset.publicId) || [];
  if (refs.length) {
    return { status: STATUS.REFERENCED, references: refs, reason: null };
  }

  // Could this asset be the target of a reference we failed to parse?
  const fuzzy = matchesUnparseable(index.unparseable, asset.publicId);
  if (fuzzy.length) {
    return {
      status: STATUS.UNKNOWN,
      references: fuzzy.map((f) => ({ ...f, field: `${f.field} (unparsed URL)` })),
      reason: 'A stored URL appears to point at this asset but could not be parsed.',
    };
  }

  if (!asset.createdAt) {
    return { status: STATUS.UNKNOWN, references: [], reason: 'Cloudinary reported no creation date, so its age cannot be verified.' };
  }

  const ageMs = now - asset.createdAt;
  if (ageMs < MIN_AGE_MS) {
    const hours = Math.max(1, Math.round(ageMs / 3_600_000));
    return { status: STATUS.UNKNOWN, references: [], reason: `Uploaded ${hours}h ago — may belong to an unsaved draft. Eligible after 24h.` };
  }

  return { status: STATUS.ORPHANED, references: [], reason: null };
}

/**
 * @returns a full scan report. Never mutates anything.
 */
export async function scanMedia({ now = Date.now() } = {}) {
  // Lazily loaded so the Cloudinary SDK stays out of any route's module-load
  // graph (scripts/checkInfraBoundary.mjs).
  const { listAssets } = await import('@/lib/cloudinary');

  const index = await buildReferenceIndex();

  const assets = [];
  for (const resourceType of RESOURCE_TYPES) {
    let cursor;
    do {
      // eslint-disable-next-line no-await-in-loop -- cursor pagination is inherently sequential
      const { resources, nextCursor } = await listAssets({ resourceType, nextCursor: cursor });
      for (const r of resources) {
        assets.push({
          publicId: r.public_id,
          resourceType,
          format: r.format || null,
          folder: r.folder || folderOf(r.public_id),
          bytes: r.bytes ?? 0,
          createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
          url: r.secure_url || r.url || null,
        });
      }
      cursor = nextCursor;
    } while (cursor);
  }

  const items = assets.map((asset) => ({ ...asset, ...classify(asset, index, now) }));

  const sum = (predicate) => items.filter(predicate).reduce((n, a) => n + (a.bytes || 0), 0);
  const count = (status) => items.filter((a) => a.status === status).length;

  return {
    scannedAt: now,
    summary: {
      totalAssets: items.length,
      referenced: count(STATUS.REFERENCED),
      orphaned: count(STATUS.ORPHANED),
      unknown: count(STATUS.UNKNOWN),
      totalBytes: sum(() => true),
      recoverableBytes: sum((a) => a.status === STATUS.ORPHANED),
      unparseableReferences: index.unparseable.length,
      documentsScanned: index.scanned,
    },
    items,
  };
}

/**
 * Re-checks a specific set of public ids immediately before deletion.
 *
 * A scan is a snapshot. Between viewing it and confirming a delete an editor
 * may have attached one of those images to an article, so the decision is made
 * again against current data — the scan result is never trusted as
 * authorization on its own.
 */
export async function verifyDeletable(publicIds, { now = Date.now() } = {}) {
  const index = await buildReferenceIndex();
  const { listAssets } = await import('@/lib/cloudinary');

  // Age still has to be verified here; a caller could pass any id.
  const meta = new Map();
  for (const resourceType of RESOURCE_TYPES) {
    let cursor;
    do {
      // eslint-disable-next-line no-await-in-loop -- cursor pagination is inherently sequential
      const { resources, nextCursor } = await listAssets({ resourceType, nextCursor: cursor });
      for (const r of resources) {
        if (publicIds.includes(r.public_id)) {
          meta.set(r.public_id, {
            resourceType,
            bytes: r.bytes ?? 0,
            folder: r.folder || folderOf(r.public_id),
            createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
            url: r.secure_url || r.url || null,
          });
        }
      }
      cursor = nextCursor;
    } while (cursor);
  }

  return publicIds.map((publicId) => {
    const asset = meta.get(publicId);
    if (!asset) {
      return { publicId, deletable: false, reason: 'Not found in Cloudinary — it may already be deleted.' };
    }
    const verdict = classify({ ...asset, publicId }, index, now);
    return verdict.status === STATUS.ORPHANED
      ? { publicId, deletable: true, asset }
      : {
        publicId,
        deletable: false,
        asset,
        reason: verdict.status === STATUS.REFERENCED
          ? `Now referenced by ${verdict.references.map((r) => `${r.label} ${r.field}`).join(', ')}`
          : verdict.reason,
      };
  });
}
