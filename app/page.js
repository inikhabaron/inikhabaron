import HomeClient from './HomeClient';
import JsonLd from '@/components/seo/JsonLd';
import { getLatestArticles } from '@/lib/seo/data';
import { itemListSchema, websiteSchema } from '@/lib/seo/jsonld';
import { SITE, SITE_URL } from '@/lib/seo/config';

// Homepage revalidates frequently so top stories stay fresh for crawlers.
export const revalidate = 120;

export const metadata = {
  title: `${SITE.name} - Latest Hindi & English News`,
  description: SITE.description,
  alternates: { canonical: SITE_URL },
};

export default async function Page() {
  // Fetch top stories on the server purely to emit an ItemList of the current
  // headlines (great for Google + AI "top stories" understanding). The rich
  // interactive homepage UI is rendered by the existing client component.
  const latest = await getLatestArticles({ limit: 10 });

  return (
    <>
      <JsonLd data={[websiteSchema(), itemListSchema(latest, { name: `${SITE.name} — Top Stories` })]} />
      <HomeClient />
    </>
  );
}
