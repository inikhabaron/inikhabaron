import { LOCATION_TYPES } from './constants.js';

/**
 * Converts a location name into a URL-friendly slug.
 *
 * Examples:
 * "New Delhi"        -> "new-delhi"
 * "Dadra & Nagar Haveli" -> "dadra-nagar-haveli"
 */
export function slugifyLocation(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generates a unique location ID.
 *
 * Examples:
 * state + delhi -> state-delhi
 * district + north-delhi -> district-north-delhi
 */
export function generateLocationId(type, slug) {
  return `${type}-${slug}`;
}

/**
 * Normalizes a location name for searching.
 *
 * Examples:
 * "New Delhi" -> "new delhi"
 * "Mumbai "   -> "mumbai"
 */
export function normalizeSearchName(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Returns an empty aliases array.
 * Included so aliases can easily become configurable later.
 */
export function createAliases() {
  return [];
}

/**
 * Creates a location document in the project's standard format.
 */
export function createLocation({
  name,
  nameHi = '',
  type,
  parentId = null,
  parentSlug = null,
  order = 0,
}) {
  const baseSlug = slugifyLocation(name);
  const slug =
    type === LOCATION_TYPES.DISTRICT && parentSlug
      ? `${parentSlug}-${baseSlug}`
      : baseSlug;

  return {
    id: generateLocationId(type, slug),

    name,
    nameHi,

    slug,

    searchName: normalizeSearchName(name),

    aliases: createAliases(),

    type,

    parentId,

    parentSlug,

    country: 'India',

    order,

    isActive: true,
  };
}