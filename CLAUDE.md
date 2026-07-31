# CLAUDE.md

Architecture and conventions for KhabarON (news-application-trial), captured while building the Follow module. Read this before adding a new per-user feature (bookmarks/likes/follow-style) — it documents the two established patterns and when to use each.

## Tech stack

- **Next.js 14 App Router** (`app/`), client components (`'use client'`) throughout for interactive pages — most pages fetch their own data client-side rather than using server components/loaders.
- **MongoDB via the native driver** (`mongodb` package) — no Mongoose, no schema files. Document shapes are inferred from where they're written, not declared.
- **Firebase Auth** on the client (`lib/firebase.js`) for sign-in (Google/Apple), but the server never verifies Firebase tokens per-request. Instead, `POST /api/auth/session` exchanges a Firebase ID token for a custom **httpOnly JWT session cookie** (`khabaron_session`), which every authenticated API route reads via `requireUser()`.
- Styling is a mix of Tailwind (shadcn/ui components under `components/ui/`) and hand-rolled inline styles / CSS Modules for the news-reading UI (`app/home.css`, `*.module.css`). Dark mode is **not** Tailwind's `dark:` class strategy — it's a plain `dark` boolean threaded through props and used in inline `style={{ color: dark ? ... : ... }}` expressions on every page. `.dark` CSS-variable blocks exist in `app/globals.css` but are only consumed by shadcn components, not the hand-rolled UI.

## Directory conventions

- `app/api/<resource>/route.js` — route handlers. Nest by resource, e.g. `app/api/users/follow/route.js`, `app/api/news/[id]/bookmark/route.js`.
- `lib/services/<feature>/<feature>Service.js` — business logic, one file per feature (`bookmarks/bookmarkService.js`, `likes/likeService.js`, `follow/followService.js`, `location/*`). Named exports only, no default exports. Functions take plain primitives/ids, never the `Request` object — routes own request parsing.
- `lib/db/<feature>.js` — thin per-collection accessors for features that get their own dedicated collection (see "Two storage patterns" below), wrapping `getDbCollection()` (`lib/db/index.js`) which lazily creates indexes once per process.
- `components/<feature>/` — one folder per feature's UI (`components/bookmarks/`, `components/likes/`, `components/follow/`), each component paired with its own `*.module.css`.
- `lib/constants/collections.js` — the single source of truth for collection name strings (`COLLECTIONS.USERS`, `COLLECTIONS.BOOKMARKS`, etc.). Always reference this, never hardcode a collection name string in a route/service (one legacy exception: `app/api/users/sync/route.js` still uses the raw string `'users'`).

## Auth pattern

`requireUser()` (`lib/auth/user/requireUser.js`) is the standard guard for any authenticated route:

```js
const auth = await requireUser();
if (!auth.success) return auth.response; // pre-built 401 NextResponse
const user = auth.user; // full Mongo user document
```

It never throws. `getCurrentUser()` (`lib/session/session.js`) reads the `khabaron_session` cookie, verifies the JWT, then does `usersCollection.findOne({ id: payload.id })` — **user documents are keyed by an app-level `id` (uuid, from `uuid`'s `v4()`), never Mongo's `_id`.** Every route/service that touches a user document filters by `{ id: userId }`.

## API response format

Two response-helper conventions coexist — pick based on which part of the app you're extending:

- **`lib/api/response.js`** — `success(data, message, meta, status)` → `{ success, message, data }` and `failure(message, status, error)` → `{ success: false, message }`, paired with `logApiError(routeLabel, error)` (`lib/api/errors.js`) in catch blocks. Used by Bookmarks, Likes, and Follow — the per-article/per-entity "toggle" style features.
- **`lib/api/cors.js`** — `json(data, init)` / `preflight()`, which add CORS headers and export `OPTIONS = preflight`. Used by the broader `app/api/users/*` surface (`location`, `fcm-token`, `sync`).

New toggle-style features (follow/unfollow, like/unlike) should use the `success`/`failure` pair. New routes under `app/api/users/*` that need CORS (called from outside the app, e.g. a mobile client) should use `cors.js`.

## Two storage patterns for "per-user interaction" features

This is the most important thing to get right when adding a new one — there are two established patterns, not one:

1. **Dedicated collection with a unique compound index** (Bookmarks, Likes): one document per `{ userId, articleId }` in its own collection (`bookmarks`, `likes`), via `lib/db/<feature>.js` → `getDbCollection(COLLECTIONS.X, [{ keys: { userId: 1, articleId: 1 }, options: { unique: true } }, ...])`. The service does `findOne` → `insertOne`/`deleteOne` (not atomic array mutation). Use this when the interaction target is always an article and you may want to query "who liked/bookmarked article X" independently of any one user.
2. **Array field directly on the `users` document** (Location, Follow): `usersCollection.updateOne({ id: userId }, { $set: { location } })` or `{ $addToSet: { followedCategories: id } }` / `{ $pull: { ... } }`. No new collection, no index. Use this when the data is small, always read together for a single user (e.g. "give me everything this user follows" in one lookup), and doesn't need to be queried from the "other side" (you'd rarely ask "who follows category X" at scale with this shape). This is what the recommendation engine wants for Follow — one user lookup gets all three lists.

