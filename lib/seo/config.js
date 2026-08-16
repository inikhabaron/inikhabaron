/**
 * Central SEO / site configuration.
 *
 * Every SEO helper (metadata, JSON-LD, sitemaps, robots, RSS) reads from this
 * single source of truth so the site identity stays consistent everywhere.
 *
 * Production origin is https://www.inikhabaron.com. It can be overridden per
 * environment with NEXT_PUBLIC_SITE_URL (useful for preview deployments).
 */

import { SOCIAL_LINKS } from '@/lib/constants/social-links';

// A localhost/loopback value in NEXT_PUBLIC_SITE_URL is only ever correct for
// local dev — if it leaks into a production build (as it did: og:url and the
// canonical tag were both rendering http://localhost:3000 on live traffic),
// every shared link's metadata points at an address nobody but the developer
// can reach. Since NEXT_PUBLIC_* vars are baked in at build time, there's no
// way to catch this at request time — so localhost is rejected outright here
// rather than trusted just because it "looks like" a URL.
const isLocalhost = (url) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(url || '');

// Normalise: never keep a trailing slash on the origin.
const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL
    && process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')
    && !isLocalhost(process.env.NEXT_PUBLIC_SITE_URL)
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'https://www.inikhabaron.com';

export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, '');

export const SITE = {
  name: 'INI KhabarON',
  shortName: 'KhabarON',
  legalName: 'INI KhabarON',
  url: SITE_URL,
  // Tagline used as the default description on generic pages.
  description:
    'INI KhabarON delivers the latest news across politics, business, sports, entertainment, technology, science and spirituality — in Hindi and English.',
  // Default social share image (absolute URL required by OG/Twitter).
  defaultImage: `${SITE_URL}/khabaron-logo2.png`,
  logo: `${SITE_URL}/khabaron-logo2.png`,
  // 60x60+ square logo recommended by Google for Organization / publisher.
  logoWidth: 512,
  logoHeight: 512,
  locale: 'en_IN',
  localeAlt: ['hi_IN'],
  language: 'en',
  // Geo signals for local/news relevance.
  geo: {
    country: 'IN',
    countryName: 'India',
    placename: 'India',
    region: 'IN',
  },
  // Publisher social profiles — used for Organization sameAs (E-E-A-T).
  // Sourced from lib/constants/social-links.js, the single source of truth.
  social: SOCIAL_LINKS,
  contactEmail: 'arthvrukshitteam@gmail.com',
};

// sameAs list for Organization / WebSite schema.
export const SOCIAL_PROFILES = [
  SITE.social.twitter,
  SITE.social.facebook,
  SITE.social.instagram,
  SITE.social.youtube,
].filter(Boolean);

// Search-engine verification tokens (set these in Vercel env, then re-deploy).
export const VERIFICATION = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '',
  yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION || '',
};

// SEO length limits (characters) used to auto-optimise titles/descriptions.
export const SEO_LIMITS = {
  titleMax: 60,
  titleMaxWithSuffix: 70,
  descriptionMin: 70,
  descriptionMax: 160,
};

/** Build an absolute URL from a path. */
export function absoluteUrl(path = '/') {
  if (!path) return SITE_URL;
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Canonical URL for a single article. */
export function articleUrl(article) {
  if (!article) return SITE_URL;
  return `${SITE_URL}/news/${article.id}`;
}

/** Canonical URL for a category listing. */
export function categoryUrl(slug) {
  return `${SITE_URL}/category/${slug}`;
}

/** Canonical URL for an author page. */
export function authorUrl(id) {
  return `${SITE_URL}/author/${id}`;
}
