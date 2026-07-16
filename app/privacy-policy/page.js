import StaticPage from '@/components/seo/StaticPage';
import { SITE, absoluteUrl } from '@/lib/seo/config';

export const metadata = {
  title: 'Privacy Policy',
  description: `${SITE.name} Privacy Policy — what data we collect, how we use it, cookies, analytics and your choices.`,
  alternates: { canonical: absoluteUrl('/privacy-policy') },
};

export default function PrivacyPolicyPage() {
  return (
    <StaticPage
      title="Privacy Policy"
      description={`${SITE.name} privacy practices.`}
      path="/privacy-policy"
    >
      <p>
        This Privacy Policy explains how {SITE.name} collects, uses and protects your information when
        you use our website.
      </p>
      <h2>Information We Collect</h2>
      <p>
        We collect basic usage data (such as pages viewed and device/browser information) to understand
        readership and improve our service. If you sign in, subscribe or comment, we store the details
        you provide (such as your name and email).
      </p>
      <h2>Cookies &amp; Analytics</h2>
      <p>
        We use cookies and analytics tools (including Google Analytics) to measure traffic and improve
        the site. You can control cookies through your browser settings.
      </p>
      <h2>Advertising</h2>
      <p>
        We may show advertising, including via Google. Third-party vendors may use cookies to serve ads
        based on prior visits to this and other websites.
      </p>
      <h2>Your Choices</h2>
      <p>
        You can request access to, or deletion of, your personal data by contacting{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy? Email{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </StaticPage>
  );
}
