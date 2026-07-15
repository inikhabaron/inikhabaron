# Code Audit — INI KhabarON (Next.js 14 news platform)

Scope: architecture, functionality, and concrete bugs. Findings are grouped by
severity with file references so they can be actioned directly. Line-level
details reflect the code as read during this audit.

---

## 🔴 Critical (fix before anything else)

### C1. Admin authentication is trivially forgeable — full admin takeover
**Files:** `lib/auth/admin/token.js`, every route in `app/api/admin/**` (13 routes).

The admin "token" is just `base64("<userId>:<timestamp>")` and is "verified" by
base64-decoding it and looking the user up by id — **there is no signature, no
secret, no expiry check**:

```js
const decoded = Buffer.from(token, 'base64').toString().split(':');
const userId = decoded[0];
return await usersCollection.findOne({ id: userId });
```

Because the public API leaks author ids (`GET /api/news/:id` returns
`authorId: "admin-…"`), an attacker can read any article, take the admin's id,
compute `base64("admin-…:0")`, and use it as a valid admin token. That grants
create/publish/delete news, comment moderation, breaking-news control, etc. The
token is also accepted via a `?token=` **query parameter**, so it leaks into
logs, referrers and browser history.

**Fix:** Use the already-present signed JWT system (`lib/session/jwt.js`) for
admin auth too; stop trusting base64. Never accept auth tokens via query string.

### C2. Passwords stored and compared in plaintext
**File:** `app/api/admin/login/route.js`

```js
if (user.password !== password) { ... }
```

Admin/editor/reporter passwords are stored unhashed in MongoDB and compared with
`!==`. Any DB leak (and the DB URI was in a public repo — see the security
thread) exposes every credential. It's also timing-attackable.

**Fix:** Hash with `bcrypt`/`argon2` at creation; compare with the library's
constant-time verify. Force a password reset for existing accounts.

### C3. Paid subscriptions are granted with no payment verification (and no auth)
**File:** `app/api/subscriptions/route.js`

```js
const subscription = { userId: body.userId, plan: body.plan || 'free',
  status: 'active', features: getSubscriptionFeatures(body.plan) , ... };
await subscriptionsCollection.insertOne(subscription);
```

`POST /api/subscriptions` trusts `body.plan` and `body.userId` directly — no
Razorpay order/signature verification anywhere in the codebase (grep for
`createHmac`/`razorpay_signature` returns nothing), and no `requireUser()` gate.
Anyone can POST `{ userId, plan: "premium" }` and self-grant premium for any
account. The payments flow is effectively unenforced.

**Fix:** Verify the Razorpay payment signature server-side
(`crypto.createHmac('sha256', key_secret)…`) before activating; authenticate the
caller and derive `userId` from the session, not the body; verify webhooks with
`RAZORPAY_WEBHOOK_SECRET`.

---

## 🟠 High

### H1. MongoDB connection is not cached in production → connection exhaustion
**File:** `lib/mongodb.js`

Only the `development` branch caches the client on `global`. In production every
serverless invocation does `new MongoClient(...).connect()`:

```js
} else {
  client = new MongoClient(MONGO_URL);
  clientPromise = client.connect();   // new pool per lambda cold start
}
```

On Vercel this leaks connections and hits Atlas connection limits under load.

**Fix:** Use the `global._mongoClientPromise` cache in **all** environments (the
standard Next.js + Mongo pattern).

### H2. Write-on-every-read anti-patterns
**Files:** `app/api/news/route.js` → `autoPublishScheduledArticles()`;
`app/api/news/[id]/comments/route.js` → `autoApprovePendingComments()`.

Every public list request runs an `updateMany` over the collection; every
comments read runs an auto-approve write. This adds write load and lock
contention to hot read paths, and scheduled publishing silently depends on
someone hitting the endpoint (no traffic → scheduled posts never publish).

**Fix:** Move both to a **Vercel Cron** job (e.g. every minute). Keep reads pure.

### H3. No database indexes → full collection scans
**Files:** `lib/db/index.js` exists to create indexes but is barely used; no
index setup for `news.id`, `news.status/publishedAt`, `users.id/email/firebaseUid`,
`comments.articleId`.

Queries like `findOne({ id })`, `find({ status:'published' }).sort({publishedAt})`
and the comment lookups scan the whole collection. With 450+ articles it's fine;
it degrades badly as content grows.

