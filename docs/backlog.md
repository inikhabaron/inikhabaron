# Backlog

Future-enhancement notes — deliberately deferred work, not yet scheduled.
Unlike `docs/architecture/ADR-*.md` (which record decisions already made),
entries here are things worth doing later but not decided in detail yet.
Promote an entry to an ADR once it's actually being built and the design
choices need to be justified.

## Replace client polling with SSE/WebSockets for live cricket scores

**Status:** Not started. **Added:** 2026-08-01. **Scheduled:** Phase 4 of
`docs/cricket-roadmap.md`.

Every open `/cricket`, `/cricket/[id]`, or homepage-widget tab currently
polls `GET /api/cricket/matches` (or `/matches/[id]`) on its own timer —
60s while a match is live, 10min otherwise (`lib/cricket/matchStatus.js`).
The server-side Redis "fresh" cache (`lib/services/cricket/cricketCache.js`)
already collapses concurrent polls into one upstream CricAPI call per TTL
window regardless of visitor count, so this isn't an upstream-quota problem
today. It becomes a *backend request-volume* problem at scale — thousands of
tabs each independently hitting the Next.js server/CDN every 60s during a
high-traffic event (e.g. an IPL final) is a lot of redundant request
handling for data that's identical across every one of them:

```
CricAPI → server cache → [poll] → thousands of individual clients
```

vs. the target shape:

```
CricAPI → server cache → SSE/WebSocket push → thousands of individual clients
```

One upstream refresh would fan out to every connected client instead of
each client separately re-requesting the same cached payload.

**Why deferred:** polling is simpler, already works, and hasn't been load-
tested against real traffic (no live CricAPI key yet — see the cricket
module's other open item on that). Worth revisiting once real usage numbers
exist to justify the added operational complexity (persistent connections,
horizontal-scaling considerations for a stateful push layer, reconnect/
backoff handling on the client).

**Shape of the change, if picked up:** the natural seam is
`lib/services/cricket/cricketService.js` — `getMatches()`/`getMatchDetail()`
already centralize "what's the current data," so a push layer would
subscribe to cache updates there rather than requiring route-level changes
to how the data itself is fetched/normalized/cached.
