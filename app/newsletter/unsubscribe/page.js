import { verifyUnsubscribeToken } from '@/lib/services/newsletter/unsubscribeToken';
import { unsubscribeFromNewsletter } from '@/lib/services/newsletter/newsletterService';
import { SITE } from '@/lib/seo/config';

export const metadata = {
  title: `Unsubscribe | ${SITE.name}`,
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ searchParams }) {
  const { email, token } = await searchParams;

  let message;
  if (!email || !token) {
    message = 'This unsubscribe link is missing required information.';
  } else if (!verifyUnsubscribeToken(email, token)) {
    message = 'This unsubscribe link is invalid or has expired.';
  } else {
    const result = await unsubscribeFromNewsletter({ email });
    message = result.success
      ? `You have been unsubscribed from the ${SITE.name} newsletter.`
      : 'We could not process your unsubscribe request. Please try again later.';
  }

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: '-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
          {SITE.name}
        </h1>
        <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.6 }}>{message}</p>
      </div>
    </div>
  );
}
