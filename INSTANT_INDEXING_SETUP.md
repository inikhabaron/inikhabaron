# Instant Indexing — Setup Guide

Your site now pings search engines the moment a story is published, updated, or
auto-published from a schedule — so it gets crawled in **minutes instead of
hours**. This is the biggest technical lever for being credited as the *original
source* on breaking news.

Two channels are wired in, both **fire-and-forget** (they never slow down or
break publishing) and both **disabled until you add the env vars** — so it's safe
to deploy first and turn them on afterward.

- **Google Indexing API** → Google (Search + News crawl priority)
- **IndexNow** → Bing, Yandex, Seznam, Naver (and Microsoft Copilot)

It fires automatically from: publish, approve-to-publish, create-as-published,
and scheduled auto-publish. No editor action needed.

---

## Part A — Google Indexing API (≈10 min, one time)

1. Go to **Google Cloud Console** → create/select a project.
2. **APIs & Services → Library →** search **"Indexing API" → Enable**.
3. **APIs & Services → Credentials → Create credentials → Service account.**
   Give it a name (e.g. `indexing-bot`), create it.
4. Open the service account → **Keys → Add key → Create new key → JSON**. A JSON
   file downloads. Open it — you need two values: `client_email` and
   `private_key`.
5. In **Google Search Console** (search.google.com/search-console) →
   **Settings → Users and permissions → Add user** → paste the service account's
   `client_email` → role **Owner**. (This authorizes it to submit your URLs.)
6. In **Vercel → inikhabar → Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `GOOGLE_INDEXING_CLIENT_EMAIL` | the `client_email` from the JSON |
   | `GOOGLE_INDEXING_PRIVATE_KEY` | the `private_key` from the JSON (paste the whole thing, including `-----BEGIN…END-----`) |

   > Paste the private key exactly. If Vercel shows it on one line with `\n` in
   > it, that's fine — the code converts `\n` back to real line breaks.

7. Redeploy. Done — the next published article is submitted to Google
   automatically.

---

## Part B — IndexNow (≈2 min, one time)

1. Pick any random key — 8 to 128 hex characters (e.g. a UUID without dashes:
   `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`).
2. In **Vercel → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `INDEXNOW_KEY` | your chosen key |

3. Redeploy. The key is auto-served at
   `https://www.inikhabaron.com/indexnow-key.txt` (the code handles this), which
   is how Bing/Yandex verify you own the site. Nothing else to host.

---

## How to confirm it's working
- After a deploy with the keys set, publish (or re-save) a test article.
- **Google:** Search Console → **URL Inspection** → paste the article URL → you
  should see it gets crawled quickly; the Indexing API usage also shows under the
  API's Cloud Console metrics.
- **IndexNow:** visit `https://www.inikhabaron.com/indexnow-key.txt` — it should
  show your key. Bing Webmaster Tools → **IndexNow** shows submitted URLs.

## Notes / honest caveats
- Google officially scopes the Indexing API to JobPosting/BroadcastEvent; in
  practice it also prompts fast crawling of news URLs and is widely used for this.
  It requests a crawl — it does **not guarantee** ranking or even indexing.
- Instant indexing helps you get **discovered and time-stamped first**. Actually
  outranking national outlets still depends on original reporting, Google News
  approval, author E-E-A-T, and backlinks over time.
- Both integrations stay dormant (safe no-ops) until the env vars exist, so
  nothing breaks if you deploy before configuring them.