Follow deliberately uses pattern 2 even though Bookmarks/Likes (its closest sibling features) use pattern 1 — see `lib/services/follow/followService.js`. When adding a new per-user feature, choose based on the query pattern you actually need, not by copying whichever example is closest.

## Notification architecture: editorial and delivery are separate layers

**Publishing an article must never be able to fail because push notifications are broken.** This is enforced structurally, not by convention, and the boundary is load-bearing — do not collapse it for convenience.

The two layers:

- **Layer 1 — editorial.** `lib/services/notifications/articleNotificationQueue.js` (`queueBreakingNotification` / `queueTrendingNotification` / `queuePublishedNotification`). Persists a notification job and returns. Its entire dependency graph is `notificationJobService.js` → MongoDB. **No Firebase Admin, FCM, `jwks-rsa`, `jose`, push sender or dispatcher.**
- **Layer 2 — delivery.** `lib/services/notifications/delivery/` (`dispatchNotificationJob`, `pushSenderService`, `targetingService`). Initializes Firebase Admin, resolves recipients, sends, retries. **Reachable only from the cron worker** (`app/api/cron/notifications/route.js`). There is deliberately no "send this job now" export, so delivery cannot be pulled onto a request path by accident.

`lib/services/notifications/notificationJobService.js` is the seam. It is Firebase-free so both layers can import it.

Creating a notification job is part of publishing. **Sending it is not.** An editorial route therefore depends on exactly: auth → permissions → MongoDB → `articleNotificationQueue`. Target graph:

```
approve-breaking → auth, permissions, mongodb, notificationJobService
```

**Why it's built this way.** These previously shared one module graph: `approve-breaking` → `articleNotifications` → `dispatchNotificationJob` → `pushSenderService` → `firebase-admin`. That made Firebase a *module-load* dependency of publishing, so anything wrong in the push stack took the editorial route down before its own `try/catch` existed — the response was Next's HTML `/500`, uncatchable and unloggable by the app. It happened for real: `firebase-admin@14` → `jwks-rsa@4` → ESM-only `jose@6`, which threw `ERR_REQUIRE_ESM` under the deployed runtime's CommonJS loader. Four editorial actions (`approve-breaking`, `approve-trending`, `breaking`, `publish`) plus `POST /api/auth/session` and the cron itself all died, and the admin UI showed only "failed" with no reason. The regression arrived in `e1c8fd0` (20 Jul 2026), which grew `approve-breaking`'s module-load closure from 7 files to 20 by adding that import — publishing had no Firebase dependency at all before it.

The lesson generalizes past this one bug: an editorial operation is a *product* guarantee, push delivery is *infrastructure*, and infrastructure must not be in the critical path of the guarantee. When Firebase is completely unavailable the article still publishes, the breaking ticker still updates, the site still serves it, and the job simply stays `pending` for a later retry.

Two supporting details:

