# ADR-001: Editorial operations and notification delivery are separate layers

- **Status:** Accepted
- **Date:** 2026-07-31
- **Applies to:** `app/api/admin/news/[id]/*`, `app/api/auth/session`, `lib/services/notifications/**`, `app/api/cron/notifications`
- **Enforced by:** `npm run check:boundary` (`scripts/checkNotificationBoundary.mjs`) — fails CI on violation

## Decision

**Publishing an article must never be able to fail because push notifications are broken.**

Editorial routes persist a notification *job* and return. A cron worker delivers it later. Editorial code may depend on authentication, authorization, MongoDB, validation, business logic, and notification **job creation** — and nothing else. Specifically it must never reach, at module load:

`firebase-admin` · FCM · `jwks-rsa` · `jose` · the push sender · the notification dispatcher

## Context: the 20 July 2026 regression

`approve-breaking` had worked for months. Commit `e1c8fd0` ("feat: add user location prompt handling and notifications", 58 files) broke it, and three sibling editorial actions with it.

The commit added one line to the route — an import of the notification helper. That helper reached the dispatcher, which reached the push sender, which reached Firebase Admin. Measured module-load closure:

```
before (6fe5c06):  7 files, external deps: mongodb, jsonwebtoken, next/server
after  (e1c8fd0): 20 files, external deps: + crypto, axios,
                            firebase-admin/app, firebase-admin/auth, firebase-admin/messaging
```

### The dependency explosion

```
approve-breaking
  → articleNotifications
    → dispatchNotificationJob
      → pushSenderService
        → firebase-admin        (14.1.0)
          → jwks-rsa            (4.1.0, CommonJS)
            → jose              (6.2.3, ESM-only, no `require` export)
```

`jwks-rsa/src/utils.js` line 1 is `const jose = require('jose')`. Requiring an ESM-only package throws `ERR_REQUIRE_ESM` under a CommonJS loader. The deployed runtime's loader raised exactly that:

```
Error [ERR_REQUIRE_ESM]: require() of ES Module .../jose/dist/webapi/index.js
  from .../jwks-rsa/src/utils.js not supported
page: '/api/admin/news/.../approve-breaking'
```

### Why it was so damaging

The throw happened during **module evaluation** — before the route handler, and therefore before its own `try/catch` existed. Next.js answered with its HTML `/500` page. The consequences:

- The app could neither catch nor log the reason. Nothing appeared in application logs.
- The admin UI showed only "Failed to approve-breaking article".
- The client called `res.json()` on an HTML body → `SyntaxError: Unexpected token '<'`.
- Six routes died from one cause: the four editorial actions, `POST /api/auth/session` (login), and the notification cron itself — so retries were dead too.
- It reproduced on **no** developer machine. Local Node has `require(esm)` unflagged (`process.features.require_module === true`), so the same code loads fine. Only the deployed loader failed.

Diagnosis took hours and produced several wrong theories (missing env var, Node version, package manager) because the actual error was invisible to the application.

## Why Firebase is forbidden in editorial routes

Publishing an article is a **product guarantee**. Push delivery is **infrastructure**. Infrastructure must not sit in the critical path of the guarantee.

This is not about Firebase specifically. Any dependency in an editorial route's module-load graph becomes a way for that route to fail, and module-load failures are the worst kind: uncatchable, unloggable, and total. The narrower the graph, the fewer ways publishing can break.

When Firebase is completely unavailable, the required behaviour is:

- the article still publishes
- the breaking ticker still updates
- the site still serves the article
- the notification job stays `pending` and is retried later

## Architecture

```
approve-breaking / approve-trending / breaking / publish
        ↓  validate admin
        ↓  update article in MongoDB
        ↓  persist notification job          ← Layer 1 ends here
        ↓  HTTP 200

cron/notifications  (schedule per deployment)  ← Layer 2 begins here
        ↓  atomically claim next due job (priority order)
        ↓  resolve recipients
        ↓  initialize Firebase Admin (lazily)
        ↓  send, checkpointing every 100 tokens
        ↓  retry failures with exponential backoff
        ↓  mark sent / failed
```