**Fix:** Create indexes: `news`: `{id:1}` unique, `{status:1, publishedAt:-1}`,
`{category:1, publishedAt:-1}`; `users`: `{id:1}` unique, `{email:1}` unique,
`{firebaseUid:1}` unique; `comments`: `{articleId:1, status:1, createdAt:-1}`.

### H4. First-login user creation has a race + no uniqueness guarantee
**File:** `lib/auth/user/firebaseUser.js`

`findOne({firebaseUid})` → if missing `insertOne(...)`. Two concurrent first
requests (common on OAuth) can both insert, creating **duplicate users**. With
no unique index (H3) nothing prevents it.

**Fix:** `updateOne({firebaseUid}, {$setOnInsert:{…}, $set:{…}}, {upsert:true})`
plus a unique index on `firebaseUid`.

### H5. Two parallel, inconsistent auth systems
Admin routes use the weak base64 token (C1); user/mobile routes use proper signed
JWT (`lib/session/*`, `requireUser`). The secure system already exists — the
admin surface just doesn't use it. Consolidate on the JWT/session model.

---

## 🟡 Medium

- **M1. CORS wildcard on all API routes.** `lib/api/cors.js` sets
  `Access-Control-Allow-Origin: *` and allows `Authorization`/`X-Admin-Token`
  on every route, including mutations and admin. Restrict to your own origins.
- **M2. Internal error messages leaked to clients.** Nearly every route does
  `return json({ error: error.message }, {status:500})`, exposing stack/driver
  details. Return a generic message; log the detail server-side.
- **M3. No input validation.** `zod` is a dependency but request bodies are used
  raw (`body.title`, `body.plan`, `body.userId`, …). Add schema validation at
  each route boundary.
- **M4. Stored-HTML XSS surface.** Article `content` is stored as raw HTML and
  rendered via `dangerouslySetInnerHTML` (`NewsClient.js`, `ArticleModal.jsx`,
  `app/Comment`). A malicious content-creator (reporter role) can inject script.
  Sanitize on write/render (e.g. `isomorphic-dompurify`). *(User comments are
  rendered as text, so they are not affected — good.)*
- **M5. `params` handling is inconsistent.** 16 route files `await params`, 34
  destructure it synchronously. Harmless on Next 14, but a **Next 15 upgrade
  will break** the 34 synchronous ones. Pick one pattern.
- **M6. No caching layer.** Every API route is `dynamic:'force-dynamic'` +
  `no-store`. Combined with H1 this hammers Mongo and raises TTFB. Add short
  `s-maxage`/revalidation to read endpoints that tolerate slight staleness.
- **M7. `firebase-admin.js` throws at import if env is missing**
  (`process.env.FIREBASE_PRIVATE_KEY.replace(...)`), taking down every route that
  imports it rather than failing gracefully.

---

## 🟢 Architecture assessment

**Strengths**
- Clear separation: `lib/db` (data), `lib/services` (business logic),
  `app/api` (transport). This is a solid, maintainable layering.
- Role/permission model (`lib/auth/permissions.js`) is well thought out — granular
  editorial workflow (draft → review → publish, breaking/trending approval).
- The signed-JWT session system is correct and mobile-aware.

**Weaknesses / tech debt**
- **Rendering:** the app is heavily client-rendered (`'use client'` on home,
  article, live, bookmarks). The SEO work added server rendering for metadata,
  structured data and content, but the interactive shells still ship large client
  bundles. A gradual move to server components + client islands would cut JS and
  improve INP/LCP.
- **Data access is mixed:** client components fetch their own API over HTTP while
  server code (the new SEO layer) queries Mongo directly. Standardize on
  server-side data access + typed service functions.
- **No automated tests in CI:** `backend_test.py` exists but there's no evidence
  of a gate. Payment, auth, and permission logic especially need tests.
- **Scheduling/moderation depend on request traffic** rather than a scheduler
  (see H2).

---

## Suggested priority order
1. C1, C2, C3 — auth forgery, plaintext passwords, unverified payments (security).
2. Rotate the credentials that were exposed in the public repo (separate thread).
3. H1, H3 — connection caching + indexes (stability/scale).
4. H2, H4, H5 — cron jobs, upsert race, unify auth.
5. Medium items as follow-up hardening.

None of these block the SEO work already shipped — that layer is independent and
live. These are pre-existing application issues surfaced by a full read of the
repo.
