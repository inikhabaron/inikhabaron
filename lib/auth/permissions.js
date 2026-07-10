export function checkRole(user, requiredRoles) {
  if (!user || !user.role) return false;
  const role = String(user.role).trim().toLowerCase();
  return requiredRoles.map((r) => String(r).trim().toLowerCase()).includes(role);
}

export function normalizeStatus(status) {
  if (!status || typeof status !== 'string') return '';
  const key = status.toLowerCase();
  if (['draft'].includes(key)) return 'draft';
  if (['pending_review', 'pendingreview', 'pending'].includes(key)) return 'pending_review';
  if (['needs_revision', 'needsrevision'].includes(key)) return 'needs_revision';
  if (['ready_to_publish', 'readytopublish'].includes(key)) return 'ready_to_publish';
  if (['published'].includes(key)) return 'published';
  if (['scheduled'].includes(key)) return 'scheduled';
  if (['rejected'].includes(key)) return 'rejected';
  return key;
}

export function canAccessAdminPanel(user) {
  return checkRole(user, ['admin', 'editor', 'reporter']);
}

export function canCreateArticle(user) {
  return checkRole(user, ['admin', 'editor', 'reporter']);
}

export function canEditArticle(user, article) {
  if (checkRole(user, ['admin'])) return true;
  if (checkRole(user, ['editor'])) return true;
  if (checkRole(user, ['reporter']) && article.authorId === user.id) {
    return ['draft', 'needs_revision'].includes(normalizeStatus(article.status));
  }
  return false;
}

export function canSubmitForReview(user, article) {
  return checkRole(user, ['reporter']) && article.authorId === user.id && normalizeStatus(article.status) === 'draft';
}

export function canReviewArticle(user) {
  return checkRole(user, ['admin', 'editor']);
}

export function canApproveArticle(user) {
  return checkRole(user, ['admin', 'editor']);
}

export function canPublishArticle(user) {
  return checkRole(user, ['admin']);
}

export function canMarkBreaking(user) {
  return checkRole(user, ['admin']);
}

export function canApproveBreaking(user) {
  return checkRole(user, ['admin']);
}

export function canSuggestBreaking(user) {
  return checkRole(user, ['admin', 'editor', 'reporter']);
}

export function canApproveTrending(user) {
  return checkRole(user, ['admin', 'editor']);
}

export function canPublishScheduled(user, userPermissions = {}) {
  if (checkRole(user, ['admin'])) return true;
  if (checkRole(user, ['editor']) && userPermissions.canPublishScheduled) return true;
  return false;
}

export function canPublishBreaking(user, userPermissions = {}) {
  if (checkRole(user, ['admin'])) return true;
  if (checkRole(user, ['editor']) && userPermissions.canPublishBreaking) return true;
  return false;
}

export function canModerateComments(user) {
  if (!user) { return false; }
  return ['admin', 'editor', 'reporter',].includes(user.role);
}