| Layer | Location | May import Firebase |
|---|---|---|
| 1 — Editorial | `articleNotificationQueue.js` | **No** |
| Seam | `notificationJobService.js` (persistence only) | **No** |
| 2 — Delivery | `notifications/delivery/**` | Yes |

`notificationJobService.js` is deliberately Firebase-free so both layers can import it. There is deliberately **no** "send this job now" export, so delivery cannot be pulled onto a request path by accident.

## Allowed and forbidden import graphs

**Allowed** — editorial route (13 files, no third-party SDK):

```
approve-breaking
  → lib/auth/admin/token          (auth)
  → lib/auth/permissions          (authorization)
  → lib/mongodb                   (data)
  → articleNotificationQueue
    → notificationJobService
      → lib/db/notificationJobs
```

**Allowed** — delivery worker (cron only):

```
cron/notifications
  → delivery/dispatchNotificationJob
    → delivery/targetingService
    → delivery/pushSenderService
      → lib/auth/user/firebase-admin   ← correct here
```

**Forbidden** — any of these in an editorial route:

```
approve-breaking → delivery/dispatchNotificationJob        ✗
approve-breaking → delivery/pushSenderService              ✗
approve-breaking → lib/auth/user/firebase-admin            ✗
publish          → firebase-admin/messaging                ✗
any editorial    → jose | jwks-rsa                         ✗
```

## Rules

1. An editorial action that should notify calls the **Layer 1 queue**, never the dispatcher.
2. Importing anything from `notifications/delivery/` outside a cron route is a bug.
3. Creating a job is part of publishing. **Sending is not.**
4. Failing to enqueue must not fail the editorial action — the article is already published; log and move on.
5. Retries live in the job (`attempts`, `nextAttemptAt`), never in the request.
6. Firebase Admin is loaded lazily (`await import()`) **even inside Layer 2**, so a broken SDK fails inside the worker's `try/catch` and the job is retried, rather than crashing the cron at module load and killing retries permanently.
7. Operational tooling (metrics, job admin) must not depend on the subsystem it inspects. A monitor that dies with its subject is useless.

## Consequences

**Gained:** publishing survives total Firebase/FCM failure; failures are catchable, loggable and visible; retries with backoff; bounded duplicate risk (≤100 tokens per crash) via progress checkpointing; a CI guard that fails on regression.

**Accepted costs:** delivery is no longer instant — latency is bounded by how often the worker runs. The schedule is a deployment concern, not an architectural one, and is deliberately NOT hardcoded to a plan-specific value: `vercel.json` ships the universally-valid daily cron, and the recommended Hobby / Pro / external-scheduler options are documented in `app/api/cron/notifications/route.js`. Breaking news needs a frequent trigger — an external scheduler is the recommended way to get it without a plan upgrade. Two moving parts instead of one. A queue that needs monitoring, hence `GET /api/admin/notifications/metrics`.

## Verification

```bash
npm run check:boundary   # exits non-zero if an editorial route regains a Firebase dependency
```

The guard **discovers** editorial routes (any non-cron route reaching the queue module) rather than reading a hardcoded list, so a new publishing action is covered automatically the moment it enqueues. It also asserts delivery is still reachable from cron, so "passing" cannot mean "sending is silently disabled".

## Lessons learned

The architecture above is the *answer*. This section records the mistakes that made it necessary, because the rules look arbitrary without them.

**1. Dependency expansion is invisible in code review.** The change that caused the outage added *one import line* to a route. Nobody reviewing that diff could see that it grew the route's module-load closure from **7 files to 20**, or that it attached `firebase-admin`, `jwks-rsa` and an ESM-only `jose` to publishing. A one-line diff and a 13-file dependency increase look identical in a pull request. This is why the boundary is now measured mechanically rather than trusted to review.

