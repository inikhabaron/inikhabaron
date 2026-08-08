// CricAPI (cricapi.com / cricketdata.org) v1 — the single seam a different
// cricket data provider would replace later (see cricketService.js, which
// only ever imports the normalized shapes below, never raw CricAPI fields).
//
// Verified against live responses on 2026-08-01. Field mapping below
// (`data.teams`, `data.teamInfo`, `data.score[]`, `data.matchStarted`/
// `matchEnded`, `data.scorecard[].batting`/`bowling`) matches what CricAPI
// actually returns. Every field read still uses optional chaining and falls
// back to omitting that piece of data rather than throwing, so a future
// upstream change degrades a card/section instead of breaking the page.
//
// Two things live data proved that the docs don't say:
//   - `teams` can contain a single entry for a two-team fixture (seen on a
//     women's quadrangular tie), so nothing downstream may assume length 2.
//   - `extras`/`totals` are usually present but empty (`{}`) rather than
//     omitted — see normalizeNumericGroup.
import { CRICAPI_BASE_URL, classifyMatchState } from './cricketConstants';
import { classifyMatchTier } from '@/lib/cricket/matchPriority';

const FETCH_TIMEOUT_MS = 6_000;

export class CricApiNotConfiguredError extends Error {}

// Distinguished from a generic failure so the service/UI can show "showing
// the last update, live scores are temporarily unavailable" instead of a
// bare error — a quota hit is expected/recoverable, not a broken integration.
// CricAPI signals it as HTTP 200 with `status: "failure"` and a worded
// `reason`, so both that and a bare 429 are treated as the same case.
export class CricApiRateLimitError extends Error {}

// 'blocked' was added after observing the real string: CricAPI throttles
// with `reason: "Blocked for 15 minutes"`, which matches none of the
// originally guessed words and so fell through to the generic error path —
// the UI showed "Live data temporarily unavailable" (reads like a broken
// integration) instead of the reassuring, self-resolving rate-limit message,
// and `rateLimited` stayed false in every API response.
const RATE_LIMIT_REASON_HINTS = ['limit', 'quota', 'exceeded', 'suspend', 'blocked', 'too many'];

