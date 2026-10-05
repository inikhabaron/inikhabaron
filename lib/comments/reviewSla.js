/**
 * The moderation review window. Guest comments are published immediately and
 * reviewed afterwards; anything still unreviewed past this window is surfaced
 * in the admin UI as "Over 24h" so nothing sits unnoticed. Comments are never
 * auto-removed when it lapses.
 *
 * Plain module (no server imports) so the admin API's "overdue" query and the
 * admin table's badge can't disagree about what overdue means.
 */
export const REVIEW_SLA_HOURS = 24;

export const REVIEW_SLA_MS = REVIEW_SLA_HOURS * 60 * 60 * 1000;

/**
 * "Unreviewed" = no human has looked at it yet:
 *   - a comment still waiting for approval (status 'pending'), or
 *   - a guest comment that went live automatically and no editor has acted on
 *     (approve/mark-reviewed, reject, hide) since — `reviewedAt` is still null.
 *
 * The matching Mongo filter lives in commentModerationService.js
 * (UNREVIEWED_FILTER); keep the two in sync.
 */
export function isUnreviewed(comment) {
  if (comment.status === 'pending') return true;

  return (
    comment.source === 'guest' &&
    comment.status === 'approved' &&
    !comment.reviewedAt
  );
}

/**
 * How long a comment has been waiting. `label` is short ("3h ago"); `overdue`
 * is true once it has waited longer than the review window.
 */
export function getReviewAge(createdAt, now = Date.now()) {
  const created = new Date(createdAt).getTime();

  if (!Number.isFinite(created)) {
    return { ms: 0, label: '-', overdue: false };
  }

  const ms = Math.max(0, now - created);
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let label;
  if (minutes < 1) label = 'just now';
  else if (hours < 1) label = `${minutes}m ago`;
  else if (hours < 48) label = `${hours}h ago`;
  else label = `${days}d ago`;

  return { ms, label, overdue: ms > REVIEW_SLA_MS };
}
