import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

const DEFAULT_RECOMMENDATION_LIMIT = 500;

export async function getRecommendationArticle(articleId) {
  const newsCollection = await getCollection(COLLECTIONS.NEWS);

  return await newsCollection.findOne(
    {
      id: articleId,
      status: 'published',
    },
    {
      projection: {
        _id: 0,
        id: 1,
        title: 1,
        category: 1,
        author: 1,
        location: 1,
        isTrending: 1,
        isBreaking: 1,
        recommendationTags: 1,
      },
    }
  );
}

export async function getRecommendationArticles({
  limit = DEFAULT_RECOMMENDATION_LIMIT,
} = {}) {
  const newsCollection = await getCollection(COLLECTIONS.NEWS);

  return await newsCollection
    .find(
      {
        status: 'published',
        publishedAt: {
            $lte: new Date(),
        },
      },
      {
        projection: {
          _id: 0,

          // Identity
          id: 1,
          slug: 1,

          // Display
          title: 1,
          excerpt: 1,
          featuredImage: 1,

          // Recommendation
          category: 1,
          author: 1,
          authorId: 1,
          location: 1,
          language: 1,
          recommendationTags: 1,
          isTrending: 1,
          isBreaking: 1,

          // Ranking
          publishedAt: 1,
          views: 1,
        },
      }
    )
    .sort({
      publishedAt: -1,
    })
    .limit(limit)
    .toArray();
}