**2. Editorial routes must not depend on infrastructure SDKs, because module-load failures are unrecoverable.** A failure inside a handler is catchable, loggable, and can degrade gracefully. A failure while *evaluating a module* happens before the handler exists — so the framework answers with its own error page, the application cannot log the reason, and the client receives HTML where it expected JSON. Six routes died from one bad transitive dependency, including login and the cron worker that would have retried the work. The severity came from *where* the dependency sat, not from what was wrong with it.

**3. CI enforces the boundary because documentation does not.** An ADR nobody reads cannot stop a well-meaning developer from importing a notification helper into a route. Three guards (`check:boundary`, `check:infra`, `check:queue`) now fail the build instead. Each was **negative-tested** — deliberately broken to confirm it actually fails — because a guard that silently never triggers is worse than no guard: it manufactures false confidence.

**4. Lockfile reproducibility is a correctness property, not hygiene.** `yarn.lock` was missing an entry for a declared dependency, so every deploy re-resolved packages and printed `success Saved lockfile.` Builds were therefore not reproducible, which is precisely how a transitive dependency can change underneath you between two deploys of identical source. `--frozen-lockfile` in CI makes that drift a hard failure. When it was first added it *immediately failed*, which is the point.

**5. Validate assumptions with a test designed to fail.** Several confident conclusions during this investigation were wrong:

- `GET /api/test/firebase` returned `{"success":true}` and was read as proof Firebase was healthy. It imported `adminAuth` but never called it, and was statically prerendered — so it reported a build-time snapshot and could not fail. A health check that cannot fail is not a health check.
- Making an import dynamic was claimed to remove `firebase-admin` from the route bundle. Inspecting the built output showed it did not (the framework inlines the chunk); only *evaluation* was deferred.
- The runtime failure was attributed in turn to a missing environment variable, the Node version, and the package manager. All three were plausible, all three were wrong, and each was abandoned only when a measurement contradicted it. The actual cause — `ERR_REQUIRE_ESM` from `jose` — was visible in the platform's runtime log the whole time.

The generalizable rule: prefer a measurement that can contradict you over reasoning that cannot. When a check passes, ask what it would look like if the thing being checked were broken — and if the answer is "the same", the check is worthless.

## Dependency update policy

This incident originated in dependency behaviour, so upgrades follow explicit rules:

1. **Never upgrade an infrastructure SDK straight to production.** `firebase-admin`, `resend`, `cloudinary`, `sharp`, AWS clients, `twilio` and anything else in `INFRA_SDKS` (see `scripts/checkInfraBoundary.mjs`) go to a **Preview deployment** first.
2. **Always commit the updated lockfile** in the same change as the `package.json` edit. CI runs `--frozen-lockfile`; an uncommitted lockfile fails the build by design.
3. **Upgrades touching authentication or notification delivery require browser smoke tests before production** — at minimum Google Sign-In, Phone Sign-In, `/api/auth/session` returning 200, and the session cookie being set. Module-load and unit checks are not sufficient: they cannot exercise `verifyIdToken` against a real Google-issued token.
4. **Transitive changes count.** A patch bump to a direct dependency can swap a transitive one from CommonJS to ESM-only, which is exactly what happened here. Review the lockfile diff, not just `package.json`.
5. **Overrides / resolutions are a last resort and must be justified in writing.** Pinning a transitive dependency outside its declared range (e.g. forcing `jose@5` under `jwks-rsa@^6`) works, but leaves the graph unsupported. Prefer a dependency set that satisfies every declared range.

## Related

- `CLAUDE.md` → "Notification architecture: editorial and delivery are separate layers"
- Retry policy: `lib/services/notifications/notificationJobService.js` (documented at `MAX_ATTEMPTS`)
- Upstream: [auth0/node-jwks-rsa#493](https://github.com/auth0/node-jwks-rsa/issues/493), [firebase/firebase-admin-node#2543](https://github.com/firebase/firebase-admin-node/issues/2543)
