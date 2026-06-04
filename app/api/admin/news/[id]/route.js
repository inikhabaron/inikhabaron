import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/token';
import {
  canEditArticle,
  canSuggestBreaking,
  canMarkBreaking,
  canApproveTrending,
  canSubmitForReview,
  canApproveArticle,
  canPublishArticle,
  normalizeStatus,
} from '@/lib/auth/permissions';

export const OPTIONS = preflight;

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const user = await getUserFromToken(request);
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newsId = params.id;
    const newsCollection = await getCollection('news');
    const article = await newsCollection.findOne({ id: newsId });

    if (!article) {
      return json({ error: 'Article not found' }, { status: 404 });
    }

    if (!canEditArticle(user, article)) {
      return json({ error: 'Cannot edit this article' }, { status: 403 });
    }

    const previousVersion = {
      id: uuidv4(),
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      category: article.category,
      tags: article.tags,
      featuredImage: article.featuredImage,
      status: article.status,
      isBreaking: article.isBreaking,
      editedBy: user.id,
      editedByName: user.name,
      editedAt: new Date(),
    };

    const updateData = { ...body, updatedAt: new Date() };

    if (Array.isArray(body.tags)) {
      const category = body.category ?? article.category;
      updateData.tags = body.tags.filter(
        tag => tag?.toLowerCase() !== category?.toLowerCase()
      );
    }

    if (body.breakingSuggested !== undefined) {
      if (!canSuggestBreaking(user)) {
        return json({ error: 'Cannot suggest breaking news' }, { status: 403 });
      }
      updateData.breakingSuggested = body.breakingSuggested;
      updateData.breakingApproved = false;
    }

    if (body.isBreaking !== undefined) {
      if (!canMarkBreaking(user)) {
        return json({ error: 'Only admin can mark articles as breaking news' }, { status: 403 });
      }
      updateData.isBreaking = body.isBreaking;
      updateData.breakingApproved = body.isBreaking;
    }

    if (body.trendingSuggested !== undefined) {
      updateData.trendingSuggested = body.trendingSuggested;
      if (body.trendingSuggested && !canApproveTrending(user)) {
        updateData.isTrending = false;
      }
    }

    if (body.isTrending !== undefined) {
      if (!canApproveTrending(user)) {
        return json({ error: 'Cannot approve trending status' }, { status: 403 });
      }
      updateData.isTrending = body.isTrending;
    }

    const requestedStatus = normalizeStatus(body.status);
    const currentStatus = normalizeStatus(article.status);
    if (requestedStatus && requestedStatus !== currentStatus) {
      if (requestedStatus === 'pending_review' && !canSubmitForReview(user, article)) {
        return json({ error: 'Cannot submit for review' }, { status: 403 });
      }
      if (requestedStatus === 'ready_to_publish' && !canApproveArticle(user)) {
        return json({ error: 'Cannot approve article' }, { status: 403 });
      }
      if (requestedStatus === 'published' && !canPublishArticle(user)) {
        return json({ error: 'Cannot publish article' }, { status: 403 });
      }
      updateData.status = requestedStatus;
    }

    delete updateData.id;
    delete updateData._id;

    const result = await newsCollection.updateOne(
      { id: newsId },
      { $set: updateData, $push: { versionHistory: previousVersion } }
    );

    if (result.matchedCount === 0) {
      return json({ error: 'Article not found' }, { status: 404 });
    }

    const updatedNews = await newsCollection.findOne({ id: newsId });
    return json({ success: true, news: updatedNews });
  } catch (error) {
    console.error('PUT /api/admin/news/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const newsId = params.id;
    const newsCollection = await getCollection('news');
    const article = await newsCollection.findOne({ id: newsId });

    if (!article) {
      return json({ error: 'News not found' }, { status: 404 });
    }

    await newsCollection.deleteOne({ id: newsId });
    console.log("FOUND ARTICLE:", article);
    return json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/news/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
