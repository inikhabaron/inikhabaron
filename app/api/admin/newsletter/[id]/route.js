import { ObjectId } from 'mongodb';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { checkRole } from '@/lib/auth/permissions';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { updateNewsletterSubscriber, deleteNewsletterSubscriber } from '@/lib/services/newsletter/newsletterService';

export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return failure('Unauthorized', 401);
    if (!checkRole(user, ['admin', 'editor'])) return failure('Forbidden', 403);

    const { id } = await params;
    if (!ObjectId.isValid(id)) return failure('Invalid subscriber id', 400);

    const body = await request.json().catch(() => ({}));
    const result = await updateNewsletterSubscriber(new ObjectId(id), body);

    if (!result.success) return failure('Subscriber not found', 404);

    return success(result, 'Subscriber updated successfully');
  } catch (error) {
    logApiError('PATCH /api/admin/newsletter/[id]', error);
    return failure('Unable to update subscriber', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return failure('Unauthorized', 401);
    if (!checkRole(user, ['admin', 'editor'])) return failure('Forbidden', 403);

    const { id } = await params;
    if (!ObjectId.isValid(id)) return failure('Invalid subscriber id', 400);

    const result = await deleteNewsletterSubscriber(new ObjectId(id));

    if (!result.success) return failure('Subscriber not found', 404);

    return success(result, 'Subscriber deleted successfully');
  } catch (error) {
    logApiError('DELETE /api/admin/newsletter/[id]', error);
    return failure('Unable to delete subscriber', 500);
  }
}
