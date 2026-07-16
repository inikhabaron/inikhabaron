import StaticPage from '@/components/seo/StaticPage';
import { SITE, absoluteUrl } from '@/lib/seo/config';

export const metadata = {
  title: 'About Us',
  description: `About ${SITE.name} — our mission, editorial values and the team behind our Hindi & English news coverage.`,
  alternates: { canonical: absoluteUrl('/about') },
};

export default function AboutPage() {
  return (
    <StaticPage
      title={`About ${SITE.name}`}
      description={`About ${SITE.name} — our mission and editorial values.`}
      path="/about"
    >
      <p>
        {SITE.name} is an independent digital news publisher covering India and the world across
        politics, business, sports, entertainment, technology, science and spirituality, in both
        Hindi and English.
      </p>
      <h2>Our Mission</h2>
      <p>
        We are committed to fast, factual and fair journalism. Our newsroom prioritises accuracy over
        speed, verifies information before publishing, and clearly attributes sources so readers can
        trust what they read.
      </p>
      <h2>Editorial Standards</h2>
      <p>
        Every story is produced according to our{' '}
        <a href="/editorial-policy">Editorial Policy</a> and is subject to our{' '}
        <a href="/corrections-policy">Corrections Policy</a>. We disclose ownership, funding and any
        potential conflicts of interest.
      </p>
      <h2>Contact</h2>
      <p>
        Have a tip, correction or feedback? Reach us via our{' '}
        <a href="/contact">Contact page</a> or email{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </StaticPage>
  );
}
