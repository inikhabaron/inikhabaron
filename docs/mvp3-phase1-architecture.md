# MVP 3 Phase 1 — Architecture Audit & Design

**Status: PHASE 1 COMPLETE (2026-09-09).** All four Phase 1 features
shipped and approved: Topic Follow, Article Feedback, Live Blogs (+ Live
Text Updates), Breaking News Manager. Device Sync was removed from the
backlog (round 2) as already implemented. See Task 5 for the final
sequence and each feature's "round N" record above for what actually
shipped vs. this doc's earlier draft. No Phase 2/3/4 feature (Polls,
Election Dashboards, Sports Scorecards, AI, Audio, WhatsApp/SMS,
Theme/Offline/etc.) should be touched without an explicit new request —
Phase 1 being complete is not itself authorization to start Phase 2.

## Approval adjustments (2026-09-09)

All four "Key findings" recommendations below were approved as-is: no
`breaking_alerts`, no `topic_follows`, Live Text Updates = Live Blogs
backend with two renderings, reuse the cricket module's adaptive-polling
pattern. Two corrections surfaced while creating the schema, and one item
newly proposed:

1. **`notification_jobs`'s actual type taxonomy** is `breaking | trending |
   published | newsletter` (confirmed by reading
   `articleNotificationQueue.js` and the `PRIORITY` map in
   `notificationJobService.js`), not the `newsletter | breaking_news |
   promotion | system` sketched in review — close in spirit, different in
   the field. A new alert type should follow the existing short-lowercase
   convention (recommend `type: 'alert'`) and get a `PRIORITY` entry
   (recommend `1`, tied with `breaking`, since a manually-composed alert is
   at least as urgent) when Breaking News Alerts is actually built — no
   schema change needed for this, `type` is a free string on an existing
   collection.

2. **Device Sync, redefined as "continue reading the same article across
   devices," is already built — not extended, built.** `reading_progress`
   is not a placeholder: `lib/services/readingProgress/
   readingProgressService.js` (save/get/delete progress, keyed by
   `userId`+`articleId` — inherently cross-device since it's user-keyed,
   not device-keyed), `hooks/useReadingProgress.js` (auto-saves on
   scroll/visibility-change/pagehide, auto-restores on reopen, already
   live in `NewsClient.js`), and it's correctly gated per this repo's own
   `docs/architecture/ADR-002-session-ready-gate.md` (listed in ADR-002's
   "Currently gated" section, so it's not experimental — it shipped
   through the same discipline as bookmarks/likes/follow). There's also
   already a `getContinueReading()` service function and a working `GET
   /api/users/continue-reading` endpoint. **The one gap**: nothing in the
   frontend calls that endpoint — there's no "Continue Reading" list
   surfaced anywhere (homepage, account page, etc.). So Device Sync under
   this definition needs **zero new schema, zero new backend routes** —
   only a small UI section consuming an endpoint that already works. This
   is worth flagging against the approved implementation order below,
   since "last, because uncertain" no longer applies — the uncertainty is
   resolved and the remaining work is small. Not reordering unilaterally;
   flagging for a call.

3. **`live_blog_views`** — not built. No confirmation that analytics are
   in scope for Phase 1, and Development Rule #6 ("new collections only
   when data growth requires separation") argues against building it
   speculatively. Revisit if/when analytics are confirmed as a real
   requirement.

## Decisions locked, round 2 (2026-09-09)

- **Device Sync removed from the Phase 1 backlog.** Confirmed as already
  implemented (backend); remaining work is an optional, low-priority
  "Continue Reading" UI, not scheduled as a Phase 1 build item. See the
  "Already Complete" note in Task 5.
- **`notification_jobs` taxonomy confirmed**: `breaking | trending |
  published | newsletter`, with `alert` to be added for Breaking News
  Alerts when that item is built. No parallel alert system.
- **Topic vs. Tag resolved: Topics = Tags**, confirmed by a focused
  follow-up audit (not just inferred) — see that section below. Blocking
  condition for starting Topic Follow implementation is now cleared.

## Decisions locked, round 3 (2026-09-09) — tag coverage finding + Option B

Topic Follow shipped with per-article follow buttons (a button next to any
article tag that exactly matches a real `tags` record). Before merge, a
coverage report was run against the live database to check how often that
condition actually holds:

```
Active Tags: 30
Published Articles: 1108
Articles With Matching Topic Tags: 52
Coverage: 4.7%
```

**This is a content-governance problem, not a normalization problem.** The
mismatch isn't variant spellings of the same words — it's two different
vocabularies. The tags catalog holds single generic words (`ai`, `sports`,
`technology`, `business`, `poltics`...); real article tags are specific
descriptive phrases (`Narendra Modi`, `Lamborghini`, `Maruti Suzuki`,
`IMD`...). At this coverage, the per-article button is correct but
invisible to nearly everyone — technically working, practically dead.

Two options were on the table: **Option A** — normalize article tags
during creation/editing (autocomplete against the catalog) — helps only
*future* articles and does nothing for the 1056 already-published articles
with no match; a real fix would also need an editorial-judgment backfill
(there's no clean mapping from "Narendra Modi" to a 30-word catalog).
**Option B** — make the tag catalog itself the primary entry point,
since every entry there is by definition a real, followable tag.

**Decided: Option B**, for MVP 3. Implemented:

1. **Trending Bar** (`components/home/TrendingBar.jsx`, rendered from
   `HomeClient.js` and `app/live/page.js`) — every real tag chip now links
   to `/topics/[slug]` and carries its own `size="sm"` `FollowButton`
   (`type="tag"`). The hardcoded fallback list (shown only when no real
   tags are loaded) keeps its old click-to-search behavior since it has no
   real tag/topic behind it.
2. **Topic feed pages** — new `/topics/[slug]` (`app/topics/[slug]/page.js`),
   mirroring `app/category/[slug]/page.js`'s server-rendered `SeoPageShell`
   pattern exactly (`lib/seo/data.js` gained `getTag`/`getArticlesByTag`,
   the latter using the same `$text` mechanism as the Trending Bar
   click-through, per the Topic vs. Tag decision below). One client
   island, `components/topics/TopicFollowButton.jsx`, carries the follow
   button and — since this SEO shell has no other `<AuthDialog>` on it —
   its own login prompt.
3. **Article-level follow buttons kept as-is** — still the bonus entry
   point for the 52 articles where a tag happens to match.

**Explicitly deferred, potential MVP 4 item — "Topic Taxonomy Cleanup":**
catalog governance, tag autocomplete/suggestions, editor validation,
historical backfill strategy, tag-usage analytics. Not Phase 1 work.

Coverage is now effectively 100% for the feature's primary entry point —
every tag shown in the Trending Bar or reachable via a topic page is a
real, followable tag by construction.

## Decisions locked, round 4 (2026-09-09) — Article Feedback shipped

Built to the approved minimal scope: a binary vote (👍 Helpful / 👎 Not
Helpful) with an optional comment box that only appears after voting, one
entry per user per article (upsert, not append — a later vote or comment
updates the same row), reusing `article_feedback` exactly as already
created — no `article_ratings`, no `article_votes`, no
`feedback_analytics`.

- **Backend**: `lib/services/feedback/feedbackService.js` —
  `submitFeedback` (upsert), `getFeedbackSummary` (admin list, aggregated
  per article via `$group`), `getFeedbackForArticle` (admin per-article
  detail). No new collection, no new indexes beyond what's already in
  `lib/db/articleFeedback.js`.
- **APIs**: `POST /api/news/[id]/feedback` (`response.js` + `requireUser`,
  matching Follow/Likes/Bookmarks), `GET /api/admin/feedback` and
  `GET /api/admin/feedback/[articleId]` (`cors.js` + `requireAdmin`,
  matching Tags).
- **Frontend**: `components/feedback/ArticleFeedback.jsx`, placed between
  `ArticleAuthorBio` and `CommentsSection` in `NewsClient.js`.
- **Admin**: new `FeedbackView` (table: Article/Helpful/Not
  Helpful/Feedback Count, paginated, no filtering beyond pagination — "no
  analytics dashboards yet" per scope) + `FeedbackDetailDialog` (read-only
  per-article comment list), wired as a new Sidebar tab following the Tags
  in-page-`renderView()` pattern, not a separate route.
- **Not built** (explicitly out of the approved scope, and also not
  requested): a `feedbackEnabled` per-article toggle speculated in this
  doc's original Task 2 draft never got an admin control and was dropped
  rather than half-built — feedback is on for every article. Revisit only
  if actually requested.
- **Tested**: full HTTP stack against a throwaway test user (vote, vote
  change, comment update — confirmed as one row, not a duplicate — invalid
  vote value rejected, unauthenticated rejected, nonexistent article
  rejected) plus both admin endpoints; the public widget's login-prompt
  path and the admin dashboard table + detail dialog verified live in the
  browser.

See `docs/cricket-roadmap.md` for the sibling doc this format is modeled on,
and `docs/backlog.md` for lower-level technical entries.

Phase 1 scope, as locked: Live Text Updates, Live Blogs, Breaking News
Alerts, Topic Follow, Feedback on Articles (user-facing); Live Blog
Manager, Breaking News Manager, Topic Management, Alert Management
(admin). Device Sync is out of the backlog per the decision above.

## Live Blogs — architecture audit & blueprint (round 5, 2026-09-09)

Per the same architecture-first process used for Topic Follow and Article
Feedback. **No implementation yet — audit and design only, pending
approval**, per Phase 1 item #3.

### 1. Breaking-news workflow (audit)

Confirmed directly from `app/api/admin/news/[id]/approve-breaking/route.js`:
on approval it `$set`s `isBreaking:true, breakingApproved:true,
breakingAt:new Date()`, pushes `{action:'breaking_approved', by, byName,
at, comment}` into `approvalHistory`, then calls
`queueBreakingNotification(article, user.id)` — only after the Mongo
write succeeds. This is the exact shape Live Blogs' "go live" action and
"post an update" action should follow: a direct `$set` + a history entry +
an editorial-layer notification call, never touching `delivery/` directly.

No dedicated "Breaking News Manager" admin surface exists — confirmed via
`components/admin/Sidebar.jsx`'s `NAV` array, which has no `breaking`
entry. Approval happens inline in the Posts list. Unchanged since the
first audit; still Phase 1 item #4/#6, not #3.

### 2. Current `/live` page (audit)

`app/live/page.js` is **not related to Live Blogs** and needs no
reconciliation — it's a homepage variant (its component is even still
named `HomePage`, apparently copy-pasted from `app/HomeClient.js`) built
around `LiveCard` (a "Live TV"/YouTube card, `components/home/LiveCard.jsx`)
plus the same `TrendingBar`/`BreakingTicker` as the homepage. No overlap,
no URL collision risk, no reusable live-blog-specific infrastructure
beyond `TrendingBar` (already extended for Topic Follow) and the general
page-shell conventions.

### 3. Notification infrastructure (audit, re-confirmed)

Unchanged from the first audit: `articleNotificationQueue.js` (editorial,
Firebase-free) → `notificationJobService.js` (the seam) → `delivery/`
(Firebase-dependent, cron-only). A "live blog went live" notification
should be a new `queueLiveBlogNotification(blog, adminId)` export
alongside `queueBreakingNotification`/`queueTrendingNotification`/
`queuePublishedNotification` in the same file — **open question, not
decided**: reuse `type:'published'` semantics (a live blog going live is
conceptually "new content to announce," same targeting shape as
`category_or_location`) or add a 6th taxonomy value (`live_blog`) with its
own `PRIORITY` entry. Recommend reusing `'published'` — simplest, no
taxonomy growth — but flagging for confirmation since the taxonomy has
already been corrected once this phase.

### 4. Polling mechanism (audit, re-confirmed directly)

`lib/cricket/matchStatus.js`: `REFRESH_LIVE_MS = 60_000`,
`REFRESH_IDLE_MS = 600_000`, `refreshIntervalForMatch(match)`. Consumed in
`app/cricket/[id]/MatchDetailClient.jsx`: `pollMs` state seeded from
`refreshIntervalForMatch(initialMatch)` (line 219), updated from each
poll's response (`if (data.refreshIntervalMs) setPollMs(...)`, line 235),
and `setInterval(fetchMatch, pollMs)` recreated whenever `pollMs` changes
(line 262, deps `[fetchMatch, pollMs]`). This is the exact mechanism to
replicate: `refreshIntervalForLiveBlog(status)` returning `REFRESH_LIVE_MS`
while `status:'live'` and `REFRESH_IDLE_MS` otherwise, with
`GET /api/live-blogs/[id]/updates` echoing `refreshIntervalMs` in its
response the same way the cricket match-detail API does.

### 5. Schema — confirmed, one refinement made

`lib/db/liveBlogs.js` and `lib/db/liveBlogUpdates.js` already exist from
the schema-creation step (Task 2 below). One refinement made just now:
`liveBlogUpdates`' index was `{blogId:1, publishedAt:-1}`; tightened to
`{blogId:1, status:1, publishedAt:-1}` to match the query the public feed
actually runs (`{blogId, status:'published'}` sorted newest-first) — the
same three-field compound shape as `comments`' `{articleId:1, status:1,
createdAt:-1}` (`lib/db/comments.js`), which this collection was already
modeled on. Document shapes unchanged from Task 2's blueprint below.

**Cascade delete, newly decided**: deleting a `live_blogs` document should
delete its `live_blog_updates` too (unlike categories, whose articles
stand alone and survive a category delete) — an update has no independent
meaning without its parent blog, so an orphaned update is only ever a bug
waiting to surface, never a valid state.

### 6. API blueprint (finalized, supersedes Task 3's draft below)

Public routes use `cors.js` — **confirmed, not hedged**, by directly
reading `app/api/news/route.js` and `app/api/tags/route.js`, both of which
use `json()`/`preflight` from `cors.js` for public reads. (Task 3 below
had flagged this as unconfirmed; it's now settled by evidence.)

```
GET  /api/live-blogs                        list — cors.js, public
     ?status=live|ended  ?page=  ?limit=
     → { blogs: [{id,title,slug,type,status,featuredImage,summary,updatedAt}],
         pagination }

