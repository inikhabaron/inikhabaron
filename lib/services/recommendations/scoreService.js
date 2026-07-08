export const RECOMMENDATION_WEIGHTS = Object.freeze({
  CATEGORY: 40,
  AUTHOR: 35,
  CITY: 30,
  LANGUAGE: 20,
  TAG: 15,
  TRENDING: 15,
  BREAKING: 10,
  EDITOR: 1,
});

export function calculateRecommendationScore(
  article,
  interests
) {
  let score = 0;

  const matches = [];

  // Category
  const categoryInterest = interests.categories.find(
    item => item.name === article.category
  );

  if (categoryInterest) {
    const weight =
      RECOMMENDATION_WEIGHTS.CATEGORY +
      categoryInterest.score;

    score += weight;

    matches.push({
      type: 'interest',
      value: article.category,
      weight,
    });
  }

  // Author
  const articleAuthor = article.author || article.authorId;

  const authorInterest = interests.authors.find(
    item => item.name === articleAuthor
  );

  if (authorInterest) {
    const weight =
      RECOMMENDATION_WEIGHTS.AUTHOR +
      authorInterest.score;

    score += weight;

    matches.push({
      type: 'author',
      value: articleAuthor,
      weight,
    });
  }

  // City
  const articleCity = article.location?.city;

  const cityInterest = interests.cities.find(
    item => item.name === articleCity
  );

  if (cityInterest) {
    const weight =
      RECOMMENDATION_WEIGHTS.CITY +
      cityInterest.score;

    score += weight;

    matches.push({
      type: 'city',
      value: articleCity,
      weight,
    });
  }

  // Language
  const languageInterest = interests.languages.find(
    item => item.name === article.language
  );

  if (languageInterest) {
    const weight =
      RECOMMENDATION_WEIGHTS.LANGUAGE +
      languageInterest.score;

    score += weight;

    matches.push({
      type: 'language',
      value: article.language,
      weight,
    });
  }

  // Recommendation Tags
  if (
    Array.isArray(article.recommendationTags)
  ) {
    for (const tag of article.recommendationTags) {
      const tagInterest = interests.tags.find(
        item => item.name === tag
      );

      if (!tagInterest) {
        continue;
      }

      const weight =
        RECOMMENDATION_WEIGHTS.TAG +
        tagInterest.score;

      score += weight;

      matches.push({
        type: 'tag',
        value: tag,
        weight,
      });
    }
  }

  // Trending
  if (article.isTrending) {
    score += RECOMMENDATION_WEIGHTS.TRENDING;

    matches.push({
      type: 'trending',
      weight:
        RECOMMENDATION_WEIGHTS.TRENDING,
    });
  }

  // Breaking
  if (article.isBreaking) {
    score += RECOMMENDATION_WEIGHTS.BREAKING;

    matches.push({
      type: 'breaking',
      weight:
        RECOMMENDATION_WEIGHTS.BREAKING,
    });
  }

  // Editor Pick
  if (matches.length === 0) {
    score = RECOMMENDATION_WEIGHTS.EDITOR;

    matches.push({
      type: 'editor',
      weight:
        RECOMMENDATION_WEIGHTS.EDITOR,
    });
  }

  return {
    score,
    matches,
  };
}