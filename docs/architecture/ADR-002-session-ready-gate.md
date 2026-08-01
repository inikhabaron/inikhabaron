# ADR-002: `sessionReady` gates authenticated requests, `user` gates the UI

- **Status:** Accepted
- **Date:** 2026-08-01
- **Applies to:** every client component or hook that fetches an authenticated API
- **Source of truth:** `components/providers/SiteChromeProvider.jsx`

## The rule

> **Every automatic authenticated fetch must be gated on `sessionReady`, never on `user` alone.**

"Automatic" means it fires without a user gesture — a `useEffect`, a hook that runs on mount, anything keyed on auth state. Click handlers are exempt: by the time someone clicks, the session exists.

## Why this exists

Firebase auth state and the server session are two different facts that become true at different times:

```
onAuthStateChanged fires        → Firebase says "signed in"
       ↓  (network round trip)
POST /api/auth/session → 200    → httpOnly khabaron_session cookie now exists
```

Every authenticated API route checks the **cookie** (via `requireUser()` → `getCurrentUser()`), not Firebase. So a fetch issued between those two moments is unauthenticated and returns **401**.

Before this gate existed, `SiteChromeProvider` published `user` immediately and eight consumers fired at once — bookmarks, follows, location, like status, reading progress — all before the cookie was written. Every one 401'd.

It was hard to spot because it **only reproduces when the cookie is genuinely absent**: a first sign-in, cleared cookies, or a lapsed 7-day expiry. On a normal reload the previous cookie is still valid, everything returns 200, and the bug is invisible. It also gets *worse* on slow connections, where the window is wider.

## Which one to use

| | `user` | `sessionReady` |
|---|---|---|
| Means | Firebase says someone is signed in | the `khabaron_session` cookie exists |
| Available | immediately on auth state change | after `POST /api/auth/session` returns 2xx |
| Use for | UI — avatar, menus, "sign in" vs "sign out", **login prompts on click** | **any automatic authenticated fetch** |

Both come from `useSiteChrome()` / `SiteChromeContext`.

**Use `user`** when the question is "should the UI look signed in?" It is published immediately on purpose, so sign-in feels instant.

**Use `sessionReady`** when the question is "will an authenticated request succeed?"

They are deliberately separate. Delaying `user` until the cookie exists would also delay the avatar and menus; gating a click handler on `sessionReady` would make a fast click answer "please sign in" to someone who *is* signed in.

## How to gate

Three shapes, all already in the codebase — copy the nearest one rather than inventing a fourth.

**1. Effect in a page/component**
```js
useEffect(() => {
  if (!user || !sessionReady) return;
  fetch('/api/users/following', { credentials: 'include' })…
}, [user, sessionReady]);   // sessionReady MUST be in deps
```

**2. Hook that takes the user**
```js
// Pass null until the cookie exists; the hook's own !user guard does the rest.
useBookmarkedIds(sessionReady ? user : null);
```

**3. Component that also needs `user` for a login prompt**
```jsx
// Separate props: `user` drives the prompt, `sessionReady` drives the fetch.
<LikeButton user={user} sessionReady={sessionReady} … />
```

### The dependency-array trap

If an effect *reads* `sessionReady`, it must *list* it. This is wrong:

```js
useEffect(() => {
  if (!user || !sessionReady) return;
  …
}, [user]);              // ✗ won't re-run when sessionReady flips false → true
```

It doesn't 401 — it does something worse. The effect runs once while the gate is shut, returns early, and never runs again. The request is **skipped**, not deferred, and the feature silently shows empty state. This shipped briefly during the original fix and only appeared to work because a second `setUser` call happened to re-trigger the effect.

## Currently gated

`/api/users/following` (HomeClient, my-city, NewsClient) · `/api/users/bookmarks/ids` (HomeClient, live, NewsClient) · `/api/users/location` (LocationDetectPrompt) · `/api/news/{id}/like` (LikeButton) · `/api/users/reading-progress/*` (useReadingProgress, via its `enabled` prop)

## Deliberately not gated

- **Click handlers** — bookmark/like toggles, comment submit, follow. They run long after login.
- **Mount-only page fetches** with `deps: []` — `settings`, `following`, `saved`, `my-city`'s feed. These fire on navigation, not on auth state, so they cannot race a login. They render an auth-required state on 401.
- **Routes that read `getCurrentUser()` but never 401** — `/api/news/personalized`, `/api/news/{id}/why`. They degrade to generic results for anonymous callers.

## Adding a new authenticated feature

1. Does it fetch automatically? If no, use `user` and stop.
2. If yes, gate it on `sessionReady` using one of the three shapes above.
3. Put `sessionReady` in the dependency array.
4. Test on a **cold** login: fresh incognito, cleared cookies, throttled network. A signed-in reload will not reproduce this class of bug.

## Related

- `lib/auth/sessionTiming.js` — dev-only timing marks for the login → session → first-request sequence. Filter the console on `[session]`. Stripped from production builds.
- [ADR-001](./ADR-001-editorial-delivery-separation.md) — same underlying principle on the server: a dependency that is fine in one place is dangerous in another, and boundaries need enforcing rather than remembering.
