# NewsDesk

A multi-role newsroom CMS built on **Next.js 14 (App Router) + MongoDB**, with a public news site, an admin panel, and a REST-style API. Articles flow through a reporter → editor → admin workflow (`draft → pending_review → ready_to_publish → published`), with separate "breaking news" and "trending" approval lanes.

This README is the entry point for anyone touching the codebase. Read it once end-to-end before you start.

---

## Table of contents

1. [Stack & key dependencies](#1-stack--key-dependencies)
2. [Quick start](#2-quick-start)
3. [Environment variables](#3-environment-variables)
4. [Folder structure](#4-folder-structure)
5. [Request lifecycle](#5-request-lifecycle)
6. [Authentication & RBAC](#6-authentication--rbac)
7. [Article workflow (state machine)](#7-article-workflow-state-machine)
8. [Data model (MongoDB collections)](#8-data-model-mongodb-collections)
9. [API reference](#9-api-reference)
10. [Frontend (public site & admin)](#10-frontend-public-site--admin)
11. [Adding new code](#11-adding-new-code)
12. [Known issues & tech debt](#12-known-issues--tech-debt)
13. [Deployment](#13-deployment)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Stack & key dependencies

| Layer            | Tech                                                 |
| ---------------- | ---------------------------------------------------- |
| Framework        | Next.js **14.2.3** (App Router, JS — not TS)         |
| Database         | MongoDB (driver: `mongodb` 6.x)                      |
| Client auth      | Firebase Auth (Google + Apple SSO, phone OTP)        |
| Admin auth       | Custom email/password, opaque base64 token           |
| Media            | Cloudinary (signed direct uploads)                   |
| Payments         | Razorpay (client init present; not currently wired)  |
| Email            | Resend (client init present; not currently wired)    |
| Editor           | `react-quill` (loaded via `next/dynamic`, SSR off)   |
| UI               | shadcn/ui (Radix primitives) + Tailwind              |
| Charts           | Recharts                                             |
| Icons            | lucide-react                                         |
| Toasts           | Sonner                                               |
| PWA              | `next-pwa` + `public/manifest.json` + icons          |
| i18n             | `next-intl` (installed; not wired yet)               |

Node + package manager: project ships both `yarn.lock` and `package-lock.json` and pins `packageManager: yarn@1.22.22` in `package.json`. **Pick one and delete the other** (see [§12](#12-known-issues--tech-debt)).

---

## 2. Quick start

```bash
# 1. install deps
yarn install            # or: npm install

# 2. provision .env (see §3)
cp .env.example .env    # if you have one — otherwise create from §3 list

# 3. run dev server (allocates max 512MB to next dev for low-memory boxes)
yarn dev                # http://localhost:3000

# 4. seed demo users + categories + articles (one-time)
curl -X POST http://localhost:3000/api/seed
```

Seed creates these admin accounts (passwords are plain text — fix before prod, see [§12](#12-known-issues--tech-debt)):

| Email                    | Password    | Role     |
| ------------------------ | ----------- | -------- |
| `admin@newsdesk.com`     | `admin123`  | admin    |
| `editor@newsdesk.com`    | `editor123` | editor   |
| `reporter@newsdesk.com`  | `reporter123` | reporter |

Visit `/admin/login` and sign in.

Scripts in `package.json`:

| Script              | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `dev`               | `next dev` on `0.0.0.0:3000`, `NODE_OPTIONS=--max-old-space-size=512` |
| `dev:no-reload`     | Same, without the memory cap                                    |
| `dev:webpack`       | Identical to `dev:no-reload` (legacy name)                      |
| `build`             | `next build`                                                    |
| `start`             | `next start`                                                    |

---

## 3. Environment variables

All env vars live in `.env` at the repo root. Anything prefixed `NEXT_PUBLIC_` is exposed to the browser bundle — do **not** put secrets there.

### Required

| Var                                       | Purpose                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `MONGO_URL`                               | Mongo connection string                                  |
| `DB_NAME`                                 | Database name (default: `newsdesk_db`)                   |
| `NEXT_PUBLIC_BASE_URL`                    | Origin used by client code for absolute URLs             |

### Cloudinary (image uploads)

| Var                                       | Purpose                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `CLOUDINARY_CLOUD_NAME`                   | Server-side cloud name                                   |
| `CLOUDINARY_API_KEY`                      | Server-side API key                                      |
| `CLOUDINARY_API_SECRET`                   | Server-side secret (signs uploads in `/api/cloudinary/signature`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`       | Client-side cloud name (rendered into upload URLs)       |

If unset (or starting with `TODO`), `GET /api/cloudinary/signature` returns 500 and image uploads fail. Categories/news can still be created without images.

### Firebase Auth (public site readers)

`NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID`, `_MEASUREMENT_ID`, `_VAPID_KEY` — config from your Firebase console. `FIREBASE_ADMIN_CREDENTIALS` is reserved for future server-side admin SDK use.

### YouTube live banner (optional)

| Var                  | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `YOUTUBE_CHANNEL_ID` | Channel to detect live broadcasts on                       |
| `YOUTUBE_API_KEY`    | Optional. Without it, the page falls back to an iframe-only embed and skips live detection. |

Admin can override entirely via `/admin → Live Stream`, which writes to the `config` collection (key=`youtube`).

### Razorpay (subscriptions — not currently wired)

`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`. The server initializes a `Razorpay` client at boot only if the keys are present and don't start with `TODO`. **The client is currently not referenced anywhere** — subscriptions are stored in Mongo but no payment is taken (see [§12](#12-known-issues--tech-debt)).

### Resend (transactional email — not currently wired)

`RESEND_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`. Same status as Razorpay: client initialized but unused.

### Other

| Var               | Purpose                                                         |
| ----------------- | --------------------------------------------------------------- |
| `CORS_ORIGINS`    | Comma-separated origins for the global `Access-Control-Allow-Origin` header set in `next.config.js`. Defaults to `*`. |

---

## 4. Folder structure

```
news-application/
├── app/                                # Next.js App Router root
│   ├── layout.js                       # Root layout (38 lines)
│   ├── page.js                         # Public homepage (1696 lines — still monolithic, see §12)
│   ├── globals.css
│   ├── admin/
│   │   ├── page.js                     # Admin dashboard orchestration only (447 lines)
│   │   └── login/page.js               # Admin login form
│   ├── api-docs/page.js                # Swagger UI
│   └── api/                            # File-based API routes (41 endpoints)
│       ├── health/route.js
│       ├── news/...
│       ├── admin/...
│       ├── categories/route.js
│       ├── authors/[id]/route.js
│       ├── users/...
│       ├── subscriptions/...
│       ├── ads/...
│       ├── youtube/live/route.js
│       ├── cloudinary/signature/route.js
│       ├── subscribers/route.js
│       ├── seed/route.js
│       └── docs/route.js               # Swagger JSON
├── components/
│   ├── ui/                             # shadcn primitives (don't hand-edit)
│   ├── admin/                          # Admin-only feature components
│   │   ├── constants.js                # STATUS_LABELS, role→status options
│   │   ├── design-system.js            # `DS` object (inline styles)
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── DashboardView.jsx
│   │   ├── NewsListView.jsx
│   │   ├── CategoriesView.jsx
│   │   ├── UsersView.jsx
│   │   ├── LiveStreamView.jsx
│   │   ├── NewsFormDialog.jsx
│   │   ├── CategoryFormDialog.jsx
│   │   ├── UserFormDialog.jsx
│   │   ├── VersionHistoryDialog.jsx
│   │   ├── MenuBtn.jsx
│   │   ├── PaginationBtn.jsx
│   │   └── LoadingSpinner.jsx
│   └── upload/
│       ├── ImageUpload.jsx             # Single image w/ Cloudinary signed upload
│       └── MultiImageUpload.jsx        # Gallery (wraps ImageUpload)
├── lib/
│   ├── mongodb.js                      # `getDatabase()`, `getCollection()` — singleton client
│   ├── cloudinary.js                   # `generateUploadSignature()`, `deleteImage()`
│   ├── firebase.js                     # Client SDK + auth helpers (Google/Apple/phone)
│   ├── utils.js                        # `cn()` for Tailwind class merging
│   ├── api/
│   │   └── cors.js                     # `corsHeaders`, `json()`, `preflight()`
│   ├── auth/
│   │   ├── token.js                    # `getUserFromToken()`, `encodeToken()`
│   │   └── permissions.js              # `checkRole()`, `normalizeStatus()`, `canX()`
│   └── services/
│       ├── news.js                     # `autoPublishScheduledArticles()`
│       ├── subscriptions.js            # `SUBSCRIPTION_PLANS`, `getSubscriptionFeatures()`
│       └── ads.js                      # `ADS_CONFIG`
├── hooks/
│   ├── use-mobile.jsx
│   └── use-toast.js
├── public/
│   ├── icons/                          # PWA icons
│   └── manifest.json
├── next.config.js                      # standalone output, CORS headers, dev watch tuning
├── jsconfig.json                       # `@/*` path alias
├── tailwind.config.js
├── components.json                     # shadcn config
└── package.json
```

**Routing rule of thumb**: one file per endpoint, mirroring URL structure. Public reads under `/api/<resource>`, admin actions under `/api/admin/<resource>`. RBAC is enforced in the handler via `getUserFromToken()` + a `canX()` permission helper.

---

## 5. Request lifecycle

1. **Global CORS** — `next.config.js` adds `Access-Control-Allow-*` headers to every response via `headers()`. Each `route.js` *also* sets per-response CORS headers through `lib/api/cors.js` because some hosts strip framework-level headers on errors.
2. **OPTIONS preflight** — every route exports `OPTIONS = preflight` returning `{}` with CORS headers.
3. **Auth** — admin-mutating endpoints call `getUserFromToken(request)` first. The token is read in this order:
   1. `Authorization: Bearer <token>` header
   2. `x-admin-token: <token>` header
   3. `?token=<token>` query string (used by admin SSR fetches to avoid CORS preflights)
4. **Body parsing** — `await request.json().catch(() => ({}))` — empty body is tolerated where it makes sense (e.g. `/seed`).
5. **DB access** — `await getCollection('<name>')` returns a `Collection` from the cached `MongoClient`. The client is cached on `globalThis._mongoClientPromise` in dev to survive HMR.
6. **Response** — always wrapped in `json(data, { status })` from `lib/api/cors.js`. Errors are caught at the handler boundary, logged with `console.error`, and surfaced as `{ error: message }` with status 500.

`autoPublishScheduledArticles()` runs at the top of news-listing GETs (`/api/news`, `api/news/breaking`, `/api/news/[id]`, `/api/admin/news`). It bulk-flips `scheduled` rows whose `scheduledAt <= now` to `published`. This is a lazy cron substitute — there is no scheduled job. **If you stop hitting these GETs, scheduled articles never publish.** (See [§12](#12-known-issues--tech-debt).)

---

## 6. Authentication & RBAC

### Two auth systems

| System    | Used for       | Storage                      | Verification                                       |
| --------- | -------------- | ---------------------------- | -------------------------------------------------- |
| Firebase  | Public readers | `users` doc keyed by `firebaseUid` (synced via `POST /api/users/sync`) | Client-side only — server **does not** verify Firebase tokens today |
| Custom    | Admin panel    | `users` doc keyed by `id` (UUID), `role` ∈ `{admin, editor, reporter, reader}` | `Buffer.from(token, 'base64').split(':')[0] === userId` lookup |

The "admin token" is an opaque, **unsigned** base64 of `userId:timestamp`. Anyone who learns a user's `id` can forge a token. **This is a known weakness** ([§12](#12-known-issues--tech-debt)) — replace with JWT (or NextAuth) before production.

### Role hierarchy

```
admin   — can do everything
editor  — can edit any article, approve/revise pending articles, approve trending
reporter — can create + edit own drafts, submit own drafts for review
reader  — Firebase-authenticated end users (no admin access)
```

Permission helpers (`lib/auth/permissions.js`):

| Function                    | Returns true when                                                |
| --------------------------- | ---------------------------------------------------------------- |
| `canAccessAdminPanel(u)`    | role ∈ {admin, editor, reporter}                                 |
| `canCreateArticle(u)`       | role ∈ {admin, editor, reporter}                                 |
| `canEditArticle(u, a)`      | admin/editor anytime; reporter if author **and** status ∈ {draft, needs_revision} |
| `canSubmitForReview(u, a)`  | reporter is author and status = draft                            |
| `canReviewArticle(u)`       | role ∈ {admin, editor}                                           |
| `canApproveArticle(u)`      | role ∈ {admin, editor}                                           |
| `canPublishArticle(u)`      | role = admin                                                     |
| `canMarkBreaking(u)`        | role = admin                                                     |
| `canApproveBreaking(u)`     | role = admin                                                     |
| `canSuggestBreaking(u)`     | role ∈ {admin, editor, reporter}                                 |
| `canApproveTrending(u)`     | role ∈ {admin, editor}                                           |
| `canPublishScheduled(u, p)` | admin, or editor with `permissions.canPublishScheduled = true`   |
| `canPublishBreaking(u, p)`  | admin, or editor with `permissions.canPublishBreaking = true`    |

### Status normalization

The codebase is inconsistent about article-status casing — the same value appears as `'pending'`, `'pending_review'`, `'PENDING_REVIEW'`, and `'pendingreview'` in different code paths. `normalizeStatus()` collapses these to a single lowercase form (`draft`, `pending_review`, `needs_revision`, `ready_to_publish`, `published`, `scheduled`, `rejected`). **Always run incoming status through `normalizeStatus()` before comparing.**

---

## 7. Article workflow (state machine)

```
                    create (reporter/editor/admin)
                              │
                              ▼
                          ┌───────┐
              ┌──────────►│ DRAFT │◄──────────┐
              │           └───┬───┘           │
              │               │ submit        │
              │               │ (reporter)    │
              │               ▼               │
              │      ┌────────────────┐       │
              │      │ PENDING_REVIEW │       │ revise
              │      └────────┬───────┘       │ (editor/admin)
              │     approve   │   revise      │
              │   (editor/    │  (editor/     │
              │     admin)    │    admin)     │
              │               ▼               │
              │      ┌──────────────────┐     │
              │      │ NEEDS_REVISION   │─────┘
              │      └──────────────────┘
              │               │
              │      approve  │ (editor/admin)
              │               ▼
              │      ┌────────────────────┐
              │      │ READY_TO_PUBLISH   │
              │      └────────┬───────────┘
              │               │ publish (admin only)
              │               ▼
              │       ┌─────────────┐
              │       │  PUBLISHED  │◄──── scheduled (auto, on next GET)
              │       └─────────────┘
              │               ▲
              │               │ scheduledAt reached
              │       ┌────────────┐
              └───────│  SCHEDULED │
                      └────────────┘

  REJECTED is a terminal state set by `/reject`.
```

Two **independent** flags layered on top of the workflow:

- **Breaking news** — Suggested by reporter/editor (`breakingSuggested: true`); approved by admin via `/approve-breaking` (sets `isBreaking = true, breakingApproved = true`). Admin can also mark/unmark directly via `/breaking`.
- **Trending** — Suggested by reporter (`trendingSuggested: true`); approved by editor/admin via `/approve-trending` (sets `isTrending = true`).

### Endpoint → state transitions

| Endpoint                                     | Sets                                             | Allowed roles            |
| -------------------------------------------- | ------------------------------------------------ | ------------------------ |
| `POST /api/admin/news`                       | status = `draft` (or `body.status` if provided)  | admin/editor/reporter    |
| `POST /api/admin/news/[id]/submit`           | status = `pending`                               | **no auth check today** (see §12) |
| `POST /api/admin/news/[id]/approve`          | status = `published`, sets `publishedAt`         | **no auth check today** |
| `POST /api/admin/news/[id]/reject`           | status = `rejected`                              | **no auth check today** |
| `POST /api/admin/news/[id]/revise`           | status = `NEEDS_REVISION`                        | editor/admin             |
| `POST /api/admin/news/[id]/publish`          | status = `PUBLISHED`, sets `approvedBy`          | admin only               |
| `POST /api/admin/news/[id]/correction`       | appends a `corrections[]` entry                  | **no auth check today** |
| `POST /api/admin/news/[id]/breaking`         | `isBreaking` toggle                              | admin only               |
| `POST /api/admin/news/[id]/approve-breaking` | `isBreaking = true, breakingApproved = true`     | admin only               |
| `POST /api/admin/news/[id]/approve-trending` | `isTrending = true`                              | editor/admin             |
| `PUT  /api/admin/news/[id]`                  | bulk update with full RBAC + version history     | author (drafts) / editor / admin |
| `DELETE /api/admin/news/[id]`                | hard delete                                      | **no auth check today** |

> Note on case inconsistency: `/submit`, `/approve`, `/reject` write **lowercase** statuses (`pending`, `published`, `rejected`), while `/revise` and `/publish` write **UPPERCASE** (`NEEDS_REVISION`, `PUBLISHED`). All clients read status through `normalizeStatus()`, so this works — but it's a latent footgun. See [§12](#12-known-issues--tech-debt).

---

## 8. Data model (MongoDB collections)

All documents use a string `id` field (UUID) as the application-level primary key. `_id` (ObjectId) is ignored by the app code.

### `users`

```js
{
  id: "uuid",
  firebaseUid: "...",        // null for admin-panel users
  email: "user@example.com",
  password: "plain-text",    // ⚠️ admin users only — see §12
  name: "Jane Doe",
  role: "admin" | "editor" | "reporter" | "reader",
  isVerified: false,
  bio: "",
  avatar: "https://...",
  fcmToken: "...",           // null if no push token
  permissions: {             // editor-only granular perms
    canPublishScheduled: false,
    canPublishBreaking: false,
  },
  preferences: {             // readers
    categories: [],
    notifications: true,
  },
  createdAt, updatedAt, lastLogin
}
```

### `news`

```js
{
  id: "uuid", slug: "kebab-case",
  title, content, excerpt,
  category: "category-slug",       // FK to categories.slug
  tags: ["..."],
  featuredImage: "https://...",
  images: [{ url, crop: null }],
  status: "draft|pending_review|needs_revision|ready_to_publish|published|scheduled|rejected",
  isBreaking, breakingApproved, breakingSuggested,
  isTrending, trendingSuggested, isFeatured,
  authorId, authorName,
  source, sourceUrl,
  seoTitle, seoDescription, seoKeywords: [...],
  reviewedBy, approvedBy,
  views: 0,
  shares: { whatsapp: 0, twitter: 0, facebook: 0 },
  versionHistory: [{ id, title, content, ..., editedBy, editedByName, editedAt }],
  corrections: [{ id, text, by, byName, at }],
  approvalHistory: [{ action, by, byName, at, comment }],
  scheduledAt,                     // optional
  publishedAt,                     // set on publish
  createdAt, updatedAt
}
```

### `categories`

```js
{
  id, name, slug, description, icon, color: "#RRGGBB",
  order: 1, isActive: true,
  createdAt, updatedAt
}
```

### `subscriptions`

```js
{
  id, userId, email,
  plan: "free|basic|premium|enterprise",
  status: "active|cancelled|expired",
  startDate, endDate,                // endDate=null for free
  features: { adsEnabled, articleLimit, offlineAccess, ... },  // snapshotted from getSubscriptionFeatures()
  paymentMethod, autoRenew,
  createdAt, updatedAt
}
```

### `ad_impressions`

```js
{
  id, adId, adType: "programmatic|native|video",
  placement: "header|sidebar|in-article|footer|video-player",
  userId, sessionId, newsId,
  timestamp, clicked: false, clickedAt, revenue
}
```

### `reading_history`

```js
{
  odellerId: "<userId>_<newsId>",    // ← yes, "odellerId" is the actual key. Typo we haven't fixed; see §12
  userId, newsId,
  newsTitle, newsExcerpt, newsFeaturedImage, newsCategory,
  scrollPosition, readPercentage,
  lastRead
}
```

### `config`

Singletons keyed by `key`:

- `key: "youtube"` → `{ videoId, channelId, title, isLive, updatedAt }`

### `email_subscribers`

```js
{ email, isActive, subscribedAt }
```

### Indexes

There are **no indexes defined in code**. Mongo's default `_id` index is the only one. For prod, add at minimum: `news.id`, `news.slug`, `news.status`, `news.publishedAt`, `users.email`, `users.firebaseUid`, `categories.slug`. See [§12](#12-known-issues--tech-debt).

---

## 9. API reference

All responses are JSON. All routes accept `OPTIONS` (preflight). Mutation routes that need auth read the token via Bearer header, `x-admin-token`, or `?token=`.

### Public

| Method | Path                              | Description                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| GET    | `/api/health`                     | Liveness check                               |
| GET    | `/api/news`                       | List published news. Query: `category`, `search`, `limit`, `page` |
| GET    | `api/news/breaking`              | Top 10 breaking + published                  |
| GET    | `/api/news/[id]`                  | Single article. Increments `views`           |
| POST   | `/api/news/[id]/share`            | `{ platform }` → `$inc shares.<platform>`    |
| GET    | `/api/categories`                 | Active categories (deduped by slug)          |
| GET    | `/api/authors/[id]`               | Author profile + up to 10 published articles |
| GET    | `/api/subscriptions/plans`        | Static plan catalog                          |
| GET    | `/api/subscriptions/user/[id]`    | Active sub for user (falls back to free)     |
| POST   | `/api/subscriptions`              | Create sub. **No payment integration today** |
| POST   | `/api/subscriptions/[id]/cancel`  | Soft-cancel (`status = cancelled`)           |
| GET    | `/api/ads/config`                 | Static ad placements config                  |
| POST   | `/api/ads/impression`             | Track impression; returns `impressionId`     |
| POST   | `/api/ads/click`                  | Mark `clicked = true` for an impression      |
| GET    | `/api/youtube/live`               | Live status (DB override → API check → fallback embed) |
| GET    | `/api/cloudinary/signature`       | Signed-upload params. Query: `folder`, `resource_type` |
| GET    | `/api/subscribers`                | List active email subscribers (note: this is public; not gated) |
| POST   | `/api/users/sync`                 | Upsert Firebase-authed reader                |
| POST   | `/api/users/fcm-token`            | Update FCM push token                        |
| POST   | `/api/users/reading-history`      | Upsert reading-history entry                 |
| GET    | `/api/users/[id]/history`         | Last 20 read articles                        |
| POST   | `/api/seed`                       | Idempotent seed (demo users + categories + 5 articles) |

### Admin

| Method | Path                                       | Description                                  |
| ------ | ------------------------------------------ | -------------------------------------------- |
| POST   | `/api/admin/login`                         | `{ email, password }` → `{ admin, token }`   |
| GET    | `/api/admin/news`                          | All news (any status). Query: `status`, `limit`, `page` |
| POST   | `/api/admin/news`                          | Create article (auth required)               |
| PUT    | `/api/admin/news/[id]`                     | Update (RBAC + version history)              |
| DELETE | `/api/admin/news/[id]`                     | Hard delete                                  |
| POST   | `/api/admin/news/[id]/submit`              | Reporter submits draft                       |
| POST   | `/api/admin/news/[id]/approve`             | Editor approves → published                  |
| POST   | `/api/admin/news/[id]/reject`              | Reject (terminal `rejected`)                 |
| POST   | `/api/admin/news/[id]/correction`          | Append correction                            |
| POST   | `/api/admin/news/[id]/revise`              | Send back to reporter (auth required)        |
| POST   | `/api/admin/news/[id]/publish`             | Admin publishes (auth required)              |
| POST   | `/api/admin/news/[id]/breaking`            | Toggle breaking (admin only)                 |
| POST   | `/api/admin/news/[id]/approve-breaking`    | Approve breaking suggestion (admin only)     |
| POST   | `/api/admin/news/[id]/approve-trending`    | Approve trending suggestion                  |
| GET    | `/api/admin/categories`                    | All categories (incl. inactive)              |
| POST   | `/api/admin/categories`                    | Create                                       |
| PUT    | `/api/admin/categories/[id]`               | Update                                       |
| DELETE | `/api/admin/categories/[id]`               | Delete                                       |
| GET    | `/api/admin/users`                         | All users                                    |
| POST   | `/api/admin/users`                         | Create (stores password plain text)          |
| PUT    | `/api/admin/users/[id]`                    | Update (`firebaseUid` stripped from body)    |
| DELETE | `/api/admin/users/[id]`                    | Delete                                       |
| GET    | `/api/admin/analytics`                     | Aggregates + top 10 articles                 |
| GET    | `/api/admin/ads/analytics`                 | Impression/click totals + breakdowns         |
| GET    | `/api/admin/push-tokens`                   | All users with a `fcmToken`                  |
| GET    | `/api/admin/youtube-config`                | Get current YouTube config                   |
| POST   | `/api/admin/youtube-config`                | Set videoId/title/isLive                     |

> Swagger UI is served at `/api-docs`, sourced from `/api/docs`. Note: the swagger doc is **manually maintained** in `app/api/docs/route.js` and may drift from actual route behavior — treat this README as the source of truth.

---

## 10. Frontend (public site & admin)

### Public site (`app/page.js`)

Still a single 1696-line file containing 12 inline components (`ProgrammaticAd`, `NativeAd`, `SubscriptionPlans`, `ArticleCard`, `TrendingItem`, `FontToolbar`, plus the main `Home` component). **Splitting this is the next planned refactor** — see [§12](#12-known-issues--tech-debt).

Authentication: Firebase popup (`signInWithGoogle`, `signInWithApple`) → user is auto-synced to Mongo via `POST /api/users/sync` on login.

### Admin panel (`app/admin/page.js`)

Thin orchestrator (447 lines). Holds:

- Tab state + role-gated navigation
- Auth bootstrap (reads `admin_token` + `admin_session` from `localStorage`)
- `authFetch()` helper that attaches token via header **and** query string
- CRUD handlers (`handleSaveNews`, `handleSaveCategory`, `handleSaveUser`, `handleWorkflowAction`)
- Mounts view components and dialogs

All UI lives in `components/admin/*` and `components/upload/*`.

#### Login flow

`/admin/login` posts to `/api/admin/login`. On success the response is split into:
- `localStorage.admin_token` — the opaque token
- `localStorage.admin_session` — `{ id, name, email, role, permissions }` for client-side RBAC

Every subsequent admin request goes through `authFetch()` which appends `?token=…` and sets `Authorization` + `x-admin-token` headers.

#### Adding admin features

1. Add a tab id to the `NAV` array in `components/admin/Sidebar.jsx` with `roles: [...]` for visibility.
2. Add a `case '<id>'` branch to `renderView()` in `app/admin/page.js`.
3. Build the view as `components/admin/<Name>View.jsx`. Use `DS` from `design-system.js` for styling — do not introduce a new style system unless the user has signed off.

### Styling

The admin panel uses **inline styles** via a `DS` token object (`components/admin/design-system.js`). The public site uses Tailwind + shadcn primitives. This split is intentional but ugly — converging on one system is a future project, not blocking work.

---

## 11. Adding new code

### A new API endpoint

1. Create `app/api/<path>/route.js`. Mirror an existing simple route (e.g. `appapi/news/breaking/route.js`).
2. Always export `OPTIONS = preflight` and wrap responses with `json()` from `lib/api/cors.js`.
3. If the endpoint mutates and requires auth:
   ```js
   const user = await getUserFromToken(request);
   if (!user || !canX(user)) {
     return json({ error: 'Unauthorized' }, { status: 403 });
   }
   ```
4. If you add new business logic, place it in `lib/services/<domain>.js` — keep route handlers ≤ 100 lines.
5. Wrap the handler body in `try/catch`; log with `console.error('<METHOD> <path> error:', error)` and return 500.

### A new admin component

1. Place under `components/admin/` (or `components/upload/`, `components/news/` if shared with the public site).
2. Start the file with `'use client';`.
3. Import `DS` and existing constants instead of duplicating styles or status maps.
4. Keep props explicit — no Context, no global state. The admin page is the single source of truth for state.
5. If the component owns local UI state (open menus, pagination cursors), keep it inside the component.

### A new MongoDB collection

1. Use `getCollection('<name>')` — the client is cached. Don't `new MongoClient()`.
2. Always include an app-level `id: uuidv4()` field. Don't rely on `_id`.
3. Add timestamps: `createdAt`, `updatedAt`.
4. Add the collection to the data-model section of this README.
5. Consider adding indexes (see [§12](#12-known-issues--tech-debt) — not yet codified, but if you're touching prod, add them).

### A new permission rule

Add a `canX()` helper in `lib/auth/permissions.js`. Don't sprinkle `user.role === 'admin'` checks across route files — they will drift.

---

## 12. Known issues & tech debt

Prioritize these before shipping to production traffic.

### Security — high priority

- **Plain-text passwords for admin users.** `password` is stored verbatim in `users` and string-compared in `/api/admin/login`. Hash with `bcrypt`/`argon2` and run a backfill migration.
- **Opaque base64 token is forgeable.** Anyone who learns a user's `id` can construct a valid token. Switch to JWT (HS256 minimum) or NextAuth.
- **Three admin endpoints have no auth check** (`/submit`, `/approve`, `/reject`, `/correction`, `/breaking` toggle's lighter siblings, `DELETE /api/admin/news/[id]`, `DELETE /api/admin/categories/[id]`, `DELETE /api/admin/users/[id]`). These were inherited from the original code; the duplicate "safe" versions were already present but unreachable. Wire them through `getUserFromToken()` + the appropriate `canX()`.
- **Token passed in query string** (`?token=`) leaks into HTTP access logs and `Referer` headers. Move to headers only once CORS is solved at the proxy.
- **`GET /api/subscribers` is public** and returns all email addresses. Gate it behind admin auth.

### Correctness

- **Status casing is inconsistent.** `/submit` writes `'pending'`, `/revise` writes `'NEEDS_REVISION'`, `/publish` writes `'PUBLISHED'`. Standardize on snake_case lowercase; run a migration to normalize existing data.
- **`autoPublishScheduledArticles()` is lazy.** Scheduled articles only publish when someone hits a news GET. Add a Vercel cron (`/api/cron/publish-scheduled` + `vercel.json`) or external scheduler.
- **`reading_history.odellerId`** is a typo (should be `ownerId` or `entryId`). Migrating it is annoying because of existing data — track it.
- **Subscription creation never charges.** `POST /api/subscriptions` inserts a record but bypasses Razorpay entirely. Either wire it up or remove the endpoint.
- **No MongoDB indexes** — see §8. Reads on `news.status` + `news.publishedAt` will table-scan once you have non-trivial data.
- **Razorpay / Resend clients initialized but unreferenced.** Dead code. Either implement, or delete the deps to shrink the bundle.

### Maintenance

- **`app/page.js` is still 1696 lines.** Same monolith problem the admin page had. Apply the same split: `components/news/{ArticleCard,TrendingItem,FontToolbar,SubscriptionPlans,…}.jsx`.
- **Two lockfiles** (`yarn.lock` + `package-lock.json`). Pick one and delete the other.
- **Root clutter**: `original-e7ac5ca215cbd2df38d4165020026124.jpeg`, `API_TEST_REPORT.md`, `test_result.md`, `backend_test.py`, `tests/__init__.py` (empty Python). Move docs to `docs/`, delete the stray jpeg, decide whether to keep the Python test runner or replace with JS.
- **No middleware.** Auth + token extraction is duplicated across 20+ route files. Move to `middleware.js` so admin routes are gated centrally.
- **No zod validation.** `zod` is a dep but unused — request bodies are read raw. Add per-route schemas to catch malformed payloads at the boundary.
- **No automated tests.** `backend_test.py` exists but isn't wired to CI. Add a JS test runner (vitest) + a few API integration tests at minimum for the workflow endpoints.

### Performance / UX

- **`fetch` calls in the admin page are not deduped.** Switching tabs triggers refetches even when data is current. Consider SWR or React Query.
- **Auto-publish runs on every news GET** — fast but unnecessary. Add a 30s cache or push to a cron.
- **Console.log noise**: `getUserFromToken` previously logged tokens; the refactor stripped that, but other endpoints still log freely. Audit for PII before going to prod.

---

## 13. Deployment

The project is configured for Vercel-style deployment:

- `next.config.js` sets `output: 'standalone'` (also Docker-friendly).
- Images are unoptimized (`images.unoptimized: true`) — Cloudinary handles transformations.
- `serverComponentsExternalPackages: ['mongodb']` keeps the Mongo driver out of the RSC bundle.

Steps:

1. Push to Vercel (or your platform).
2. Set every var from [§3](#3-environment-variables) in the project's env settings. **Required:** `MONGO_URL`, `DB_NAME`, Cloudinary creds. The rest can stay as placeholders if the corresponding feature isn't used.
3. After first deploy, run `curl -X POST https://<your-domain>/api/seed` once to bootstrap the demo data. **Delete the `/api/seed` route before production** — it's idempotent for categories but always upserts demo admin accounts.
4. Sign in at `/admin/login`, change the demo admin password (currently means editing the Mongo doc directly — there's no UI for it yet).

Self-hosting: `next build && next start` works. For Docker, the `standalone` output gives you `.next/standalone/server.js`.

---

## 14. Troubleshooting

### "Module not found: Can't resolve 'react-quill'"

`node_modules` is out of sync with `package.json`. Run `yarn install` (or `npm install`). The admin "Create Article" dialog dynamically imports `react-quill` for the rich-text editor.

### "Cloudinary credentials are not configured"

`GET /api/cloudinary/signature` returns 500 when `CLOUDINARY_CLOUD_NAME`, `_API_KEY`, or `_API_SECRET` is missing or starts with `TODO`. Set them in `.env` and restart `next dev`.

### "Invalid email or password" with seed credentials

The seed route upserts demo users on every call. If you've changed admin passwords manually and re-ran `/api/seed`, the demo passwords are restored. Either don't re-seed, or update the password again.

### Admin token "works" then suddenly 401s

Tokens have no expiry today — once issued they're valid forever as long as the user exists. A 401 means either:
- The user was deleted from Mongo
- `localStorage.admin_token` got cleared (browser dev tools / extension)
- The base64 decode is producing a `userId` that doesn't match any user (corruption)

The fix is always: log out and sign in again at `/admin/login`.

### Scheduled article never publishes

See [§12](#12-known-issues--tech-debt). `autoPublishScheduledArticles()` only runs when someone hits `/api/news`, `api/news/breaking`, `/api/news/[id]`, or `/api/admin/news`. If your traffic is zero in dev, hit one of those endpoints manually.

### Build fails on Vercel with "out of memory"

The `dev` script caps Node at 512MB; `build` doesn't. If you hit OOM on a small dyno, set `NODE_OPTIONS=--max-old-space-size=1024` in Vercel's build env.

---

## License

Proprietary — internal project.
