import StaticPage from '@/components/seo/StaticPage';
import { SITE, absoluteUrl } from '@/lib/seo/config';

export const metadata = {
  title: 'Corrections Policy',
  description: `${SITE.name} Corrections Policy — how to report an error and how we correct, update and clarify our journalism.`,
  alternates: { canonical: absoluteUrl('/corrections-policy') },
};

export default function CorrectionsPolicyPage() {
  return (
    <StaticPage
      title="Corrections Policy"
      description={`How ${SITE.name} handles corrections and clarifications.`}
      path="/corrections-policy"
    >
      <p>
        {SITE.name} is committed to accuracy. When we make a mistake, we correct it quickly and openly.
      </p>
      <h2>Reporting an Error</h2>
      <p>
        To report an error, email{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> with the article link and a clear
        description of the issue. We review every request.
      </p>
      <h2>How We Correct</h2>
      <p>
        Substantive corrections are noted on the article, including what changed and when. Minor fixes
        (such as spelling) may be made without a note. The article&apos;s modified date is updated to
        reflect any change.
      </p>
      <h2>Updates &amp; Clarifications</h2>
      <p>
        For developing stories, we update articles as new information emerges and label significant
        updates. Clarifications are added when wording could be misunderstood, even if not strictly
        inaccurate.
      </p>
    </StaticPage>
  );
}
