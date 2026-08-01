// Cloudinary delivery URL -> public_id, so stored URLs can be turned back
// into something the destroy API accepts.
//
// Pure string handling with no `cloudinary` import on purpose: this file is
// safe to pull into any module graph, including request routes that the infra
// boundary guard (scripts/checkInfraBoundary.mjs) protects from the SDK.
//
// Shape:
//   https://res.cloudinary.com/<cloud>/image/upload/[<transforms>/][v123/]<public_id>.<ext>

const CLOUDINARY_HOST = 'res.cloudinary.com';

// A transformation segment is a comma-joined list of `k_v` pairs (w_150,c_fill)
// or a single one (f_auto). A public-id folder never looks like that.
const TRANSFORM_SEGMENT = /^[a-z]{1,3}_[^/]*$/;
const VERSION_SEGMENT = /^v\d+$/;

/**
 * @returns {string|null} the public_id, or null if this isn't a Cloudinary
 * asset belonging to our configured cloud. Returning null for anything
 * unrecognised is deliberate — callers use this to decide what to delete, and
 * a wrong guess would destroy someone else's asset.
 */
export function publicIdFromCloudinaryUrl(url, cloudName = process.env.CLOUDINARY_CLOUD_NAME) {
  if (typeof url !== 'string' || !url) return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.hostname !== CLOUDINARY_HOST) return null;

  const segments = parsed.pathname.split('/').filter(Boolean);

  // Only ever touch assets in our own cloud.
  if (!cloudName || segments[0] !== cloudName) return null;

  const uploadIndex = segments.indexOf('upload');
  if (uploadIndex === -1) return null;

  let rest = segments.slice(uploadIndex + 1);

  // Drop leading transformation and version segments; whatever remains is the
  // public id, which may itself contain folder slashes ("authors/abc123").
  while (rest.length > 1 && (TRANSFORM_SEGMENT.test(rest[0]) || VERSION_SEGMENT.test(rest[0]))) {
    rest = rest.slice(1);
  }
  if (rest.length === 1 && VERSION_SEGMENT.test(rest[0])) return null;
  if (!rest.length) return null;

  const publicId = rest.join('/');
  // Strip the delivery extension, but only a real one — a trailing dot or a
  // dot inside a folder name must not truncate the id.
  return publicId.replace(/\.[a-z0-9]{2,5}$/i, '') || null;
}
