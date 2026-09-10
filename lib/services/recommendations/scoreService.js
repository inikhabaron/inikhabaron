export const RECOMMENDATION_WEIGHTS = Object.freeze({
  CATEGORY: 40,
  AUTHOR: 35,
  CITY: 30,
  LANGUAGE: 20,
  TAG: 15,
  TRENDING: 15,
  BREAKING: 10,
  EDITOR: 1,

  // Follow (explicit signals — see components/follow)
  FOLLOWED_CATEGORY: 35,
  FOLLOWED_AUTHOR: 30,
  FOLLOWED_CITY: 25,
  FOLLOWED_TAG: 10,
});

export function calculateRecommendationScore(
  article,
  interests,
  follows = {}
) {
  const followedCategories = follows.followedCategories || [];
  const followedAuthors = follows.followedAuthors || [];
  const followedCities = follows.followedCities || [];
  // Lowercased tag *names* (see followedTagsService) — followedTags on the
  // user document stores tag ids, but article.tags is free text with no id,
  // same mismatch Topic Follow already solved this way (docs/mvp3-phase1-architecture.md).
  const followedTagNames = follows.followedTagNames || [];

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

  // Author — matched by display name (authorName), not the never-populated
  // legacy `article.author` field. Soft/fuzzy like Topic Follow's tag
  // matching: this is "you often read this byline," a weaker implicit
  // signal than FOLLOWED_AUTHOR below, which correctly matches by authorId.
  const articleAuthor = article.authorName;

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

  // Tags — reuses the same free-text article.tags Topic Follow uses.
  // (article.recommendationTags was a separate, never-populated field.)
  if (
    Array.isArray(article.tags)
  ) {
    for (const tag of article.tags) {
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

  // Followed tag (Topic Follow) — case-insensitive name match, same
  // tolerance NewsClient.js's tagsByName/followingTagIds and getArticlesByTag
  // already use, since article.tags has no foreign key into the tags
  // collection that followedTags ids resolve to.
  if (Array.isArray(article.tags) && followedTagNames.length) {
    const followedTagMatch = article.tags.find(
      (tag) => typeof tag === 'string' && followedTagNames.includes(tag.trim().toLowerCase())
    );

    if (followedTagMatch) {
      score += RECOMMENDATION_WEIGHTS.FOLLOWED_TAG;

      matches.push({
        type: 'followedTag',
        value: followedTagMatch,
        weight: RECOMMENDATION_WEIGHTS.FOLLOWED_TAG,
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

  // Followed category
  if (article.category && followedCategories.includes(article.category)) {
    score += RECOMMENDATION_WEIGHTS.FOLLOWED_CATEGORY;

    matches.push({
      type: 'followedCategory',
      value: article.category,
      weight: RECOMMENDATION_WEIGHTS.FOLLOWED_CATEGORY,
    });
  }

  // Followed author
  if (article.authorId && followedAuthors.includes(article.authorId)) {
    score += RECOMMENDATION_WEIGHTS.FOLLOWED_AUTHOR;

    matches.push({
      type: 'followedAuthor',
      value: article.authorName || articleAuthor,
      weight: RECOMMENDATION_WEIGHTS.FOLLOWED_AUTHOR,
    });
  }

  // Followed city (matched against the article's district/state name —
  // the same value stored in users.followedCities by the Follow module)
  const followedCityMatch = [article.location?.districtName, article.location?.stateName].find(
    name => name && followedCities.includes(name)
  );

  if (followedCityMatch) {
    score += RECOMMENDATION_WEIGHTS.FOLLOWED_CITY;

    matches.push({
      type: 'followedCity',
      value: followedCityMatch,
      weight: RECOMMENDATION_WEIGHTS.FOLLOWED_CITY,
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