import { createEmptyInterests, refreshUserInterests, } from './interestService';
import { getStoredUserInterests, } from './userInterestService';
import { calculateRecommendationScore, } from './scoreService';
import { getRecommendationArticles, } from './articleService';

function shouldRefreshInterests(interests) {
  if (!interests?.updatedAt) {
    return true;
  }

  const age =
    Date.now() - new Date(interests.updatedAt).getTime();

  return age > 1000 * 60 * 60 * 24;
}

function diversifyFeed(articles) {
  if (articles.length <= 2) {
    return articles;
  }

  const remaining = [...articles];
  const diversified = [];

  while (remaining.length > 0) {
    const lastCategory =
      diversified.at(-1)?.category;

    let index = remaining.findIndex(
      article => article.category !== lastCategory
    );

    if (index === -1) {
      index = 0;
    }

    diversified.push(
      remaining.splice(index, 1)[0]
    );
  }

  return diversified;
}

function paginate(items, page, limit) {
  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.max(Number(limit) || 20, 1);

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    page: currentPage,
    limit: pageSize,
    total: items.length,
    totalPages: Math.ceil(items.length / pageSize),
    items: items.slice(start, end),
  };
}

export async function getPersonalizedFeed({
  userId,
  page = 1,
  limit = 20,
}) {
  let interests = createEmptyInterests();

  if (userId) {
    interests = await getStoredUserInterests(userId);

    if (!interests || shouldRefreshInterests(interests)) {
      interests = await refreshUserInterests(userId);
    }
  }

  const articles = await getRecommendationArticles();

  const scoredArticles = articles
    .map(article => {
        const recommendation =
            calculateRecommendationScore(
                article,
                interests
            );

        return {
            ...article,
            recommendationScore: recommendation.score,
            recommendationMatches:
                recommendation.matches,
        };
    })
    .sort((a, b) => {
        if (
            b.recommendationScore !==
            a.recommendationScore
        ) {
            return (
                b.recommendationScore -
                a.recommendationScore
            );
        }

        return (
            new Date(b.publishedAt) -
            new Date(a.publishedAt)
        );
    });

    const diversifiedArticles =
        diversifyFeed(scoredArticles);

  return paginate(
    diversifiedArticles,
    page,
    limit
  );
}