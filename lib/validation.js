const MAX_SEARCH_LENGTH = 200;
const MAX_SLUG_LENGTH = 50;
const MAX_EMAIL_LENGTH = 255;

export function sanitizeSearchQuery(query) {
  if (!query || typeof query !== 'string') return '';
  
  // Remove special regex characters that could cause ReDoS
  const sanitized = query
    .replace(/[.*+?^${}()|[\]\\]/g, '')
    .trim();
  
  return sanitized.substring(0, MAX_SEARCH_LENGTH);
}

export function sanitizeSlug(slug) {
  if (!slug || typeof slug !== 'string') return '';
  
  const sanitized = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return sanitized.substring(0, MAX_SLUG_LENGTH);
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length < MAX_EMAIL_LENGTH;
}

export function validateCategory(category) {
  if (!category || typeof category !== 'string') return false;
  
  const regex = /^[a-z0-9-]+$/;
  return regex.test(category) && category.length < 50;
}

export function validatePagination(page, limit) {
  const p = parseInt(page) || 1;
  const l = Math.min(parseInt(limit) || 20, 100);
  
  return {
    page: Math.max(p, 1),
    limit: Math.max(l, 1),
  };
}
