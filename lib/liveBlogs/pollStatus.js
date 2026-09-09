// Presentation-side polling for live blogs — same split as
// lib/cricket/matchStatus.js (server-side fetching stays in the service
// layer; this is "how fast should the client re-poll what it already
// has"). Locked 2026-09-09: type-based cadence while a blog is actually
// status:'live'; polling stops entirely once it's 'completed'/'archived'
// since nothing will ever change again — unlike cricket's idle fallback,
// there's no "check back later" case for a finished live blog.
const REFRESH_MS_BY_TYPE = {
  breaking: 30_000,
  general: 60_000,
  // Not explicitly specified in the locked polling table; treated the same
  // as 'general' (60s) — a sports live blog (e.g. a match) is the closest
  // fit to "General Live" among the four blog types.
  sports: 60_000,
  election: 120_000,
};

const DEFAULT_REFRESH_MS = REFRESH_MS_BY_TYPE.general;

/** Returns the poll interval in ms while live, or null once nothing will change again. */
export function refreshIntervalForLiveBlog(blog) {
  if (!blog || blog.status !== 'live') return null;
  return REFRESH_MS_BY_TYPE[blog.type] ?? DEFAULT_REFRESH_MS;
}