async function cricApiFetch(path, params = {}) {
  const apiKey = process.env.CRICAPI_KEY;
  if (!apiKey) throw new CricApiNotConfiguredError('CRICAPI_KEY is not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const query = new URLSearchParams({ apikey: apiKey, ...params });
    const res = await fetch(`${CRICAPI_BASE_URL}/${path}?${query.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });

    // A 429 may not carry a JSON body at all, so it's checked before the
    // response is parsed rather than folded into the payload.status check.
    if (res.status === 429) {
      throw new CricApiRateLimitError('CricAPI rate limit exceeded (429)');
    }
    if (!res.ok) throw new Error(`Upstream responded ${res.status}`);

    const payload = await res.json();
    if (payload.status !== 'success') {
      const reason = payload.reason || 'CricAPI request failed';
      if (RATE_LIMIT_REASON_HINTS.some((hint) => reason.toLowerCase().includes(hint))) {
        throw new CricApiRateLimitError(reason);
      }
      throw new Error(reason);
    }
    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
}

// `raw.score` is a flat array across all innings played so far, e.g.
// [{ inning: "India Inning 1", r, w, o }, ...] — attribute each entry to a
// team by name prefix (CricAPI's own convention) and keep the latest
// (highest-index) innings per team, since that's the one worth showing on a
// compact card. The full innings-by-innings breakdown is preserved
// separately for the match detail page.
const normalizeName = (value) => (value || '').toString().trim().toLowerCase();

// Matched on the full `"<team> Inning"` prefix rather than a bare
// startsWith(teamName): this feed carries women's and A sides, so a plain
// prefix test lets "India" swallow "India Women Inning 1" and show the
// wrong side's score on the card.
function latestInningsForTeam(scoreEntries, teamName) {
  if (!Array.isArray(scoreEntries) || !teamName) return null;
  const prefix = `${teamName} Inning`;
  const forTeam = scoreEntries.filter((entry) => typeof entry?.inning === 'string' && entry.inning.startsWith(prefix));
  return forTeam.length ? forTeam[forTeam.length - 1] : null;
}

// `raw.teams` has been observed carrying only one side of a two-team fixture
// (a women's quadrangular tie returned `["Hong Kong"]` while `status` read
// "Tanzania Women won by 7 wkts"), which rendered as a lopsided one-row card.
// The names are still in `raw.name`, which CricAPI formats as
// "<TeamA> vs <TeamB>, <match description>, <series>" — so the missing side
// is recovered from there.
//
// Team names may themselves contain commas ("Hong Kong, China Women"), so
// the split is on " vs " first and only the *second* half is trimmed at its
// first comma. Returns [] on anything that doesn't parse cleanly rather than
// guessing — a missing row is better than a wrong team name.
function teamNamesFromMatchName(name) {
  if (typeof name !== 'string') return [];
  const halves = name.split(' vs ');
  if (halves.length !== 2) return [];

  const home = halves[0].trim();
  const away = halves[1].split(',')[0].trim();
  return home && away ? [home, away] : [];
}

function normalizeTeams(raw) {
  const listed = Array.isArray(raw?.teams) ? raw.teams.filter(Boolean) : [];
  // Only used to *fill a gap*, never to override what the feed did send:
  // the parsed name is a weaker source than `teams`, so a listed side always
  // wins and parsing is skipped entirely once two sides are present.
  const names = listed.length >= 2
    ? listed
    : (() => {
      const parsed = teamNamesFromMatchName(raw?.name);
      if (!parsed.length) return listed;
      const merged = [...listed];
      for (const candidate of parsed) {
        const alreadyListed = merged.some((existing) => normalizeName(existing) === normalizeName(candidate)
          || normalizeName(candidate).startsWith(normalizeName(existing)));
        if (!alreadyListed) merged.push(candidate);
      }
      return merged.slice(0, 2);
    })();
  const infoByName = new Map((Array.isArray(raw?.teamInfo) ? raw.teamInfo : []).map((info) => [info?.name, info]));

  return names.map((name) => {
    const info = infoByName.get(name);
    const innings = latestInningsForTeam(raw?.score, name);
    return {
      name,
      shortName: info?.shortname || name,
      image: info?.img || null,
      score: innings
        ? { runs: innings.r ?? null, wickets: innings.w ?? null, overs: innings.o ?? null }
        : null,
    };
  });
}

function normalizeMatchSummary(raw) {
  const teams = normalizeTeams(raw);
  const summary = {
    id: raw?.id,
    name: raw?.name || null,
    matchType: raw?.matchType || null,
    status: raw?.status || null,
    matchState: classifyMatchState(raw),
    venue: raw?.venue || null,
    date: raw?.date || null,
    dateTimeGMT: raw?.dateTimeGMT || null,
    teams,
    tossWinner: raw?.tossWinner || null,
    tossChoice: raw?.tossChoice || null,
    // Only meaningful once matchEnded — used to highlight the winning row
    // on a completed match instead of making a reader parse `status` text.
    matchWinner: raw?.matchWinner || null,
    seriesId: raw?.series_id || null,
    updatedAt: Date.now(),
    available: true,
    stale: false,
  };
  // Computed once at normalization time so every downstream consumer
  // (priority sort, admin "preferred leagues" filter, homepage widget) reads
  // the same tier without re-deriving it from name/team-name text.
  summary.tier = classifyMatchTier(summary);
  return summary;
}

function normalizePlayerLine(entry, kind) {
  if (!entry) return null;
  if (kind === 'batting') {
    return {
      name: entry.batsman?.name || entry['batsman'] || entry.name || null,
      dismissal: entry['dismissal-text'] || entry.dismissal || null,
      runs: entry.r ?? null,
      balls: entry.b ?? null,
      fours: entry['4s'] ?? null,
      sixes: entry['6s'] ?? null,
      strikeRate: entry.sr ?? null,
    };
  }
  return {
    name: entry.bowler?.name || entry['bowler'] || entry.name || null,
    overs: entry.o ?? null,
    maidens: entry.m ?? null,
    runs: entry.r ?? null,
    wickets: entry.w ?? null,
    economy: entry.eco ?? entry.econ ?? null,
  };
}

// CricAPI returns `extras`/`totals` as objects that are frequently empty
// (`{}`) rather than omitted — observed on live responses. An empty object
// is truthy, so passing it through unchecked gives the UI something that
// looks like data and renders as a blank row. Normalize to null unless at
// least one field actually carries a number.
function normalizeNumericGroup(raw, keys) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  for (const [outKey, rawKey] of Object.entries(keys)) {
    const value = Number(raw[rawKey]);
    if (Number.isFinite(value)) out[outKey] = value;
  }
  return Object.keys(out).length ? out : null;
}

const EXTRAS_KEYS = { total: 'r', byes: 'b', legByes: 'lb', wides: 'w', noBalls: 'nb', penalty: 'p' };
const TOTALS_KEYS = { runs: 'R', overs: 'O', wickets: 'W' };

// `raw.scorecard` (when present) is an array of innings, each with its own
// batting/bowling line-ups, extras and totals — the full detail a match page
// needs beyond the summary score shown on a card.
function normalizeInnings(inn) {
  return {
    name: inn?.inning || null,
    batting: (Array.isArray(inn?.batting) ? inn.batting : []).map((e) => normalizePlayerLine(e, 'batting')).filter(Boolean),
    bowling: (Array.isArray(inn?.bowling) ? inn.bowling : []).map((e) => normalizePlayerLine(e, 'bowling')).filter(Boolean),
    extras: normalizeNumericGroup(inn?.extras, EXTRAS_KEYS),
    totals: normalizeNumericGroup(inn?.totals, TOTALS_KEYS),
  };
}

function normalizeMatchDetail(raw) {
  return {
    ...normalizeMatchSummary(raw),
    umpires: Array.isArray(raw?.umpires) ? raw.umpires : [],
    referee: raw?.referee || null,
    innings: Array.isArray(raw?.scorecard) ? raw.scorecard.map(normalizeInnings) : [],
  };
}

export async function fetchCurrentMatches() {
  const data = await cricApiFetch('currentMatches', { offset: 0 });
  return Array.isArray(data) ? data.map(normalizeMatchSummary) : [];
}

// `match_info`-only counterpart to fetchMatchDetail below — no scorecard,
// same summary fields fetchCurrentMatches already normalizes via
// normalizeMatchSummary. Used both as fetchMatchDetail's fallback and
// available standalone.
export async function fetchMatchInfo(id) {
  const data = await cricApiFetch('match_info', { id });
  return data ? normalizeMatchSummary(data) : null;
}

// `match_scorecard`, not `match_info`, as the primary source: verified
// against live responses, `match_info` never returns a `scorecard` field at
// all, so the match page's entire Scorecard section rendered empty no matter
// what the mapping did. `match_scorecard` returns every field `match_info`
// does that this module reads (id/name/matchType/status/venue/date/
// dateTimeGMT/teams/teamInfo/score/toss*/series_id/matchStarted/matchEnded)
// *plus* `scorecard`, so it is a strict superset here and costs the same
// single request.
//
// `umpires`/`referee` are returned by neither endpoint on this plan —
// normalizeMatchDetail keeps defaulting them to []/null rather than
// inventing a second call to chase them.
export async function fetchMatchDetail(id) {
  try {
    const data = await cricApiFetch('match_scorecard', { id });
    return data ? normalizeMatchDetail(data) : null;
  } catch (scorecardError) {
    if (scorecardError instanceof CricApiRateLimitError || scorecardError instanceof CricApiNotConfiguredError) {
      throw scorecardError;
    }

    // Observed live: `match_scorecard` returns `status: "failure",
    // reason: "ERR: Scorecard <id> not found"` both for a match that hasn't
    // started yet AND for one CricAPI's own match_info reports as already
    // finished with a full score — a scorecard CricAPI never indexed, not
    // something wrong on this end. Either way match_info is a separate,
    // cheaper endpoint that still has the summary (teams/score/status/toss),
    // so the detail page can degrade to that instead of going fully blank.
    let info;
    try {
      info = await fetchMatchInfo(id);
    } catch (infoError) {
      if (infoError instanceof CricApiRateLimitError) throw infoError;
      throw scorecardError;
    }
    if (!info) throw scorecardError;
    return { ...info, innings: [], umpires: [], referee: null };
  }
}
