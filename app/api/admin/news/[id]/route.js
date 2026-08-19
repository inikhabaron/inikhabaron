import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { requireAdmin } from '@/lib/auth/admin/guard';
import {
  checkRole,
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

// Reads the admin token off the request, so it can never be prerendered —
// same reasoning as the sibling list route.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

// The list endpoint strips `content` and the editorial history arrays (see
// ../route.js), so the admin editor fetches the whole document here when
// opening an article. Write permission stays enforced on PUT — this only
// requires a valid admin token, exactly the access the list already grants.
export async function GET(request, { params }) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const newsCollection = await getCollection('news');
    const article = await newsCollection.findOne({ id: params.id });

    if (!article) {
      return json({ error: 'Article not found' }, { status: 404 });
    }

    // Same scoping the list applies, so a reporter cannot reach another
    // reporter's article by guessing at ids the listing won't show them.
    // Deliberately not `canEditArticle`: that also requires draft or
    // needs_revision status, which would stop a reporter opening their own
    // published article in the editor — something they can do today.
    if (checkRole(gate.user, ['reporter']) && article.authorId !== gate.user.id) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    return json({ news: article });
  } catch (error) {
    console.error('GET /api/admin/news/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

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

    // `updateData` is the request body spread wholesale, so every one of these
    // is settable by whoever posts the edit unless it is stripped here.
    //
    // `authorId` is the one that bites: the admin client sends
    // `authorId: currentUser.id` on every save, so each edit silently
    // reassigned the article to whoever edited it last. With reporters scoped
    // to their own work (see ../route.js), a reporter's article vanished from
    // their list the moment an editor touched it. Ownership is set once, at
    // creation, from the creator's token — reassignment is not an edit.
    //
    // The rest are the article's provenance: its creation time and its audit
    // trails. An edit revises the article, never the record of how it got
    // here, and `versionHistory` in particular is what makes an unwanted
    // change recoverable.
    for (const field of ['id', '_id', 'authorId', 'createdAt', 'versionHistory', 'approvalHistory', 'corrections']) {
      delete updateData[field];
    }

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

// Admin-only, matching the UI: NewsListView renders the Delete control solely
// for `role === 'admin'`. This handler took `_request` and never looked at it,
// so deletion was reachable by anyone who knew an article id — and the public
// /api/news response hands out every published article's id.
export async function DELETE(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

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
