import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { canAccessAdminPanel } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

/**
 * Reassign an article to a different author.
 *
 * `authorId` is deliberately immutable through PUT /api/admin/news/[id] — it
 * used to ride in on the edit body, so every save handed the article to
 * whoever edited it last and reporters lost sight of their own work. Ownership
 * still has to be changeable, though: people leave, and articles get filed
 * against the wrong byline. So it changes here, on its own endpoint, where it
 * is the entire point of the request rather than a side effect of one.
 *
 * Admin-only, and only onto a staff account — handing an article to a reader
 * account would put it somewhere no admin view can reach it.
 */
export async function PATCH(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const body = await request.json().catch(() => ({}));
    const authorId = typeof body.authorId === 'string' ? body.authorId.trim() : '';

    if (!authorId) {
      return json({ error: 'authorId is required' }, { status: 400 });
    }

    const usersCollection = await getCollection('users');
    const newAuthor = await usersCollection.findOne({ id: authorId });

    if (!newAuthor) {
      return json({ error: 'No user with that id' }, { status: 404 });
    }

    if (!canAccessAdminPanel(newAuthor)) {
      return json(
        { error: 'Articles can only be owned by a staff account (admin, editor or reporter)' },
        { status: 400 }
      );
    }

    if (newAuthor.isActive === false) {
      return json({ error: 'That account is deactivated' }, { status: 400 });
    }

    const newsCollection = await getCollection('news');
    const article = await newsCollection.findOne({ id: params.id });

    if (!article) {
      return json({ error: 'Article not found' }, { status: 404 });
    }

    if (article.authorId === authorId) {
      return json({ success: true, authorId, unchanged: true });
    }

    // Recorded in approvalHistory alongside the editorial actions, so an
    // article's provenance reads as one timeline. `by` comes from the token,
    // never the body — the same rule the approve/publish routes follow.
    await newsCollection.updateOne(
      { id: params.id },
      {
        $set: { authorId, updatedAt: new Date() },
        $push: {
          approvalHistory: {
            action: 'ownership_transferred',
            by: gate.user.id,
            byName: gate.user.name,
            at: new Date(),
            fromAuthorId: article.authorId ?? null,
            toAuthorId: authorId,
            comment: typeof body.comment === 'string' ? body.comment : 'Ownership transferred',
          },
        },
      }
    );

    return json({
      success: true,
      // The byline (`authors`/`authorName`) is separate from ownership and is
      // left alone on purpose: who wrote the article and whose queue it sits
      // in are different questions, and only the caller knows whether the
      // printed byline should change too.
      authorId,
      previousAuthorId: article.authorId ?? null,
    });
  } catch (error) {
    console.error('PATCH /api/admin/news/[id]/ownership error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
