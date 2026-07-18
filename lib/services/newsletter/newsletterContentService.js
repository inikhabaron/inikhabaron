import {
  getLatestArticles,
  getBreakingArticles,
  getFeaturedArticles,
  getTopViewedArticles,
  getArticle,
} from '@/lib/seo/data';

/**
 * Builds the article lists for the monthly digest. Sections are deduped so
 * the same article isn't repeated across Breaking/Top/Featured/Latest —
 * whichever section it qualifies for first (in that priority order) keeps it.
 */
export async function buildMonthlyContent() {
  const [breaking, topStories, featured, latest] = await Promise.all([
    getBreakingArticles({ limit: 3 }),
    getTopViewedArticles({ limit: 5 }),
    getFeaturedArticles({ limit: 4 }),
    getLatestArticles({ limit: 6 }),
  ]);

  const seen = new Set();
  const dedupe = (list) => list.filter((article) => {
    if (seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  });

  return {
    breaking: dedupe(breaking),
    topStories: dedupe(topStories),
    featured: dedupe(featured),
    latest: dedupe(latest),
  };
}

/**
 * Builds the article list for a breaking-news alert — either a specific
 * article (articleId) or, absent that, the current breaking-news set.
 */
export async function buildBreakingContent({ articleId } = {}) {
  if (articleId) {
    const article = await getArticle(articleId);
    return { articles: article ? [article] : [] };
  }
  const articles = await getBreakingArticles({ limit: 3 });
  return { articles };
}
