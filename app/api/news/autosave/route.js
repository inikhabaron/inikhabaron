import { requireAdmin } from '@/lib/auth/admin/guard';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getCollection } from '@/lib/mongodb';
import {
  saveDraft,
  getDraftByNewsId,
  getDraftById,
  listNewDrafts,
  deleteDraftByNewsId,
  deleteDraftById,
} from '@/lib/services/autosave/autosaveService';
import { checkRole } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

/**
 * POST /api/news/autosave — Save an editor draft.
 *
 * Auth: requireAdmin (admin / editor / reporter).
 * Reporters can only autosave their own articles.
 *
 * Body: { draftId, newsId, sessionId, title, content, ... }
 *
 * Response: { success, data: { draftVersion, autoSavedAt, conflict } }
 */
export async function POST(request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const { draftId, newsId, sessionId, ...formFields } = body;

    if (!draftId) {
      return failure('draftId is required', 400);
    }
    if (!sessionId) {
      return failure('sessionId is required', 400);
    }

    // Reporter scoping: can only autosave drafts of their own articles
    if (newsId && checkRole(gate.user, ['reporter'])) {
      const newsCollection = await getCollection('news');
      const article = await newsCollection.findOne(
        { id: newsId },
        { projection: { authorId: 1 } },
      );
      if (article && article.authorId !== gate.user.id) {
        return failure('Cannot autosave another reporter\'s article', 403);
      }
    }

    const result = await saveDraft(
      gate.user.id,
      draftId,
      newsId || null,
      sessionId,
      formFields,
    );

    return success(result, 'Draft saved');
  } catch (error) {
    logApiError('POST /api/news/autosave', error);
    return failure('Failed to save draft', 500);
  }
}

/**
 * GET /api/news/autosave — Retrieve drafts.
 *
 * Query params:
 *   ?newsId=<uuid>   → single draft for an existing article
 *   ?draftId=<uuid>  → single draft by its ID (new-article drafts)
 *   (no params)      → list all new-article drafts for the current user
 *
 * Auth: requireAdmin.
 */
export async function GET(request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');
    const draftId = searchParams.get('draftId');

    if (newsId) {
      const draft = await getDraftByNewsId(gate.user.id, newsId);
      return success({ draft }, draft ? 'Draft found' : 'No draft found');
    }

    if (draftId) {
      const draft = await getDraftById(draftId);
      // Ownership check: only return if it belongs to this user
      if (draft && draft.userId !== gate.user.id) {
        return success({ draft: null }, 'No draft found');
      }
      return success({ draft }, draft ? 'Draft found' : 'No draft found');
    }

    // List all new-article drafts for this user
    const drafts = await listNewDrafts(gate.user.id);
    return success({ drafts }, `${drafts.length} draft(s) found`);
  } catch (error) {
    logApiError('GET /api/news/autosave', error);
    return failure('Failed to retrieve draft', 500);
  }
}

/**
 * DELETE /api/news/autosave — Discard a draft.
 *
 * Query params:
 *   ?newsId=<uuid>   → delete draft for an existing article
 *   ?draftId=<uuid>  → delete a specific draft by ID
 *
 * Auth: requireAdmin.
 */
export async function DELETE(request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');
    const draftId = searchParams.get('draftId');

    if (!newsId && !draftId) {
      return failure('newsId or draftId is required', 400);
    }

    let result;
    if (newsId) {
      result = await deleteDraftByNewsId(gate.user.id, newsId);
    } else {
      // Ownership check happens inside: the draft must belong to this user.
      // For safety, deleteDraftById uses draftId alone, but we verify ownership
      // by re-reading first.
      const draft = await getDraftById(draftId);
      if (draft && draft.userId !== gate.user.id) {
        return failure('Forbidden', 403);
      }
      result = await deleteDraftById(draftId);
    }

    return success(result, result.deleted ? 'Draft deleted' : 'No draft found');
  } catch (error) {
    logApiError('DELETE /api/news/autosave', error);
    return failure('Failed to delete draft', 500);
  }
}
