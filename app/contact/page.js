import StaticPage from '@/components/seo/StaticPage';
import { SITE, absoluteUrl } from '@/lib/seo/config';

export const metadata = {
  title: 'Contact Us',
  description: `Contact ${SITE.name} — reach our newsroom for news tips, corrections, feedback and partnership enquiries.`,
  alternates: { canonical: absoluteUrl('/contact') },
};

export default function ContactPage() {
  return (
    <StaticPage
      title="Contact Us"
      description={`Contact ${SITE.name}.`}
      path="/contact"
    >
      <p>We would love to hear from you. Use the details below to reach the right team.</p>
      <h2>Newsroom &amp; Tips</h2>
      <p>
        Share a news tip or story idea by emailing{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
      <h2>Corrections</h2>
      <p>
        Spotted an error? Please email us with the article link and details. See our{' '}
        <a href="/corrections-policy">Corrections Policy</a> for how we handle fixes.
      </p>
      <h2>Follow Us</h2>
      <p>
        <a href={SITE.social.twitter} rel="noopener">Twitter / X</a> ·{' '}
        <a href={SITE.social.facebook} rel="noopener">Facebook</a> ·{' '}
        <a href={SITE.social.instagram} rel="noopener">Instagram</a> ·{' '}
        <a href={SITE.social.youtube} rel="noopener">YouTube</a>
      </p>
    </StaticPage>
  );
}
