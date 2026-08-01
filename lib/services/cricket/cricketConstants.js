export const CRICAPI_BASE_URL = 'https://api.cricapi.com/v1';

export const MATCH_STATES = Object.freeze({
  LIVE: 'live',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
});

// A match is "live" once CricAPI marks it started and not yet ended. Anything
// that hasn't started is upcoming; anything ended is completed — there is no
// third bucket to infer, CricAPI's matchStarted/matchEnded booleans say it
// directly.
export function classifyMatchState(raw) {
  if (!raw?.matchStarted) return MATCH_STATES.UPCOMING;
  if (raw?.matchEnded) return MATCH_STATES.COMPLETED;
  return MATCH_STATES.LIVE;
}
