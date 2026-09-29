# SEO — what code can't do for you

Changes shipped in the SEO pass (Phases 1–3) are described in git history. This file lists the things that need a person.

## Google Search Console
1. Add the property (`https://www.inikhabaron.com`) and verify it — set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel and redeploy.
2. Submit **`/sitemap.xml`** (now a sitemap *index* → `/sitemaps/pages.xml` + `/sitemaps/articles/N`) and **`/news-sitemap.xml`**.
3. Remove the old `/image-sitemap.xml` submission (it now 301-redirects; images live inside the article sitemaps).
4. Watch *Pages → Why pages aren't indexed*, *Core Web Vitals* and *Enhancements* (Breadcrumbs, Articles) for the first 2–4 weeks.

## Google News Publisher Center
Register the publication, add the site URL, and submit `/news-sitemap.xml`. Needs real About/Contact pages and named authors (already routed at `/about`, `/contact`, `/author/[id]`).

## Env vars (Vercel)
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION` (optional), `INDEXNOW_KEY`.

## Note on the Google Indexing API
`INSTANT_INDEXING_SETUP.md` Part A submits news URLs to the Google Indexing API. Google documents that API as supported only for JobPosting and livestream (BroadcastEvent) pages, so it should not be relied on for articles. For Google, discovery of news comes from the news sitemap; IndexNow (Bing/Yandex) is fine.

## Content / editorial (not code)
- Real author bios and photos; a named editor / editorial address on About.
- Write a unique `seoTitle` / `seoDescription` for important stories (the fallback is auto-generated from title and excerpt).
- Original images at least 1,200px wide (Discover requirement).
- Corrections policy actually followed; visible "Updated" times when a story changes materially.

## Deferred / not done
- **Per-article `<html lang>`**: the root layout is shared by all pages; needs a layout split.
- **Scheduled publishing runs once daily** (`vercel.json` cron `0 4 * * *`). More frequent runs need a Vercel plan that allows it, or an external scheduler hitting `/api/cron/auto-publish`.
- **Core Web Vitals**: only font preloading was trimmed. Measure with PageSpeed Insights before deeper work (AdSense, GA and client-rendered homepage JS are the likely costs).

## Article URLs (Phase 4)
Canonical form is `/news/<title-slug>-<uuid>` (`lib/seo/slug.js`). The uuid is the lookup key, so no DB migration or slug field is needed; the slug is derived from the current title. Old `/news/<uuid>` links and stale slugs 308-redirect to the canonical URL. Hindi headlines keep Devanagari in the slug (capped at 40 chars; percent-encoded in sitemaps/canonicals).

After deploying: in Search Console, re-submit `/sitemap.xml` and `/news-sitemap.xml` and use *URL inspection* on one old and one new article URL. Expect Google to re-crawl the old URLs over weeks; keep the redirects permanently.

Not wired: `pingArticle()` (IndexNow / Google Indexing API, `lib/services/seo/searchPing.js`) has no callers in the code, despite `INSTANT_INDEXING_SETUP.md` saying it fires on publish. Wiring IndexNow into the publish routes is a small follow-up.
