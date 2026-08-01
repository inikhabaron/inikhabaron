// Lightweight, dependency-free bridge between the News and Cricket modules:
// "is this article cricket-related" and "does it mention these teams" are
// both plain keyword checks over fields the article already has (title,
// excerpt, category, tags) — no separate classification service or stored
// field on the article document.
const CRICKET_KEYWORDS = [
  'cricket', 'ipl', 'bcci', 'icc', 't20', 'odi', 'test match',
  'world cup', 'asia cup', 'world test championship', 'indian premier league', 'team india',
];

function normalize(value) {
  return (value || '').toString().toLowerCase();
}

function articleHaystack(article) {
  return normalize([
    article?.title,
    article?.excerpt,
    article?.category,
    ...(Array.isArray(article?.tags) ? article.tags : []),
  ].filter(Boolean).join(' '));
}

export function isCricketRelatedArticle(article) {
  if (!article) return false;
  const category = normalize(article.category);
  if (category.includes('cricket') || category.includes('sport')) return true;
  if (Array.isArray(article.tags) && article.tags.some((t) => normalize(t).includes('cricket'))) return true;

  const haystack = articleHaystack(article);
  return CRICKET_KEYWORDS.some((kw) => haystack.includes(kw));
}

// Team names arrive from CricAPI in English ("India", "Mumbai Indians") while
// this site's titles and excerpts are Hindi ("भारत", "मुंबई इंडियंस"), so a
// substring test against title/excerpt alone effectively never matched —
// verified against live data: three live matches including India vs Australia
// produced no match on an article tagged `India vs Pakistan`.
//
// Tags are the bridge. They're already editor-entered in Latin script
// ("India vs England", "IND vs ENG", "India Cricket") on every cricket
// article checked, so they're searched alongside the prose.
function teamHaystack(article) {
  return normalize([
    article?.title,
    article?.excerpt,
    ...(Array.isArray(article?.tags) ? article.tags : []),
  ].filter(Boolean).join(' '));
}

// CricAPI qualifies team names with squad suffixes ("India Women",
// "Australia A") that a headline or tag rarely repeats, so the bare country
// is tried as well — "India Women" still matches an article tagged "India".
// Deliberately not applied to franchise names, where the qualifier *is* the
// identity: stripping it would let "Mumbai Indians" match "Mumbai".
function teamNameVariants(name) {
  const normalized = normalize(name);
  const base = normalized.replace(/\s+(women|men|u-?19|u-?23|a|xi)$/i, '').trim();
  return base && base !== normalized ? [normalized, base] : [normalized];
}

// Whether the article names any of the given teams — used to decide if a
// specific live match is what this article is actually about, not just
// "cricket in general".
export function articleMentionsTeams(article, teamNames) {
  if (!article || !Array.isArray(teamNames) || !teamNames.length) return false;
  const haystack = teamHaystack(article);
  if (!haystack) return false;
  return teamNames.some((name) => name && teamNameVariants(name).some((variant) => variant && haystack.includes(variant)));
}

// A short, deliberately generic phrase list for the "related news" search on
// the match page — combined with the match's own team names so the query
// still returns something for a fixture with no dedicated coverage yet.
export const CRICKET_SEARCH_TERMS = 'cricket IPL BCCI';
