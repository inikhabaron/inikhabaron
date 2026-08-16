// Single source of truth for INI KhabarON's official social profile URLs.
// Referenced directly by UI components that render social icons (header,
// footer) and by lib/seo/config.js (SITE.social) for JSON-LD `sameAs` and
// Twitter card metadata — never hardcode one of these URLs elsewhere.
export const SOCIAL_LINKS = Object.freeze({
  youtube: 'https://www.youtube.com/@IniKhabaron',
  instagram: 'https://www.instagram.com/inikhabaron/',
  facebook: 'https://www.facebook.com/profile.php?id=61593122082730',
  twitter: 'https://x.com/INIkhabaron',
  twitterHandle: '@INIkhabaron',
});
