# Cricket Module Roadmap

**Phase 1 feature development is closed as of 2026-08-01.** The Live Cricket
Score Center's foundation (service layer, live/upcoming/completed matches,
match detail page, homepage widget, admin settings, News↔Cricket linking,
rate-limit handling, analytics, sectioned `/cricket` hub) is built. Do not
add Phase 1 functionality — only fix bugs surfaced by the validation below.
Phase 2 starts only after that validation is done and a real `CRICAPI_KEY`
has been exercised against production traffic.

This exists so "just one more feature" doesn't quietly reopen a phase that
was deliberately declared done — see `docs/backlog.md` for the
lower-level technical entries this roadmap's later phases draw from.

## Phase 1 validation checklist (not feature work)

### 1. Real CricAPI integration — highest priority

Once a valid `CRICAPI_KEY` exists, verify against live responses and fix any
field-mapping discrepancy found in `lib/services/cricket/cricApiProvider.js`:
live/upcoming/completed matches, IPL, international matches, toss, overs,
wickets, innings, match summaries, scorecards, refresh cadence, rate-limit
behavior, error handling.

### 2. Manual UI verification

Full browser pass once live data is flowing — desktop, mobile, tablet;
light and dark mode; homepage widget, `/cricket` hub, match detail page,
related-news/related-match widgets, status badges, loading/empty/error
states. Fix visual/responsive issues found.

### 3. Production configuration

`CRICAPI_KEY` and other env vars set, default Admin Cricket Settings
reviewed (`/admin/cricket-settings`), polling intervals, homepage widget
enabled, preferred competitions, API quota monitoring in place.

**Configuration done 2026-08-01.** What was set:

- Real key removed from `.env.example` (it had been pasted in there; caught
  before it was committed). `CRICAPI_FRESH_TTL_SECONDS` (1800) added — the
  server cache TTL, previously hardcoded at 45s.
- Settings doc defaults applied to the live DB via
  `npm run cricket:defaults`: module enabled, homepage widget enabled
  (compact), preferred tiers `ipl, india, icc, international` (domestic
  excluded), `refreshIntervalSeconds` **null → 1800**.

Quota monitoring is **deliberately not built yet.** A first pass added a
per-day counter that also *enforced* a budget (stop calling upstream once
spent, serve cached data). That was reverted: how the module should behave
at the quota ceiling — hard stop, warn only, degrade polling, admin
override — is a product decision, and it depends on which CricAPI plan is
chosen. Revisit after the two items below, as its own change.

Open, both needing an owner decision rather than code:

1. **Upstash Redis is configured but dead** — `UPSTASH_REDIS_REST_URL`
   points at a host that no longer resolves (`ENOTFOUND`). The cache
   degrades to per-process in-memory state, so on serverless the TTL is
   per-instance and upstream usage multiplies by the instance count. Every
   cricket request also pays a failed Redis round-trip (~338ms) plus the
   Upstash client's retries. Point the env vars at a live database.
2. **The free plan cannot support live polling.** 100 requests/day against
   a 60s live poll (~1440/day) is not a rounding error, and the 1800s
   default above is the compromise that fits the plan: scores can be up to
   30 minutes stale while a match is live. A paid plan is what makes the
   "Live" badge honest.

## Phase 2 — feature expansion

Only after Phase 1 validation closes out.

1. **Upcoming Fixtures** — Today/Tomorrow/This Week grouping, series
   schedules. *(Partially built: the `/cricket` hub already has an Upcoming
   Fixtures section — remaining work is the day-range sub-filtering.)*
2. **Recent Results** — Yesterday/Last 7 days, India results, IPL results.
   *(Same partial-build note as above — the hub's Recent Results section
   exists; day-range filtering doesn't yet.)*
3. **IPL expansion** — points table, NRR, team standings, fixtures. Blocked
   on confirming CricAPI actually exposes a points-table endpoint/shape;
   unconfirmed as of this roadmap.
4. **Tournament pages** — IPL, World Cup, Champions Trophy, Asia Cup, WTC.
5. **Search & filters** — live/upcoming/completed, tournament, team.
6. **Enhanced SEO** — SportsEvent schema, breadcrumbs, richer metadata.
   Match pages currently ship only a plain title/description.

## Phase 3 — engagement and personalization

- Push notifications, match-milestone notifications (wickets, centuries,
  close finishes).
- Share scorecards *(partially built: WhatsApp/X/Facebook/Copy Link already
  ship on the match detail page — this phase item is about richer share
  content, e.g. an image card).*
- Favourite teams, favourite competitions, personalized cricket feed.

## Phase 4 — advanced cricket experience

- Ball-by-ball commentary, wagon wheel, partnerships, win probability,
  player statistics, team profiles, fantasy integration.
- Replace client polling with SSE/WebSockets — see `docs/backlog.md` for
  the full technical rationale and the seam to build against
  (`lib/services/cricket/cricketService.js`).