GET  /api/live-blogs/[slug]                  detail — cors.js, public
     → { blog: {id,title,slug,type,status,featuredImage,summary,
                linkedArticleId,createdAt,updatedAt,endedAt} }  or 404

GET  /api/live-blogs/[id]/updates            feed — cors.js, public
     ?page=  ?limit=
     → { updates: [{id,content,media,publishedAt,authorId}],
         pagination, refreshIntervalMs }
     -- status:'published' only; a status:'draft' update is invisible here.
     -- No `since`-based incremental fetch in v1 (always returns latest
        page) — a reasonable later optimization, not built now.

POST   /api/admin/live-blogs                 create — cors.js + requireAdmin
PUT    /api/admin/live-blogs/[id]            update metadata / status
                                              transition (draft→live→ended)
                                              — cors.js + requireAdmin
                                              -- setting linkedArticleId
                                                 here also $sets isLive/
                                                 liveBlogId on that news
                                                 doc (unsetting them if
                                                 unlinked) — same
                                                 side-effect shape as
                                                 approve-breaking writing
                                                 to the article directly.
DELETE /api/admin/live-blogs/[id]            delete + cascade-delete its
                                              updates — cors.js + requireAdmin

POST   /api/admin/live-blogs/[id]/updates             post an update
       {content, media, status:'draft'|'published'}   ({draft} lets an
                                                        editor queue text
                                                        before it goes
                                                        live — see Task 2's
                                                        rationale below)
                                                        — cors.js + requireAdmin
