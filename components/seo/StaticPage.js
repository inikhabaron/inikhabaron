/**
 * Reusable server-rendered static content page (About, Contact, policies).
 * Wraps content in the SEO shell and emits WebPage + Breadcrumb JSON-LD.
 * These pages are core E-E-A-T signals for a news publisher.
 */
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import SeoPageShell from '@/components/seo/SeoPageShell';
import { getCategories } from '@/lib/seo/data';
import { SITE, SITE_URL, absoluteUrl } from '@/lib/seo/config';
import { webPageSchema, breadcrumbSchema } from '@/lib/seo/jsonld';

export default async function StaticPage({ title, description, path, children }) {
  const categories = await getCategories();
  const url = absoluteUrl(path);
  const crumbs = [
    { name: 'Home', url: SITE_URL },
    { name: title, url },
  ];
  return (
    <SeoPageShell categories={categories}>
      <JsonLd data={[webPageSchema({ name: title, description, url }), breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} />
      <article style={{ maxWidth: '760px', margin: '0 auto', padding: '8px 0 40px', lineHeight: 1.7 }}>
        <h1 style={{ fontSize: '30px', margin: '8px 0 16px', color: '#111827' }}>{title}</h1>
        <div style={{ color: '#374151' }}>{children}</div>
      </article>
    </SeoPageShell>
  );
}
