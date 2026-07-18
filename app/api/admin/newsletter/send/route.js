import { getUserFromToken } from '@/lib/auth/admin/token';
import { checkRole } from '@/lib/auth/permissions';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { sendNewsletter } from '@/lib/services/newsletter/sendNewsletterService';

// Strips subscriber-identifying detail (the `failures` list, which carries
// emails) before a send summary goes over HTTP — that detail stays in the
// campaign log (lib/services/newsletter/campaignService.js) and server logs.
function toPublicSummary(result) {
  const { failures, ...publicResult } = result;
  return publicResult;
}

export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return failure('Unauthorized', 401);
    if (!checkRole(user, ['admin', 'editor'])) return failure('Forbidden', 403);

    const body = await request.json().catch(() => ({}));
    const type = body.type === 'breaking' ? 'breaking' : 'monthly';

    const result = await sendNewsletter({
      type,
      articleId: body.articleId,
      force: body.force === true,
      initiatedBy: user.id,
    });

    if (!result.success) {
      return failure(result.error || 'Unable to send newsletter', 400, toPublicSummary(result));
    }

    return success(
      toPublicSummary(result),
      `Newsletter sent: ${result.sent} succeeded, ${result.failed} failed, ${result.skipped} skipped`
    );
  } catch (error) {
    logApiError('POST /api/admin/newsletter/send', error);
    return failure('Unable to send newsletter', 500);
  }
}
