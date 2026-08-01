// Editorial priority for an Indian news audience: IPL and India matches lead,
// then ICC events, then other international cricket, and domestic leagues
// (Ranji Trophy, Big Bash, county cricket, Zimbabwe domestic, ...) sink to
// the bottom rather than crowding out the matches readers actually came for.
//
// Classification is heuristic (name/team-name text matching) rather than a
// lookup against CricAPI's series metadata — `currentMatches` doesn't return
// a tournament-type field, and resolving one properly would mean an extra
// `series_info` call (and extra credits) per match. Getting a Ranji Trophy
// match misfiled as "international" is a low-cost mistake; it only affects
// display order, never whether a match is shown at all.
import { IPL_TEAMS, ICC_TOURNAMENT_KEYWORDS, INTERNATIONAL_TEAMS } from '@/lib/constants/cricketTeams';

export const CRICKET_TIER = Object.freeze({
  IPL: 'ipl',
  INDIA: 'india',
  ICC: 'icc',
  INTERNATIONAL: 'international',
  DOMESTIC: 'domestic',
});

const TIER_ORDER = [
  CRICKET_TIER.IPL,
  CRICKET_TIER.INDIA,
  CRICKET_TIER.ICC,
  CRICKET_TIER.INTERNATIONAL,
  CRICKET_TIER.DOMESTIC,
];

const TIER_RANK = Object.fromEntries(TIER_ORDER.map((tier, i) => [tier, i]));

// Sets built once from the lib/constants/cricketTeams.js lookups — that file
// is the one to edit for a franchise rename or a new league, not this one.
const IPL_TEAM_SET = new Set(IPL_TEAMS);
const INTERNATIONAL_TEAM_SET = new Set(INTERNATIONAL_TEAMS);

function normalize(value) {
  return (value || '').toString().trim().toLowerCase();
}

// Team names carry suffixes like "Women"/"U19"/"A" for age-group and
// second-string sides — strip them so "India Women" still resolves to the
// India tier and "Australia A" still resolves to the international tier.
function baseCountryName(teamName) {
  const name = normalize(teamName);
  return name.replace(/\s+(women|men|u-?19|u-?23|a|xi)$/i, '').trim();
}

export function classifyMatchTier(match) {
  const name = normalize(match?.name);
  const teamNames = (match?.teams || []).map((t) => t.name);
  const baseNames = teamNames.map(baseCountryName);

  if (name.includes('ipl') || name.includes('indian premier league') || baseNames.some((n) => IPL_TEAM_SET.has(n))) {
    return CRICKET_TIER.IPL;
  }
  if (baseNames.some((n) => n === 'india')) {
    return CRICKET_TIER.INDIA;
  }
  if (ICC_TOURNAMENT_KEYWORDS.some((kw) => name.includes(kw))) {
    return CRICKET_TIER.ICC;
  }
  if (baseNames.length > 0 && baseNames.every((n) => INTERNATIONAL_TEAM_SET.has(n))) {
    return CRICKET_TIER.INTERNATIONAL;
  }
  return CRICKET_TIER.DOMESTIC;
}

export function tierRank(tier) {
  return TIER_RANK[tier] ?? TIER_RANK[CRICKET_TIER.DOMESTIC];
}

// Stable sort by editorial tier — matches already in the same tier keep
// whatever order CricAPI returned them in.
export function sortMatchesByPriority(matches) {
  return [...matches]
    .map((match, index) => ({ match, index, rank: tierRank(match.tier) }))
    .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))
    .map((entry) => entry.match);
}

export const CRICKET_TIER_LIST = TIER_ORDER;
