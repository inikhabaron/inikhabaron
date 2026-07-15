# Security & Stability Fixes — Applied

All fixes use **Node's built-in `crypto`** and the existing `jsonwebtoken` — **no
new npm dependencies**, so there is no lockfile/build risk. All 24 changed files
pass a syntax/JSX parse, and the password-hashing and Razorpay-signature helpers
were runtime-tested.

## New files
| File | Purpose |
|---|---|
| `lib/auth/admin/password.js` | scrypt password hashing + constant-time verify + legacy detection. |
| `lib/auth/admin/guard.js` | `requireAdmin(request, roles)` — one call to authenticate + role-check an admin route. |
| `lib/services/payments/razorpay.js` | HMAC verification of Razorpay payments and webhooks. |
| `lib/db/ensureIndexes.js` | Creates all needed MongoDB indexes once per process. |

## Fixes by finding
- **C1 — forgeable admin token → FIXED.** `lib/auth/admin/token.js` now issues and
  verifies a **signed JWT** (HMAC via `JWT_SECRET`) instead of plain base64. The
  insecure `?token=` query path was removed.
- **C2 — plaintext passwords → FIXED.** `admin/login` hashes with scrypt and
  **auto-migrates** existing plaintext passwords on first successful login. New
  users (`admin/users` POST/PUT) are hashed on write; password fields are no
  longer returned in any response.
- **C3 — unverified payments → FIXED.** `POST /api/subscriptions` now requires a
  logged-in user (userId taken from the session, not the body) and **verifies the
  Razorpay signature** for paid plans.
- **Unauthenticated admin routes → FIXED (14 routes).** Added `requireAdmin` to:
  `admin/users` (+`[id]`), `admin/categories` (+`[id]`), `admin/tags` (+`[id]`),
  `admin/news/[id]/{approve,reject,submit,correction}`, `admin/analytics`,
  `admin/youtube-config`, `admin/push-tokens`, `admin/ads/analytics`.
  `GET /api/admin/users` no longer dumps password hashes; `PUT` routes now
  whitelist fields (no more role-escalation via mass-assignment); editorial audit
  entries use the authenticated user, not a client-supplied id.
- **H1 — Mongo connection churn → FIXED.** `lib/mongodb.js` caches the client on
  `global` in all environments (bounded pool).
- **H3 — missing indexes → FIXED.** Indexes for news/users/comments/subscriptions
  created once per process (fire-and-forget, non-blocking).
- **H4 — first-login race → FIXED.** `firebaseUser.js` uses an atomic upsert.
- **M1 — wildcard CORS → FIXED.** `lib/api/cors.js` reflects only allowlisted
  origins (from `CORS_ORIGINS` + site URL); same-origin and mobile unaffected.

## ⚠️ Things to know before/after deploying
1. **Admins get logged out once.** Old base64 tokens no longer validate — everyone
   re-logs in (their password auto-upgrades to a hash on that login). Expected.
2. **Paid "Upgrade" button now needs real Razorpay Checkout.** Paid plans will
   return `402` until the frontend runs Razorpay Checkout and sends
   `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` (and a
   create-order endpoint is added). The **free** plan still works. This is correct
   — paid upgrades were previously granted with no payment at all.
3. **Unique indexes need clean data.** If duplicate users already exist (from the
   old race), the unique `email`/`firebaseUid` indexes won't build until the
   duplicates are removed. `ensureIndexes` logs and continues rather than crashing.
4. **Still exposed in the public repo:** these code fixes don't undo the secrets
   already committed to git history. Rotating keys + making the repo private (the
   separate security thread) is still required.

## Not yet done (recommended follow-ups)
- **H2** — move `autoPublishScheduledArticles` / `autoApprovePendingComments` off
  the read path into a **Vercel Cron** job.
- **M2** — a few non-critical routes still return `error.message`; sweep them to a
  generic message (the security-critical routes were fixed).
- **M4** — sanitize article HTML on write/render (`isomorphic-dompurify`).
- **M5** — standardize `params` handling before a Next 15 upgrade.
- **Razorpay order creation** endpoint + frontend Checkout integration (see #2).
