// import { COLLECTIONS } from '@/lib/constants/collections';
// import { getDbCollection } from '@/lib/db/getDbCollection';
import {  createEmptyInterests, refreshUserInterests } from './interestService';
import { getStoredUserInterests, } from './userInterestService';
import { calculateRecommendationScore, } from './scoreService';

function shouldRefreshInterests(interests) {
    if (!interests?.updatedAt) {
        return true;
    }

    const age =
        Date.now() - new Date(interests.updatedAt).getTime();

    return age > 1000 * 60 * 60 * 24; // 24 hours
}

export async function getRecommendationReasons(user, article) {
  if (!article) {
    return [];
  }

//   const reasons = [];

  let interests = createEmptyInterests();

  if (user?.id) {
    interests = await getStoredUserInterests(user.id);

    if (!interests || shouldRefreshInterests(interests)) {
        interests = await refreshUserInterests(user.id);
    }
  }

  const { matches } = calculateRecommendationScore(
    article,
    interests
  );

   const reasons = matches.map(match => {
    switch (match.type) {
        case 'interest':
            return {
                type: 'interest',
                title: match.value,
                score: match.weight,
                message: `You frequently read ${match.value} news.`,
            };

        case 'author':
            return {
                type: 'author',
                title: match.value,
                score: match.weight,
                message: 'You frequently read articles from this author.',
            };

        case 'city':
            return {
                type: 'city',
                title: match.value,
                score: match.weight,
                message: `You often read news from ${match.value}.`,
            };

        case 'language':
            return {
                type: 'language',
                title: match.value,
                score: match.weight,
                message: 'This article matches your preferred language.',
            };

        case 'tag':
            return {
                type: 'tag',
                title: match.value,
                score: match.weight,
                message: `You've shown interest in ${match.value}.`,
            };

        case 'trending':
            return {
                type: 'trending',
                title: 'Trending',
                score: match.weight,
                message: 'This article is trending today.',
            };

        case 'breaking':
            return {
                type: 'breaking',
                title: 'Breaking',
                score: match.weight,
                message: 'This is breaking news.',
            };

        case 'editor':
        default:
            return {
                type: 'editor',
                title: "Editor's Pick",
                score: match.weight,
                message:
                'Recommended by our editors while we learn your interests.',
            };
    }
  });

  return reasons.sort((a, b) => b.score - a.score);
}