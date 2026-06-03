import { Suspense } from 'react';
import { getCollection } from '@/lib/mongodb';
import HomePageClient from '@/components/home/HomePageClient';

// ISR: rebuild this page at most once every 60 seconds.
// Between rebuilds the CDN serves the pre-rendered HTML instantly (~0ms TTFB).
export const revalidate = 60;

const LIST_PROJECTION = {
  _id: 0,
  id: 1, title: 1, excerpt: 1, featuredImage: 1,
  category: 1, publishedAt: 1, isBreaking: 1, isTrending: 1,
  tags: 1, author: 1, authorName: 1, views: 1, slug: 1, status: 1,
};

const BREAKING_PROJECTION = {
  _id: 0,
  id: 1, title: 1, featuredImage: 1, category: 1,
  publishedAt: 1, isBreaking: 1, excerpt: 1, slug: 1,
};

async function getInitialData() {
  try {
    const [newsCol, catsCol, tagsCol] = await Promise.all([
      getCollection('news'),
      getCollection('categories'),
      getCollection('tags'),
    ]);

    const query = { status: 'published', publishedAt: { $lte: new Date() } };

    const [news, total, categories, breaking, tags] = await Promise.all([
      newsCol.find(query).sort({ publishedAt: -1 }).limit(20).project(LIST_PROJECTION).toArray(),
      newsCol.countDocuments(query),
      catsCol.find({ isActive: true }).sort({ order: 1 }).toArray(),
      newsCol.find({ isBreaking: true, status: 'published' }).sort({ publishedAt: -1 }).limit(10).project(BREAKING_PROJECTION).toArray(),
      tagsCol.find({}).sort({ createdAt: -1 }).toArray(),
    ]);

    // MongoDB returns Date objects — serialize to plain JSON so Next.js can
    // pass them as props to the Client Component without serialization errors.
    const serialize = (arr) => JSON.parse(JSON.stringify(arr));

    return {
      initialNews: serialize(news),
      initialTotal: total,
      initialCategories: serialize(categories),
      initialBreaking: serialize(breaking),
      initialTags: serialize(tags),
    };
  } catch (error) {
    console.error('HomePage: server data fetch failed:', error);
    return {
      initialNews: [], initialTotal: 0,
      initialCategories: [], initialBreaking: [], initialTags: [],
    };
  }
}

export default async function HomePage() {
  const data = await getInitialData();

  // Suspense is required because HomePageClient uses useSearchParams().
  // fallback=null is intentional: the server already sends pre-rendered HTML
  // so there is no blank-screen flash during client hydration.
  return (
    <Suspense fallback={null}>
      <HomePageClient {...data} />
    </Suspense>
  );
}
