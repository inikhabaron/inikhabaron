import StaticPage from '@/components/seo/StaticPage';
import { SITE, absoluteUrl } from '@/lib/seo/config';

export const metadata = {
  title: 'Editorial Policy',
  description: `${SITE.name} Editorial Policy — how we source, verify, edit and publish the news, and our standards for accuracy, independence and transparency.`,
  alternates: { canonical: absoluteUrl('/editorial-policy') },
};

export default function EditorialPolicyPage() {
  return (
    <StaticPage
      title="Editorial Policy"
      description={`${SITE.name} editorial standards and practices.`}
      path="/editorial-policy"
    >
      <p>
        This Editorial Policy explains how {SITE.name} gathers, verifies, edits and publishes news. It
        reflects our commitment to accuracy, independence, fairness and transparency.
      </p>
      <h2>Accuracy &amp; Verification</h2>
      <p>
        We verify facts with multiple credible sources before publishing. Where information cannot be
        independently confirmed, we say so clearly. We do not publish rumours as fact.
      </p>
      <h2>Sourcing</h2>
      <p>
        We attribute information to named sources wherever possible and link to primary sources. Use
        of anonymous sources is limited to cases of clear public interest and requires editor approval.
      </p>
      <h2>Independence</h2>
      <p>
        Our editorial decisions are independent of commercial and political interests. Sponsored or
        partner content is always clearly labelled and kept separate from news reporting.
      </p>
      <h2>Fact-Checking</h2>
      <p>
        Stories are reviewed by editors before publication. Data, quotes and claims are checked against
        source material. Significant claims are supported by evidence and links.
      </p>
      <h2>Corrections</h2>
      <p>
        When we get something wrong, we fix it promptly and transparently in line with our{' '}
        <a href="/corrections-policy">Corrections Policy</a>.
      </p>
      <h2>Bylines &amp; Authors</h2>
      <p>
        Articles carry the byline of the journalist responsible. Author pages list a writer&apos;s recent
        work so readers can assess expertise and track record.
      </p>
    </StaticPage>
  );
}
