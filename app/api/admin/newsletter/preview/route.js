import { getUserFromToken } from '@/lib/auth/admin/token';
import { checkRole } from '@/lib/auth/permissions';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { buildMonthlyContent, buildBreakingContent } from '@/lib/services/newsletter/newsletterContentService';
import { buildMonthlyNewsletter } from '@/lib/services/newsletter/templates/monthlyNewsletter';
import { buildBreakingNewsletter } from '@/lib/services/newsletter/templates/breakingNewsletter';

// A stable placeholder recipient — preview HTML is never sent, but the
// templates need an email to build the unsubscribe link.
const PREVIEW_EMAIL = 'preview@inikhabaron.com';

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return failure('Unauthorized', 401);
    if (!checkRole(user, ['admin', 'editor'])) return failure('Forbidden', 403);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') === 'breaking' ? 'breaking' : 'monthly';
    const articleId = searchParams.get('articleId') || undefined;

    const content = type === 'breaking'
      ? await buildBreakingContent({ articleId })
      : await buildMonthlyContent();

    const preview = type === 'breaking'
      ? buildBreakingNewsletter({ email: PREVIEW_EMAIL, ...content })
      : buildMonthlyNewsletter({ email: PREVIEW_EMAIL, ...content });

    return success(preview, 'Preview generated successfully');
  } catch (error) {
    logApiError('GET /api/admin/newsletter/preview', error);
    return failure('Unable to generate preview', 500);
  }
}
