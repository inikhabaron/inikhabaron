import { getCurrentUser } from '@/lib/session/session';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from '@/lib/services/newsletter/newsletterService';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!body.email) {
      return failure('Email is required', 400);
    }

    const user = await getCurrentUser();

    const result = await subscribeToNewsletter({
      email: body.email,
      userId: user?.id ?? null,
      language: typeof body.language === 'string' && body.language ? body.language : 'en',
      categories: Array.isArray(body.categories) ? body.categories : [],
      source: typeof body.source === 'string' && body.source ? body.source : 'website',
    });

    if (!result.success) {
      if (result.code === 'INVALID_EMAIL') return failure('Enter a valid email address', 400);
      if (result.code === 'ALREADY_SUBSCRIBED') return failure('This email is already subscribed', 409);
      return failure('Unable to subscribe', 400);
    }

    return success(
      null,
      result.reactivated ? 'Welcome back! Your subscription has been reactivated' : 'Subscribed successfully',
      null,
      201
    );
  } catch (error) {
    logApiError('POST /api/newsletter', error);
    return failure('Unable to subscribe', 500);
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const user = await getCurrentUser();

    const email = body.email || user?.email || null;
    const userId = user?.id ?? null;

    if (!email && !userId) {
      return failure('Email is required', 400);
    }

    const result = await unsubscribeFromNewsletter({ email, userId });

    if (!result.success) {
      if (result.code === 'NOT_FOUND') return failure('Subscriber not found', 404);
      return failure('Unable to unsubscribe', 400);
    }

    return success(
      null,
      result.alreadyUnsubscribed ? 'You are already unsubscribed' : 'Unsubscribed successfully'
    );
  } catch (error) {
    logApiError('DELETE /api/newsletter', error);
    return failure('Unable to unsubscribe', 500);
  }
}
