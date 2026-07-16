import { SITE_URL } from '@/lib/seo/config';

/**
 * Dynamic robots.txt (Next.js Metadata Route).
 *
 * Policy: allow all mainstream search + AI crawlers full access to editorial
 * content (this is a publisher — we WANT to be indexed and cited by AI search),
 * while blocking private/app surfaces (admin, api, auth, bookmarks, personal
 * feeds). Search-result URLs (?search=) are disallowed to avoid thin/dup pages.
 */
export default function robots() {
  const disallow = [
    '/admin',
    '/admin/',
    '/api/',
    '/bookmarks',
    '/personalized',
    '/api-docs',
    '/*?search=',
  ];

  // Well-behaved bots we explicitly welcome (search + AI answer engines).
  const goodBots = [
    'Googlebot',
    'Googlebot-News',
    'Googlebot-Image',
    'Bingbot',
    'Slurp',
    'DuckDuckBot',
    'Applebot',
    'Applebot-Extended',
    'Amazonbot',
    'YandexBot',
    'Baiduspider',
    // AI / answer engines — allowed so our journalism can be surfaced & cited.
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-Web',
    'anthropic-ai',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'CCBot',
    'Meta-ExternalAgent',
    'Bytespider',
  ];

  const rules = [
    // Default rule for everything else.
    { userAgent: '*', allow: '/', disallow },
    // Explicit allow rules keep the good bots unambiguous.
    ...goodBots.map((ua) => ({ userAgent: ua, allow: '/', disallow })),
  ];

  return {
    rules,
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/news-sitemap.xml`,
      `${SITE_URL}/image-sitemap.xml`,
    ],
    host: SITE_URL,
  };
}
