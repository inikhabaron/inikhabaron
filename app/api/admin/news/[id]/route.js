import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
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
import { normalizeAuthorsInput, primaryAuthorName } from '@/lib/news/authors';
import { cleanupImages, authorImageUrls } from '@/lib/services/media/imageCleanupService';

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

    // The body is spread in wholesale, so `authors` would otherwise land in
    // the document exactly as posted. Normalize it (trim, drop blank blocks,
    // cap the count) and keep the legacy `authorName` mirror in step.
    if (body.authors !== undefined) {
      const authors = normalizeAuthorsInput(body.authors);
      if (authors) {
        updateData.authors = authors;
        updateData.authorName = primaryAuthorName(authors);
      } else {
        // Nothing usable posted — leave the stored byline alone rather than
        // blanking an article's authors on a malformed edit.
        delete updateData.authors;
        delete updateData.authorName;
      }
    }

    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt
        ? new Date(body.scheduledAt)
        : null;
    }

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
      // Ordering key for the public ticker (/api/news/breaking) — kept in step
      // with the dedicated breaking/approve-breaking routes so editing an
      // article's breaking flag from the form behaves the same way.
      updateData.breakingAt = body.isBreaking ? new Date() : null;
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

      // Set publish timestamp when publishing
      if (
        requestedStatus === 'published' &&
        !article.publishedAt
      ) {
        updateData.publishedAt = new Date();
      }
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

    // Author photos that this edit dropped or swapped out. Only reclaimed if
    // nothing else references them; the article is already saved, so a
    // cleanup failure costs storage, never the edit.
    if (updateData.authors) {
      const removed = authorImageUrls(article).filter(
        (url) => !authorImageUrls(updatedNews).includes(url),
      );
      await cleanupImages(removed, { excludeArticleId: newsId });
    }

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

    // Reclaim this article's author photos, but only the ones no other
    // article or user profile still points at — the same reporter's photo is
    // routinely reused across their whole body of work.
    await cleanupImages(authorImageUrls(article), { excludeArticleId: newsId });

    return json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/news/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
