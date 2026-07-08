import { getRecentReadingHistory } from '@/lib/services/readingProgress/readingProgressService';
import { saveUserInterests } from './userInterestService';

function sortScores(scoreMap) {
  return Object.entries(scoreMap)
    .map(([name, score]) => ({
      name,
      score,
    }))
    .sort((a, b) => b.score - a.score);
}

export function createEmptyInterests() {
  return {
    categories: [],
    authors: [],
    cities: [],
    languages: [],
    tags: [],
  };
}

export async function getUserInterests(userId) {
  if (!userId) {
    return {
      categories: [],
      authors: [],
      cities: [],
      languages: [],
      tags: [],
    };
  }

  const articles = await getRecentReadingHistory({
    userId,
    limit: 50,
  });

  const categoryScores = {};
  const authorScores = {};
  const cityScores = {};
  const languageScores = {};
  const tagScores = {};

  for (const article of articles) {
    // Category
    if (article.category) {
      categoryScores[article.category] =
        (categoryScores[article.category] || 0) + 1;
    }

    // Author
    if (article.author) {
      authorScores[article.author] =
        (authorScores[article.author] || 0) + 1;
    }

    // City
    const city = article.location?.city;

    if (city) {
      cityScores[city] =
        (cityScores[city] || 0) + 1;
    }

    // Language
    if (article.language) {
      languageScores[article.language] =
        (languageScores[article.language] || 0) + 1;
    }

    // Recommendation Tags
    if (Array.isArray(article.recommendationTags)) {
      for (const tag of article.recommendationTags) {
        tagScores[tag] =
          (tagScores[tag] || 0) + 1;
      }
    }
  }

  return {
    categories: sortScores(categoryScores),
    authors: sortScores(authorScores),
    cities: sortScores(cityScores),
    languages: sortScores(languageScores),
    tags: sortScores(tagScores),
  };
}

export async function refreshUserInterests(userId) {
  if (!userId) {
    return createEmptyInterests();
  }

  const interests = await getUserInterests(userId);

  await saveUserInterests(
    userId,
    interests
  );

  return interests;
}