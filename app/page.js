import HomeClient from './HomeClient';
import JsonLd from '@/components/seo/JsonLd';
import { getLatestArticles, getHomeFeed, LATEST_NEWS_CARD_PROJECTION } from '@/lib/seo/data';
import { itemListSchema, websiteSchema } from '@/lib/seo/jsonld';
import { SITE, SITE_URL } from '@/lib/seo/config';
import { timeAsync } from '@/lib/perf/perfLog';

// Homepage revalidates frequently so top stories stay fresh for crawlers.
export const revalidate = 120;

export const metadata = {
  title: `${SITE.name} - Latest Hindi & English News`,
  description: SITE.description,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} - Latest Hindi & English News`,
    description: SITE.description,
    url: SITE_URL,
    locale: SITE.locale,
    alternateLocale: SITE.localeAlt,
    images: [{ url: SITE.defaultImage, width: 1200, height: 630, alt: SITE.name }],
  },
};

export default async function Page({ searchParams }) {
  return timeAsync('Homepage SSR (app/page.js Page())', async () => {
    // Fetch top stories on the server purely to emit an ItemList of the current
    // headlines (great for Google + AI "top stories" understanding). The rich
    // interactive homepage UI is rendered by the existing client component.
    // itemListSchema only reads id/title (see lib/seo/jsonld.js) — projected
    // for the same reason as the article page (see app/news/[id]/page.js).
    const params = await searchParams;
    const initialCategory = params?.category || 'all';
    // A search view is user-specific and client-driven; only seed the plain feed.
    const seedFeed = !params?.search;
    const [latest, feed] = await Promise.all([
      getLatestArticles({ limit: 10, projection: LATEST_NEWS_CARD_PROJECTION }),
      // The same 20-article first page the client used to fetch after load —
      // now present in the server HTML so crawlers see real headline links.
      seedFeed ? getHomeFeed({ category: initialCategory }) : null,
    ]);

    return (
      <>
        <JsonLd data={[websiteSchema(), itemListSchema(latest, { name: `${SITE.name} — Top Stories` })]} />
        <HomeClient initialCategory={initialCategory} initialFeed={feed} />
      </>
    );
  });
}