PUT    /api/admin/live-blogs/[id]/updates/[updateId]  edit, or publish a
                                                       drafted update
                                                       — cors.js + requireAdmin
DELETE /api/admin/live-blogs/[id]/updates/[updateId]  delete an update
                                                       — cors.js + requireAdmin
```

### 7. Admin workflow (defined)

**Separate route, not an `app/admin/page.js` tab** — confirmed as the
right call now that both patterns have actually been built once each this
phase (Topic pages as a separate SEO route; Feedback as an in-page tab).
Live Blog Manager is meaty enough (live-editing a growing feed, not a
simple CRUD table) to warrant its own route, same reasoning as
`editorial-calendar`.

- `app/admin/live-blogs/page.js` — list view: table of existing blogs
  (title, type, status, updated), Create/Edit-metadata/Delete actions, and
  a "Manage Updates" action per row linking to the detail view. New
  Sidebar entry pointing here (a real route, like `calendar`'s Sidebar
  entry does), not a `renderView()` case.
- `app/admin/live-blogs/[id]/page.js` — detail/manage view: blog metadata
  (editable inline or via a dialog, matching `TagFormDialog`'s pattern),
  a composer for a new update (rich content + media, `status` toggle
  draft/published), and a reverse-chronological list of existing updates
  with per-update edit/publish/delete actions. A "Go Live" / "End" control
  drives the parent blog's own `status` transition (draft→live→ended),
  which is what triggers the (still-open, see §3) notification call on the
  draft→live transition specifically — never on every update.

### 8. Implementation — DONE (round 6, 2026-09-09)

Approved and built, Phase A → B → C → D as specified. All decisions from
approval locked in exactly as given:

- **Status enum locked**: `draft | live | completed | archived` — no
  `active`/`published`/`running`/`closed`. Every route validates against
  `LIVE_BLOG_STATUSES` in `lib/services/liveBlogs/liveBlogService.js`.
  (§5 above and the schema block below said `'ended'` — that was the
  pre-lock draft; `'completed'` is what shipped.)
- **Notification**: reuses `type:'published'`, no 6th taxonomy value — the
  open question in §3 is resolved. `queueLiveBlogPublishedNotification`
  fires exactly once, on a genuine non-live→live transition (checked by
  comparing the blog's status before and after the write, not on every
  edit to an already-live blog). `queueLiveBlogUpdateNotification` fires
  only for a *published* update on a `type:'breaking'` blog — general/
  sports/election updates never notify, matching "only blog publication
  and explicit breaking-news updates." Both added to
  `lib/services/notifications/articleNotificationQueue.js` alongside the
  existing three.
- **Polling**: `lib/liveBlogs/pollStatus.js`, `refreshIntervalForLiveBlog`
  — 30s breaking / 60s general & sports / 120s election, `null` (stop
  polling) once a blog is no longer `'live'`. Exact same seed-then-server-
  updates-it shape as `MatchDetailClient.jsx`, confirmed working in the
  browser (correct `refreshIntervalMs` returned per type, verified via
  curl for all three cadences).
- **Cascade delete**: `deleteLiveBlog` deletes the blog's `live_blog_updates`
  in the same call, verified live (2 updates → 0 after deleting the parent).
- **`linkedArticleId` side effect**: confirmed live — linking sets
  `isLive:true, liveBlogId` on the article only while the blog is
  `'live'`; unlinking (or ending the blog) clears `isLive` but the article
  can still carry a stale `liveBlogId` pointer intentionally (a finished
  event stays referenceable). Verified both directions via the API.
- **Admin routes**: `app/admin/live-blogs/` (list) and
  `app/admin/live-blogs/[id]/` (manage — status actions, update composer,
  update list with edit/publish/delete), both separate routes per the
  approved architecture, wired into `Sidebar.jsx` and
  `app/admin/page.js`'s `handleTabChange` the same way `editorial-calendar`
  is.
- **Public routes**: `GET /api/live-blogs`, `GET /api/live-blogs/[id]`
  (the folder is named `[id]` rather than `[slug]` only because Next.js
  requires every dynamic segment at one path level to share a param name,
  and the sibling `updates/` route is legitimately id-keyed — the value
  passed is still a slug, matching the public page's URLs), and
  `GET /api/live-blogs/[id]/updates`, which also echoes minimal blog
  metadata (`id,title,slug,status`) so the inline ticker — which only has
  `article.liveBlogId`, not a slug — can link to the full page without a
  second lookup.
- **Public page**: `/live-blogs/[slug]`, client-rendered with the full
  site chrome (`PublicPageLayout`, matching `/following`'s shape — not the
  bare `SeoPageShell` the `/topics` pages use, since a live blog is
  first-class actively-updating content a reader navigates to directly,
  not a pure SEO utility page). No SSR seeding in this pass — a possible
  later addition, not built now.
- **Live Text Updates**: `components/liveBlogs/LiveTextUpdatesTicker.jsx`,
  embedded in `NewsClient.js` next to `RelatedLiveMatchWidget`, gated on
  `article.isLive && article.liveBlogId` exactly as planned in §"Live Text
  Updates vs. Live Blogs" — same feed, same polling helper, no second
  mechanism.
- **Update content is plain text**, not HTML — a deliberate change from
  this doc's earlier speculative "HTML, same convention as news.content"
  (§5's schema block): quick live-ticker updates don't need a rich-text
  editor, and plain text sidesteps any HTML-sanitization concern entirely
  (rendered via `white-space: pre-wrap`, never `dangerouslySetInnerHTML`).
- **Tested**: full HTTP lifecycle via a throwaway admin-signed test session
  (create → draft 404s publicly → go live → notification queued and
  confirmed in `notification_jobs` → published update on a general blog
  queues nothing → draft update invisible in the public feed → breaking-
  type blog's published update queues a second notification → refresh
  intervals confirmed 30s/60s/120s by type → cascade delete → validation
  rejects a bogus type) plus a full browser pass (admin create → manage →
  post update → go live, all reflected correctly in the UI; public page
  renders the live badge, title, and update with no console errors). All
  test data and test notification jobs deleted afterward.

## Breaking News Alerts → Breaking News Manager (round 7, 2026-09-09) — Phase 1 complete

Audit confirmed the entire business workflow already existed: `news.
isBreaking/breakingApproved/breakingAt/breakingSuggested`, the
`canSuggestBreaking/canMarkBreaking/canApproveBreaking` permission tiers,
`POST .../breaking` (direct toggle) and `POST .../approve-breaking`
(approve a suggestion) — both already calling `queueBreakingNotification`
into the existing `notification_jobs`/delivery pipeline. **Decided:
Option A only** — a proper admin view over this existing data (no
standalone freeform alert composer). Confirmed as scoped: "mostly an
admin workflow/UI problem, not a backend problem."

**Built:**
- **One backend addition, no new endpoint**: a `breaking=suggested|active|all`
  query param on the existing `GET /api/admin/news`
  (`app/api/admin/news/route.js`) — reuses that route's pagination/sort/
  projection as-is.
- **`app/admin/breaking-news/` + `[breaking-news]` Sidebar entry** —
  separate route (not a tab), tabs for Suggested/Active/History, a
  "Currently Active Breaking News" banner, per-row Approve/Unmark actions
  calling the two existing routes directly, and a bulk "Approve Selected"
  that loops the existing single-item `approve-breaking` route (`Promise.
  all`, no new bulk endpoint — stays inside "no new APIs").
- **No schema, no new collections, no notification changes** — confirmed
  by testing: approving still queues `type: 'breaking'` (the existing
  type, unchanged) into `notification_jobs`, nothing new was added to the
  taxonomy.

**A real, pre-existing data inconsistency found and worked around (not
"fixed" — no schema/migration work, per scope) while testing against live
production data**: some already-active articles carry `isBreaking:true`
with `breakingApproved:false` simultaneously — an older/direct edit path
apparently sets `isBreaking` without always syncing `breakingApproved`.
The initial `suggested` filter (`breakingSuggested:true AND
breakingApproved:{$ne:true}`) matched one of these, putting an
already-live article back into the "needs approval" queue. Fixed by
keying `suggested` off `isBreaking:{$ne:true}` instead — "suggested"
means "not yet live," full stop, regardless of `breakingApproved`'s own
(apparently unreliable) value. Caught by testing against real data, not
synthetic test cases alone — worth remembering for any future work that
touches breaking fields.

**Tested**: full lifecycle against isolated draft test articles (never
touched real published content) — suggest → appears under `suggested` →
approve → moves to `active`, disappears from `suggested`, notification
job confirmed `type:'breaking'` → unmark → disappears from `active`, still
surfaced under `history` via the `approvalHistory` fallback → concurrent
bulk-approve of two articles confirmed both landed correctly. Full browser
pass against the real, live "Currently Active Breaking News (10)" banner
(genuine production data, not seeded) confirmed the fix above, and
Approve/tab-switching worked correctly end to end. All test articles and
test notification jobs deleted afterward.

**Phase 1 is now complete**: Topic Follow, Article Feedback, Live Blogs
(+ Live Text Updates), and Breaking News Manager all shipped and approved.
Device Sync was removed from the backlog (round 2) as already
implemented. See Task 5 below for the final status table.

## Key findings before the schema — read this first

The brief's Task 2 draft schema assumes six new collections
(`live_blogs`, `live_blog_updates`, `topic_follows`, `article_feedback`,
`device_sessions`, `breaking_alerts`). The audit below found that three of
Phase 1's six user features already have most of their backend built, just
not exposed as their own admin surface or wired to a new entity. Building
new collections for them would duplicate working infrastructure and split
one concept across two storage locations. The recommendation is **3 new
collections, not 6**:

1. **Breaking News Alerts does not need `breaking_alerts`.** This app
   already has a complete two-layer notification pipeline — editorial queue
   (`lib/services/notifications/articleNotificationQueue.js`) writing to a
   `notification_jobs` collection, and a separate Firebase-dependent
   delivery layer reachable only from the cron worker
   (`app/api/cron/notifications/route.js`). `notification_jobs`' existing
   fields (`type, title, body, targeting, createdBy, status, attempts,
   nextAttemptAt`) are a superset of the brief's proposed `breaking_alerts`
   shape. Building a parallel collection means reimplementing retry/backoff,
   targeting-by-location-or-category, and the Firebase-isolation guarantee
   that CLAUDE.md documents as load-bearing (a real incident: Firebase
   became a module-load dependency of publishing and took editorial routes
   down). The correct Phase 1 work here is one new job type, not a new
   collection.

2. **Topic Follow does not need `topic_follows`.** The Follow module
   (`lib/services/follow/followService.js`) already implements exactly this
   shape — `followedCategories`/`followedAuthors`/`followedCities` arrays
   directly on the `users` document, with `$addToSet`/`$pull`, a shared
   `FollowButton` component, and a `getFollowing()` enrichment join. Adding
   a fourth type (`followedTags`, see the Topic-vs-Tag question below) is a
   ~10-line change to an existing, tested map (`FOLLOW_TYPE_FIELDS`) rather
   than a new collection, new indexes, new API routes, and a new UI
   component family.

3. **Breaking News Manager is largely a missing admin *view*, not missing
   backend.** `isBreaking`/`breakingSuggested`/`breakingApproved`/
   `breakingAt` already exist on `news` documents, with dedicated approval
   routes and a `queueBreakingNotification` call already wired into
   publishing. There is currently no dedicated "Breaking News Manager"
   admin section (Sidebar has no such entry) — breaking approval today
   presumably happens inline in the Posts list. Phase 1 work here is a
   focused admin list view over already-existing data, not new schema.

What *is* genuinely new: **Live Blogs** (a new top-level content type, no
existing analog) and **Article Feedback** (rating/text tied to an article —
close to Likes' shape but not identical). **Device Sync** turned out to
need nothing new at all once redefined against `reading_progress` — see
its section below.

One more scope note: the brief's `news` schema extension list includes
`pollId`, `audioVersion`, `aiSummary` — these belong to Phase 2 (Polls) and
Phase 3 (Audio/AI) per the brief's own phase breakdown. Recommend deferring
those field additions until those phases start, so Phase 1 doesn't quietly
smuggle in Phase 2/3 schema under the "extend `news`" umbrella.

---

## Task 1 — Architecture Audit

### Auth (reusable as-is, two systems, one JWT primitive)

Both the public site and the admin panel sign/verify with the same
`signSession`/`verifySession` (`lib/session/jwt.js`, HMAC, 7-day expiry,
claims `{id, firebaseUid, role}`) — they differ only in transport:

- **Public/user-facing**: `requireUser()` (`lib/auth/user/requireUser.js`)
  reads the httpOnly `khabaron_session` cookie (falls back to `Authorization:
  Bearer`), looks up `users` by `id`, rejects if `!isActive`. Returns
  `{success, user}` or a pre-built 401. **All new Phase 1 user-facing
  routes (Topic Follow, Article Feedback, Device Sync) should use this**,
  matching Follow/Bookmarks/Likes/Autosave.
- **Admin panel**: `requireAdmin(request, roles)` (`lib/auth/admin/guard.js`)
  reads `Authorization: Bearer` or `x-admin-token`, same JWT, plus a
  `checkRole()` check. Default roles `['admin','editor','reporter']`.
  **All new Phase 1 admin routes (Live Blog Manager, Breaking News Manager,
  Topic Management, Alert Management) should use this**, matching Tags/
  Promotions/News.

No route mixes the two guards. No changes needed to auth for Phase 1.

### API response convention — codebase has drifted from CLAUDE.md's stated rule

CLAUDE.md says `response.js` (`success`/`failure`) is for toggle-style
per-entity features and `cors.js` (`json`/`preflight`) is for
`app/api/users/*` routes needing CORS. In practice, **38 admin route files
use `cors.js` vs. 12 using `response.js`** — `cors.js` has become the de
facto admin-CRUD standard (Tags, Promotions, Categories, News, Notification
Jobs all use it), regardless of path. Recommendation for Phase 1, to match
what's actually dominant rather than what's stated:

- **Admin CRUD routes** (Live Blog Manager, Breaking News Manager, Topic
  Management, Alert Management backends) → `cors.js` + `requireAdmin`,
  matching the Tags template exactly (see Task 3).
- **User-facing toggle/interaction routes** (Topic Follow, Article
  Feedback) → `response.js` + `requireUser`, matching Follow/Bookmarks/
  Likes/Autosave — this is the newer, cleaner precedent and CLAUDE.md's
  explicit rule for this category.
- **Public read routes** (live blog list/detail/updates) → no strong
  existing precedent was found for public content-listing endpoints
  specifically; recommend `response.js` for consistency with the modern
  convention, but this is a call worth the team confirming rather than
  something the audit could verify from `/api/news` directly.

### Storage pattern — which of the two established patterns fits each feature

Per CLAUDE.md's existing "two storage patterns" rule:

| Feature | Pattern | Why |
|---|---|---|
| Topic Follow | Array on `users` (extend Follow module) | Small, always read together per-user, matches 3 existing follow types exactly |
| Article Feedback | Dedicated collection, unique `{userId, articleId}` | Needs per-article aggregation (avg rating), matches Likes/Bookmarks exactly |
| Live Blogs | New top-level content collection (sibling to `news`, not a "per-user interaction") | Own admin CRUD, own detail page, own lifecycle — same shape as `news`/`categories` |
| Live Blog Updates | Dedicated collection keyed by `blogId`, append-only feed | Same shape as `comments` keyed by `articleId` |
| Breaking Alerts | Reuse `notification_jobs`, new `type` | See "Key findings" above |
| Device Sync | Neither — reuse `reading_progress` as-is | Already user-keyed, already cross-device, already built — see below |

### Admin panel — two coexisting patterns, pick per feature

`app/admin/page.js` is a single ~1400-line client component: most sections
are `renderView()` switch cases sharing one file (Tags, Promotions,
Categories, News, etc.), driven by a `Sidebar` `NAV` array. One exception:
`editorial-calendar` is a fully separate route
(`app/admin/editorial-calendar/page.js`), reached via `router.push` instead
of a switch case.

Recommendation: **Topic Management** is simple CRUD — follow the in-page
`renderView()` pattern, copying the Tags template exactly (see Task 3's
admin template trace). **Live Blog Manager** (live-editing a growing update
feed) and **Breaking News Manager** (a focused moderation/approval view)
are meaty enough, and `app/admin/page.js` is already large enough, that
they should be separate routes like `editorial-calendar`, not more cases
crammed into the same switch. **Alert Management** is small (compose +
send + list) and can be a tab within Breaking News Manager's page rather
than a fifth top-level admin surface, since both concern "get something in
front of readers right now."

### Live Text Updates vs. Live Blogs — recommend treating as one mechanism, two surfaces

The brief lists these as two separate user features, but there's no
existing precedent suggesting they need two different backends. Recommend:
**one `live_blog_updates` feed, two renderings** — a full `/live-blogs/
[slug]` page (the "Live Blog" surface) and an inline ticker embedded in a
normal article page when `article.isLive && article.liveBlogId` is set
(the "Live Text Updates" surface, reusing `NewsClient.js`'s existing
section-composition pattern — it already conditionally renders `FollowButton
type="city"` only when city data resolves, so a conditional live-ticker
section following the same `article.isLive` guard is a natural fit,
inserted near the existing `RelatedLiveMatchWidget` at
`NewsClient.js:535`). This avoids building and maintaining two parallel
feed mechanisms for what is the same underlying "timestamped updates
attached to a piece of content" concept.

### Polling — a working adaptive-interval precedent already exists, reuse it

No WebSocket/SSE exists anywhere in the codebase; every "live" surface uses
`setInterval` + `fetch`. The cricket match detail page
(`app/cricket/[id]/MatchDetailClient.jsx`) already implements exactly the
pattern Live Blogs needs: an adaptive polling interval
(`lib/cricket/matchStatus.js`'s `REFRESH_LIVE_MS = 60_000` /
`REFRESH_IDLE_MS = 600_000`, `refreshIntervalForMatch()`), seeded from the
initial payload and then updated live from each poll response
(`data.refreshIntervalMs`). Recommend adapting this directly for live blogs
— a `refreshIntervalForLiveBlog(status)` helper following the same shape,
so `GET /api/live-blogs/[id]/updates` returns its own next-poll interval
(fast while `status: 'live'`, slow/stopped once `status: 'ended'`). This is
a proven pattern in this codebase already, not a new technique.

### Topic vs. Tag — RESOLVED 2026-09-09: Topics = Tags

Focused follow-up audit confirmed this rather than just inferred it. The
product concept of "topic" **already exists** in this codebase, under the
name "tags" — not a naming coincidence, an existing built feature:
`HomeClient.js`, `app/live/page.js`, and `NewsClient.js` all fetch
`GET /api/tags` specifically to render a **"Trending" bar**
(`components/home/TrendingBar.jsx`), and clicking a tag chip
(`TrendingBar.jsx:25`) calls `GET /api/news?search=<tagName>`, which runs a
real `$text` query against the `news_text_search` index
(`app/api/news/route.js:41-46`) — a working topic-feed mechanism, already
wired end-to-end including click-through.

**It's currently broken, not absent.** All three consumers filter
`d.tags.filter(t => t.active && t.popular)`, but the real tag schema only
has `isActive` (not `active`) and has no `popular` field at all (confirmed
against `TagFormDialog.jsx` — no such input exists anywhere in the write
path). So the filter always evaluates false, `TrendingBar` always falls
back to its hardcoded static list (`['Elections','Inflation','Stock
Market','Weather','Fuel Prices']` / hindi equivalents), and the bar has
never shown real tag data.

**Decision: Topics = the existing `tags` collection.** `followedTags: []`
as the 4th Follow type, no new domain object. One implementation note this
changes vs. the earlier draft: since `news.tags` is free text with no
foreign-key relationship to `tags.id`/`tags.slug` (an editor can type
anything), the topic feed (`GET /api/topics/[slug]`) should reuse the same
`$text` search the Trending Bar's click-through already uses, not an exact
`tags: {$in:[...]}` match — an exact match would silently miss articles
whose tags were typed with different casing/spacing. This also makes
"click a trending tag" and "view a followed topic's feed" the same code
path rather than two. Fixing the `active`/`popular` bug (~3 lines, same
`fetchTags` code path) is a natural companion to building Topic Follow,
not a separate task — not done yet, implementation still pending sign-off.

### Device Sync — resolved: already built, redefined and confirmed 2026-09-09

Redefined as: "A logged-in user can continue reading the same article
across devices using the existing `reading_progress` infrastructure." Per
the Approval Adjustments section above, this is **already live** —
`readingProgressService.js` + `useReadingProgress.js` handle save/restore
of exact scroll position, keyed by `userId` so it's cross-device by
construction, already gated per ADR-002, already integrated into
`NewsClient.js`. `getContinueReading()` and `GET /api/users/continue-reading`
also already exist and work. The only remaining piece is a "Continue
Reading" UI list — no page currently calls that endpoint. No schema work
required for Device Sync under this definition.

### Risks / dependencies carried into Phase 1

- **Firebase isolation must not be violated.** Any new "send an alert"
  admin action must call into `articleNotificationQueue.js` (or a sibling
  editorial-layer function), never `delivery/` directly — CLAUDE.md
  documents a real incident where crossing this boundary took editorial
  routes down in production.
- **`categories` and `tags` predate the modern collection pattern** — both
  use raw `getCollection('categories'|'tags')` string literals directly,
  not `lib/db/<feature>.js` + `COLLECTIONS` + `getDbCollection`. If "Topic"
  = `tags` is confirmed, optionally migrate `tags` to the modern pattern as
  a low-risk drive-by (not required — existing code works).
- **No index exists on `isBreaking`/`isTrending` individually.** A
  Breaking News Manager list view querying "all currently-breaking
  articles" will want `{isBreaking:1, breakingAt:-1}` — cheap to add, easy
  to forget.
- **`FollowButton`'s `onChange` doesn't pass `item` by default**
  (`components/follow/FollowButton.jsx:77`) — pages relying on
  `applyFollowChange`'s fallback get `{id, exists:true}` with no display
  name. A Topic Follow UI needs to pass the matched tag object explicitly
  the way existing category-follow call sites do, or topic chips will show
  raw IDs.

---

## Task 2 — Database Design (Phase 1 only)

### New collections (3) — created

`lib/db/liveBlogs.js`, `lib/db/liveBlogUpdates.js`,
`lib/db/articleFeedback.js` and their `COLLECTIONS` entries exist. Indexes
are declared but only materialize lazily on first `getDbCollection()` call
per process (same as bookmarks/likes/comments) — nothing to run manually.

**`live_blogs`** — top-level content type, sibling to `news`.
```js
{
  id,               // uuid, app-level id (matches news/categories convention)
  title,
  slug,
  type,             // 'election' | 'sports' | 'breaking' | 'general'
  status,           // 'draft' | 'live' | 'completed' | 'archived' — locked
                     // 2026-09-09, see round 6 below; no synonyms
  featuredImage,
  summary,          // short description for list/card views
  linkedArticleId,  // optional — the news.id this blog is attached to, if any
  createdBy,        // userId
  createdAt,
  updatedAt,
  endedAt,          // null while live
}
```
Indexes: unique `id`; unique `slug`; `{status, updatedAt: -1}` (list view,
newest-active-first); `{type, status}`.

**`live_blog_updates`** — append-only feed, keyed by parent blog.
```js
{
  id,
  blogId,           // live_blogs.id
  content,          // HTML, same rendering convention as news.content
  media,            // array, same shape as news.images
  status,           // 'draft' | 'published' — recommend adding vs. brief's
                     // draft schema, so editors can prep an update before
                     // it goes live (comments/news both have this kind of
                     // gate; a raw-typo update going instantly live to a
                     // breaking-election feed is the failure mode to avoid)
  publishedAt,
  authorId,
  createdAt,
  updatedAt,
}
```
Indexes: unique `id`; `{blogId: 1, publishedAt: -1}` (chronological feed
read — mirrors `comments`' `{articleId:1, status:1}` + `{createdAt:-1}`
shape exactly).

**`article_feedback`** — pattern 1 (dedicated collection + unique
compound index), matching Likes/Bookmarks. **Shipped shape** (2026-09-09,
round 4) — a binary vote, not the 1-5 rating originally speculated here:
```js
{
  userId,
  articleId,
  vote,             // 'helpful' | 'not_helpful'
  comment,          // optional free text
  createdAt,
  updatedAt,
}
```
Indexes: unique `{userId: 1, articleId: 1}`; `{articleId: 1}` (for the
admin aggregate view — helpful/not-helpful/total per article).

### Schema extensions

**`users`** (all via existing dot-path `$set`/`$addToSet` conventions,
no migration needed — every field below is additive with a safe default):
```js
preferences: {
  theme: "system",            // NEW — "light" | "dark" | "system"
  notifications: true,        // existing, unchanged
}
followedTags: [ "stock-market", "cricket" ]   // NEW — 4th Follow type,
                                                // Topics = Tags, resolved
                                                // above
```
No Device Sync fields needed — `reading_progress` already covers the
approved definition (see above).

**`news`**:
```js
isLive: false,          // NEW
liveBlogId: null,       // NEW — live_blogs.id when isLive is true
```
`feedbackEnabled` (originally speculated here as a per-article on/off
toggle) was **not built** — Article Feedback's approved scope (round 4)
never asked for one, so it wasn't half-built without an admin control to
match. Feedback is on for every article. `pollId`, `audioVersion`,
`aiSummary` remain explicitly deferred to Phase 2/3 per the scope note
above.

### `lib/constants/collections.js` additions
```js
LIVE_BLOGS: 'live_blogs',
LIVE_BLOG_UPDATES: 'live_blog_updates',
ARTICLE_FEEDBACK: 'article_feedback',
```
`notification_jobs` and `reading_progress` already exist — no new entries
needed for Breaking Alerts or Device Sync.

---

## Task 3 — API Blueprint

### Live Blogs — superseded by "Live Blogs — architecture audit &
blueprint (round 5)" above, which has the finalized, evidence-confirmed
version. Left below for the historical draft only.

```
GET    /api/live-blogs                       list, public
GET    /api/live-blogs/[slug]                detail, public
GET    /api/live-blogs/[id]/updates          feed, public, returns next
                                              poll interval per the cricket
                                              precedent above
POST   /api/admin/live-blogs                 create — requireAdmin
PUT    /api/admin/live-blogs/[id]            update — requireAdmin
DELETE /api/admin/live-blogs/[id]            delete — requireAdmin
POST   /api/admin/live-blogs/[id]/updates    post an update — requireAdmin
PUT    /api/admin/live-blogs/[id]/updates/[updateId]   edit/publish a
                                              drafted update — requireAdmin
```

### Topic Follow (`response.js` + `requireUser`, extending the existing
Follow routes rather than new ones — see below)

The brief proposes dedicated `/api/topics/*` routes. Recommend instead
**extending the existing `/api/users/follow` and `/api/users/following`
routes** to accept `type: 'tag'` alongside the existing `category`/
`author`/`city`, since that's a ~10-line change to `followService.js`'s
`FOLLOW_TYPE_FIELDS` map and `isValidFollowType`, versus a parallel route
family with its own validation and its own `FollowButton`-equivalent. A
`GET /api/topics/[slug]` topic-feed endpoint (news filtered by tag) is
still genuinely new — no existing route filters `news` by `tags` today:
```
POST   /api/users/follow          { type: 'tag', id }   (extends existing)
DELETE /api/users/follow          { type: 'tag', id }   (extends existing)
GET    /api/users/following                              (extends existing,
                                                            already returns
                                                            all types)
GET    /api/topics/[slug]         topic feed — NEW, public
```

### Article Feedback — SHIPPED (`response.js` + `requireUser` for the
public route, `cors.js` + `requireAdmin` for admin, matching Likes/Tags)
```
POST   /api/news/[id]/feedback         upsert (one vote per user per
                                        article, matching the unique
                                        index — a second POST updates,
                                        doesn't duplicate)
GET    /api/admin/feedback             admin list — one row per article,
                                        helpful/not-helpful/total counts
GET    /api/admin/feedback/[articleId] admin detail — individual entries
                                        (with comments) for one article
```

### Breaking Alerts (`cors.js` + `requireAdmin`, reusing
`notification_jobs` — no new collection, see Key Findings)
```
POST   /api/admin/alerts          → calls a new
                                     queueManualAlertNotification({title,
                                     body, targeting}, adminId) in
                                     articleNotificationQueue.js, which
                                     calls the existing createJob() with
                                     type: 'alert' (see the
                                     corrected type taxonomy above — also
                                     add a PRIORITY['alert'] = 1 entry in
                                     notificationJobService.js)
GET    /api/admin/alerts          → thin wrapper over the existing
                                     listJobs({status}) from
                                     notificationJobService.js, filtered to
                                     type: 'alert'
DELETE /api/admin/alerts/[id]     → existing cancelJob(id), already built
```

### Device Sync — resolved, one small addition
```
GET /api/users/continue-reading    already exists, already works
```
Only new work: a frontend section that calls it. No new route. (Note for
whenever this is picked up: the brief's originally-proposed `POST
/api/users/sync` name would have collided with the existing
`app/api/users/sync/route.js`, which is unrelated — the Firebase-signup
upsert. Moot now since no new route is needed.)

---

## Task 4 — Dependency Map

| Feature | Collections | New APIs | Existing APIs extended | Frontend | Admin | Auth | Notifications |
|---|---|---|---|---|---|---|---|
| Live Blogs | `live_blogs`, `live_blog_updates` | 8 (list/detail/feed + 5 admin) | — | new `/live-blogs/[slug]` page; new section in `NewsClient.js` for the inline ticker | new separate route, `app/admin/live-blogs/page.js` | `requireAdmin` for writes, public reads | optional: queue a `queuePublishedNotification`-style job when a blog goes live |
| Live Text Updates | (same as Live Blogs — see "recommend treating as one mechanism") | — | `GET /api/live-blogs/[id]/updates` | conditional section in `NewsClient.js` near `RelatedLiveMatchWidget` (line 535), gated on `article.isLive` | (same as Live Blogs) | public read | — |
| Breaking News Alerts | `notification_jobs` (existing) | 1 new (`POST /api/admin/alerts`) + 1 wrapper (`GET`) + reuse `cancelJob` | — | none (alerts are push, not a page) | new tab within Breaking News Manager | `requireAdmin` | direct use of existing delivery pipeline |
| Topic Follow | `users.followedTags` (extends existing arrays) | 1 new (`GET /api/topics/[slug]`) | `/api/users/follow`, `/api/users/following` (add `type:'tag'`) | new `FollowButton type="tag"` usage wherever tags are shown (article tag chips, a topic page); topic feed page at `/topics/[slug]` | Topic Management = existing Tags admin section (Topics = Tags, resolved) | `requireUser` | — |
| Feedback on Articles — DONE | `article_feedback` | 3 (`POST .../feedback`, `GET /api/admin/feedback`, `GET /api/admin/feedback/[articleId]`) | — | `ArticleFeedback.jsx` in `NewsClient.js`, unconditional (no `feedbackEnabled` toggle — not built, see Task 2) | `FeedbackView` + `FeedbackDetailDialog`, new Sidebar tab | `requireUser` for submit, `requireAdmin` for both admin routes | — |
| Device Sync — **removed from backlog, already implemented** | none new (`reading_progress`, existing) | none new | `GET /api/users/continue-reading` (exists, unused by frontend) | optional low-priority "Continue Reading" UI section | none | `requireUser` (existing) | — |

Admin features map 1:1 onto their user feature rows above except **Topic
Management**, which requires zero new admin work — the existing Tags
section already provides it (Topics = Tags, resolved above).

---

## Task 5 — Implementation Plan (approved order, 2026-09-09)

```
1. Topic Follow — DONE (2026-09-09), including the Option B tag-coverage
   fix (round 3 above). Approved as feature-complete.
2. Article Feedback — DONE (2026-09-09). See "round 4" below.
3. Live Blogs (folds in Live Text Updates — same backend, two renderings)
   — DONE (2026-09-09). See "Live Blogs — architecture audit & blueprint
   (round 5)" and its "round 6" implementation record above.
4. Breaking News Alerts (became "Breaking News Manager" per the audit —
   Option A only, no freeform alert composer) — DONE (2026-09-09). See
   "Breaking News Alerts → Breaking News Manager (round 7)" above.

PHASE 1 COMPLETE.
```

**Device Sync is not in the Phase 1 backlog** — removed per the 2026-09-09
decision. Status: already implemented (backend), remaining work is an
optional low-priority "Continue Reading" UI, not scheduled.

Breaking News Manager (admin) is a separate line from Breaking News Alerts
above — it's a UI view over already-existing `isBreaking`/
`breakingSuggested`/`breakingApproved` data, not new backend, and can slot
in any time after #4 without blocking anything else.

Each step ships with its own indexes and its own admin surface before the
next starts, per the existing "no UI rewrites, extend existing pages" rule
— none of this requires touching `app/admin/page.js`'s existing switch
cases except adding new Sidebar entries and (for Live Blogs/Breaking News
Manager) new top-level routes alongside it, per the admin-architecture
recommendation above.
