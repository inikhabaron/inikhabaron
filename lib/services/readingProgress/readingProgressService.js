import { getReadingProgressCollection } from '@/lib/db/readingProgress';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { refreshUserInterests } from '@/lib/services/recommendations/interestService';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const MIN_RECOMMENDATION_SCROLL_PERCENT = 70;

function normalizeArticleId(articleId) {
  return String(articleId).trim();
}

export function normalizeReadingProgress({
  scrollY = 0,
  scrollPercent = 0,
}) {
  return {
    scrollY: Math.max(0, Number(scrollY) || 0),
    scrollPercent: Math.max(
      0,
      Math.min(100, Number(scrollPercent) || 0)
    ),
  };
}

export function isReadingComplete(scrollPercent) {
  return Number(scrollPercent) >= 95;
}

export async function saveReadingProgress({
  userId,
  articleId,
  scrollY,
  scrollPercent,
}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!articleId) {
    throw new Error('Article ID is required');
  }

  const collection = await getReadingProgressCollection();

  const normalizedArticleId = normalizeArticleId(articleId);

  const now = new Date();

  const progress = normalizeReadingProgress({ scrollY, scrollPercent, });

  const existingProgress = await collection.findOne(
    {
        userId,
        articleId: normalizedArticleId,
    },
    {
        projection: {
        _id: 0,
        scrollPercent: 1,
        },
    }
  );

  await collection.updateOne(
    {
        userId,
        articleId: normalizedArticleId,
    },
    {
        $set: {
        ...progress,
        updatedAt: now,
        },
        $setOnInsert: {
        createdAt: now,
        },
    },
    {
        upsert: true,
    }
  );

  const previousScroll =
    Number(existingProgress?.scrollPercent || 0);

  const crossedRecommendationThreshold =
    previousScroll < MIN_RECOMMENDATION_SCROLL_PERCENT &&
    progress.scrollPercent >= MIN_RECOMMENDATION_SCROLL_PERCENT;

  if (crossedRecommendationThreshold) {
    refreshUserInterests(userId).catch(error => {
      console.error('Failed to refresh user interests:', error);
    });
  }

  return {
    success: true,
  };
}

export async function getReadingProgress({
  userId,
  articleId,
}) {
  if (!userId || !articleId) {
    return null;
  }

  const collection = await getReadingProgressCollection();

  return collection.findOne(
    {
      userId,
      articleId: normalizeArticleId(articleId),
    },
    {
      projection: {
        _id: 0,
        scrollY: 1,
        scrollPercent: 1,
        updatedAt: 1,
      },
    }
  );
}

export async function deleteReadingProgress({
  userId,
  articleId,
}) {
  if (!userId || !articleId) {
    return false;
  }

  const collection = await getReadingProgressCollection();

  const result = await collection.deleteOne({
    userId,
    articleId: normalizeArticleId(articleId),
  });

  return result.deletedCount > 0;
}

export async function getContinueReading({
  userId,
  limit = DEFAULT_LIMIT,
}) {
  if (!userId) {
    return [];
  }

  const collection = await getReadingProgressCollection();
  const newsCollection = await getCollection(COLLECTIONS.NEWS);

  const safeLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const progress = await collection
    .find({
      userId,
    })
    .sort({
      updatedAt: -1,
    })
    .limit(safeLimit)
    .toArray();

  if (progress.length === 0) {
    return [];
  }

  const articleIds = progress.map(item => item.articleId);

  const articles = await newsCollection.find(
      {
        id: {
            $in: articleIds,
        },
        status: 'published',
      },
      {
        projection: {
            _id: 0,
            id: 1,
            title: 1,
            slug: 1,
            featuredImage: 1,
            excerpt: 1,
            category: 1,
            publishedAt: 1,
            author: 1,
            views: 1,
        },
      }
  ).toArray();

  const articleMap = new Map(
    articles.map(article => [article.id, article])
  );

  return progress
    .map(item => {
      const article = articleMap.get(item.articleId);

      if (!article) {
        return null;
      }

      return {
        article,
        scrollY: item.scrollY,
        scrollPercent: item.scrollPercent,
        updatedAt: item.updatedAt,
      };
    })
    .filter(Boolean);
}

export async function getRecentReadingHistory(
{
  userId,
  limit = 50,
}) {
  if (!userId) {
    return [];
  }

  const collection = await getReadingProgressCollection();
  const newsCollection = await getCollection(COLLECTIONS.NEWS);

  const progress = await collection
    .find({
      userId,
      scrollPercent: {
        $gte: MIN_RECOMMENDATION_SCROLL_PERCENT,
      },
    })
    .sort({
      updatedAt: -1,
    })
    .limit(Math.max(Number(limit) || 50, 1))
    .toArray();

  if (progress.length === 0) {
    return [];
  }

  const articleIds = progress.map(item => item.articleId);

  const articles = await newsCollection.find(
    {
      id: {
        $in: articleIds,
      },
      status: 'published',
    },
    {
      projection: {
        _id: 0,
        id: 1,
        category: 1,
        author: 1,
        location: 1,
        recommendationTags: 1,
        language: 1,
      },
    }
  ).toArray();

  const articleMap = new Map(
    articles.map(article => [article.id, article])
  );

  return progress
    .map(item => articleMap.get(item.articleId))
    .filter(Boolean);
}