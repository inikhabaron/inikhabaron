// Team/tournament lookups for lib/cricket/matchPriority.js's editorial tier
// classifier. Pulled out to its own file (mirrors collections.js being the
// single source of truth for collection names) so a franchise rename, a new
// IPL team, or a newly relevant ICC event is a one-line edit here instead of
// a change to the classification logic itself.

// All ten current-era IPL franchises — matched against team names so a live
// IPL match is recognized even when `match.name` itself doesn't say "IPL"
// (CricAPI sometimes just gives "Mumbai Indians vs Chennai Super Kings").
export const IPL_TEAMS = Object.freeze([
  'mumbai indians', 'chennai super kings', 'royal challengers bengaluru', 'royal challengers bangalore',
  'kolkata knight riders', 'delhi capitals', 'punjab kings', 'rajasthan royals',
  'sunrisers hyderabad', 'gujarat titans', 'lucknow super giants',
]);

// Substrings matched against the match name to recognize an ICC event.
export const ICC_TOURNAMENT_KEYWORDS = Object.freeze([
  'world cup', 'champions trophy', 'asia cup', 'world test championship', 'wtc final',
  't20 world cup', 'icc ',
]);

// Full-member + associate national sides. Used to tell "international" apart
// from "domestic" in matchPriority.js — anything not on this list (state/
// franchise/club names) falls through to the domestic tier by default.
export const INTERNATIONAL_TEAMS = Object.freeze([
  'india', 'australia', 'england', 'pakistan', 'south africa', 'new zealand',
  'sri lanka', 'bangladesh', 'afghanistan', 'west indies', 'zimbabwe',
  'ireland', 'scotland', 'netherlands', 'united arab emirates', 'uae',
  'united states of america', 'usa', 'nepal', 'namibia', 'oman',
  'papua new guinea', 'canada', 'hong kong', 'kenya', 'jersey', 'italy',
]);