- **Retries live in the job, not the request.** `notificationJobService` carries `attempts` and `nextAttemptAt`; failures are rescheduled with exponential backoff (5m → 6h cap, `MAX_ATTEMPTS` 5) and only parked as `failed` after that. `claimNextPendingJob` matches `nextAttemptAt: { $not: { $gt: now } }` rather than `$lte`, so jobs written before the field existed (missing/null) stay claimable instead of being skipped forever.
- **Firebase Admin is loaded lazily even inside Layer 2** (`lib/auth/user/firebase-admin.js` uses `await import()` in async accessors). A broken SDK then fails inside the worker's `try/catch` and the job is retried, instead of crashing the cron route at module load and stopping retries permanently.

When adding a new editorial action that should notify: call the Layer 1 queue, never the dispatcher. If you find yourself importing anything from `delivery/` outside a cron route, that is the mistake.

## Worked example: the Follow module

- `lib/services/follow/followService.js` — `follow`/`unfollow` do a single `$addToSet`/`$pull` on `users.followedCategories|followedAuthors|followedCities`. `getFollowing(userId)` reads those three arrays and **enriches** them with a join against `categories` (by `slug`) and `users` (by `id`, for author name/avatar) so the API returns display-ready `{ id, name, ... }` objects, not raw ids — this exists so pages don't need N follow-up requests to show names/avatars for a followed list. Each entry carries `exists: true|false` instead of a hardcoded "Unknown author"/slug-as-name fallback — the service reports the raw fact (the followed category/author no longer exists), and leaves how to *display* a stale entry to whichever UI eventually renders a "Following" list.
- `app/api/users/follow/route.js` (POST/DELETE), `app/api/users/following/route.js` (GET) — thin, `requireUser()` → validate `{ type, id }` → call the service → `success`/`failure` (status codes always passed explicitly, e.g. `failure('Invalid follow type', 400)`, even where they match the helper's default — don't rely on the default silently).
- `components/follow/FollowButton.jsx` — reuses the exact `--bookmark-accent`/`--bookmark-muted`/`--bookmark-card`/`--bookmark-border` CSS variables (`app/globals.css`) and ripple/particle/spinner treatment from `components/bookmarks/BookmarkButton.jsx`, so it visually belongs to the same button family instead of introducing new tokens. It takes `following` (boolean) as a prop rather than fetching its own status — **each page fetches `GET /api/users/following` once and derives every button's state from that single result**, since self-fetching per button doesn't scale once a page has more than one. The button itself is deliberately generic — it renders state, calls the API, and reports back `onChange({ type, id, following })`; it holds no assumption about which page it's on or what other buttons exist.
- `lib/follow/applyFollowChange.js` — a pure helper, `applyFollowChange(state, { type, id, following, item })`, that a page's `onChange` handler feeds into to update its cached following state generically across all three types. `item` is whatever full display object the page already has on hand (e.g. the matching `categories` entry with its real `name`/`nameHi`/`color`, or a constructed `{ id, name }` when that's all that's available) — it's stored as-is rather than reconstructed from an id, so metadata like avatars or localized names survives the round trip. This is what makes multiple FollowButtons of different types on the same page (e.g. an author list, or a future combined "topics" page) stay in sync through one small handler instead of each page hand-rolling its own per-type array-splicing logic.
- **One dedicated `FollowButton` per entity, not a shared "Follow" control.** An article has three independent follow relationships (author, category, city) and earlier revisions tried both a single ambiguous button and a `Follow ▾` dropdown menu — both read as confusing/buggy because a bare "Follow"/"Following" label next to *one* article looks like it's making a claim about the whole page. The current approach: three separate `FollowButton`s, each visually anchored to the specific thing it follows, each with its own `following` boolean computed independently (`following.authors.some(a => a.id === article.authorId)`, etc.) — so there is never a shared boolean that could leak state between them. In `app/news/[id]/NewsClient.js`: Follow Author sits inline next to the byline in `.articleMeta` (`size="sm"`), Follow Category sits in `.shareRow` next to Bookmark/Like, and Follow City (only rendered when `article.location?.districtName || article.location?.stateName` resolves to something) sits in its own "📍 News from {city}" strip just above `CommentsSection`.
- Wired into: `app/news/[id]/NewsClient.js` (all three — author, category, city-if-present), `app/my-city/page.js` (`FollowButton` for the city, in the hero section), `app/page.js` (`FollowButton` for the category, in a banner shown when `selectedCategory !== 'all'`).
