// THE single source of truth for "where can a Cloudinary URL live in this
// database". Both consumers read from here:
//
//   - lib/services/media/imageCleanupService.js  (targeted: is THIS url used?)
//   - lib/services/media/mediaScanService.js     (bulk: index every reference)
//
// Adding a new uploaded-media field anywhere in the app means adding one
// string to this file and nothing else. That matters because this list is
// safety-critical: a field that is missing here is a field the maintenance
// tool cannot see, so an asset that is genuinely in use looks orphaned and
// becomes eligible for permanent deletion.
//
// Pure string/object handling — no `cloudinary` import, so this file is safe
// in any module graph including request routes guarded by
// scripts/checkInfraBoundary.mjs.

import { COLLECTIONS } from '@/lib/constants/collections';

/**
 * Path syntax: dots for nesting, `[]` for arrays.
 *   'featuredImage'                  -> doc.featuredImage
 *   'images[]'                       -> each string in doc.images
 *   'images[].url'                   -> doc.images[i].url
 *   'versionHistory[].featuredImage' -> doc.versionHistory[i].featuredImage
 *
 * `urlPaths` hold full delivery URLs; `publicIdPaths` hold a bare public_id
 * that needs no parsing (reels store one alongside the URLs).
 *
 * Several paths below were found by walking the live database rather than by
 * reading code — versionHistory[].featuredImage, notification_jobs.imageUrl
 * and reading_history.newsFeaturedImage are real references that no spec
 * listed. Fields that are not currently populated anywhere are still declared:
 * absence in today's data is not absence in tomorrow's.
 */
export const REFERENCE_SOURCES = Object.freeze([
  {
    collection: COLLECTIONS.NEWS,
    label: 'News',
    titleField: 'title',
    urlPaths: [
      'featuredImage',
      'images[]',        // gallery stored as plain URL strings
      'images[].url',    // ...or as { url } objects
      'authors[].image', // per-article author photos
      'authorAvatar',    // legacy single-author snapshot
      // Article revisions keep their own featured image. Deleting these would
      // silently break version-history previews.
      'versionHistory[].featuredImage',
      'video.url',
      'eventPromotion.image',
      'affiliate.image',
    ],
  },
  {
    collection: COLLECTIONS.USERS,
    label: 'User',
    titleField: 'name',
    urlPaths: ['avatar'],
  },
  {
    collection: COLLECTIONS.SHORT_VIDEOS,
    label: 'Reel',
    titleField: 'title',
    // One reel asset is referenced by several URL forms — the raw upload plus
    // f_auto/q_auto delivery variants. All parse to the same public_id, which
    // is why the index is keyed by public_id rather than by URL.
    urlPaths: [
      'video.url',
      'video.playbackUrl',
      'video.playbackUrlLowBandwidth',
      'thumbnail',
      'thumbnail.small',
      'thumbnail.medium',
      'thumbnail.large',
      'thumbnailUrl',
    ],
    publicIdPaths: ['video.publicId'],
  },
  {
    collection: COLLECTIONS.PROMOTIONS,
    label: 'Promotion',
    titleField: 'title',
    urlPaths: ['bannerImage', 'image'],
  },
  {
    collection: COLLECTIONS.NOTIFICATION_JOBS,
    label: 'Notification',
    titleField: 'title',
    urlPaths: ['imageUrl'],
  },
  {
    collection: 'reading_history',
    label: 'Reading history',
    urlPaths: ['newsFeaturedImage'],
  },
]);

/**
 * Projection for a scan over this source.
 *
 * Projects the exact nested path (`versionHistory.featuredImage`) rather than
 * the top-level key. MongoDB applies these inside array elements, so this
 * pulls one URL string per revision instead of every revision's full article
 * body — the difference between a multi-second scan and a fast one on a
 * collection with long version histories.
 */
export function projectionForSource(source) {
  const raw = new Set(['id']);
  if (source.titleField) raw.add(source.titleField);
  for (const path of [...(source.urlPaths || []), ...(source.publicIdPaths || [])]) {
    raw.add(path.replace(/\[\]/g, ''));
  }

  // MongoDB rejects a projection that names both a parent and its child
  // ("Path collision at images.url"). This happens legitimately here: gallery
  // entries may be plain strings (`images[]`) or objects (`images[].url`), so
  // the registry declares both. Keep the shorter path — projecting `images`
  // returns the whole entry either way.
  const sorted = [...raw].sort((a, b) => a.length - b.length);
  const kept = [];
  for (const path of sorted) {
    if (!kept.some((k) => path === k || path.startsWith(`${k}.`))) kept.push(path);
  }

  return Object.fromEntries(kept.map((k) => [k, 1]));
}

function walk(value, tokens, prefix, out) {
  if (value == null) return;

  if (!tokens.length) {
    if (typeof value === 'string' && value.trim()) out.push({ value: value.trim(), location: prefix });
    return;
  }

  const [head, ...rest] = tokens;
  const isArray = head.endsWith('[]');
  const key = isArray ? head.slice(0, -2) : head;
  const next = value[key];
  if (next == null) return;

  const join = (seg) => (prefix ? `${prefix}.${seg}` : seg);

  if (isArray) {
    if (!Array.isArray(next)) return;
    next.forEach((item, i) => walk(item, rest, join(`${key}[${i}]`), out));
  } else {
    walk(next, rest, join(key), out);
  }
}

/**
 * Every string value a document holds at the given paths, each paired with the
 * concrete location it came from (e.g. `authors[0].image`) so the UI can tell
 * an admin exactly why an asset is considered in use.
 */
export function extractAtPaths(doc, paths) {
  const out = [];
  for (const path of paths || []) walk(doc, path.split('.'), '', out);
  return out;
}
