import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

const DEMO_USERS = [
  { email: 'admin@newsdesk.com', password: 'admin123', name: 'Admin User', role: 'admin', isVerified: true, bio: 'System Administrator' },
  { email: 'editor@newsdesk.com', password: 'editor123', name: 'Editor User', role: 'editor', isVerified: true, bio: 'Content Editor' },
  { email: 'reporter@newsdesk.com', password: 'reporter123', name: 'Reporter User', role: 'reporter', isVerified: true, bio: 'News Reporter' },
];

const DEFAULT_CATEGORIES = [
  { name: 'Politics', slug: 'politics', color: '#DC2626', icon: 'Building', order: 1 },
  { name: 'Sports', slug: 'sports', color: '#16A34A', icon: 'Trophy', order: 2 },
  { name: 'Business', slug: 'business', color: '#2563EB', icon: 'Briefcase', order: 3 },
  { name: 'Entertainment', slug: 'entertainment', color: '#9333EA', icon: 'Film', order: 4 },
  { name: 'Technology', slug: 'technology', color: '#0891B2', icon: 'Laptop', order: 5 },
  { name: 'Local', slug: 'local', color: '#CA8A04', icon: 'MapPin', order: 6 },
  { name: 'National', slug: 'national', color: '#EA580C', icon: 'Flag', order: 7 },
  { name: 'World', slug: 'world', color: '#4F46E5', icon: 'Globe', order: 8 },
];

function buildSampleNews() {
  const now = Date.now();
  return [
    {
      title: 'Breaking: Major Tech Company Announces Revolutionary AI Product',
      slug: 'tech-company-ai-product',
      content: 'In a groundbreaking announcement today, a leading technology company unveiled their latest AI-powered product that promises to transform the industry. The new system combines advanced machine learning with intuitive user interfaces to deliver unprecedented capabilities. Industry analysts predict this could reshape the competitive landscape for years to come. The company plans to begin rolling out the product to select markets next quarter, with a global launch expected by year end.',
      excerpt: 'A leading tech company unveils groundbreaking AI product set to transform the industry.',
      category: 'technology',
      tags: ['AI', 'technology', 'innovation'],
      featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      isBreaking: true,
      isFeatured: true,
      views: 1250,
      shares: { whatsapp: 45, twitter: 89, facebook: 32 },
      publishedAt: new Date(),
    },
    {
      title: 'Local Team Wins Championship in Historic Victory',
      slug: 'local-team-championship-victory',
      content: 'The local sports team has achieved a historic victory, winning the championship for the first time in over two decades. Fans flooded the streets in celebration as the final whistle blew, marking the end of a remarkable season. The team\'s coach praised the players\' dedication and teamwork, while the captain dedicated the win to the loyal supporters who never lost faith.',
      excerpt: 'Historic championship win brings joy to fans after two decades of waiting.',
      category: 'sports',
      tags: ['sports', 'championship', 'local'],
      featuredImage: 'https://images.unsplash.com/photo-1461896836934- voices-a2438c?w=800',
      isBreaking: false,
      isFeatured: true,
      views: 890,
      shares: { whatsapp: 120, twitter: 56, facebook: 78 },
      publishedAt: new Date(now - 3600000),
    },
    {
      title: 'Government Announces New Economic Policy Package',
      slug: 'government-economic-policy',
      content: 'The government today unveiled a comprehensive economic policy package aimed at boosting growth and creating jobs. The measures include tax incentives for small businesses, infrastructure investments, and support for green energy initiatives. Economic experts have given mixed reactions, with some praising the ambitious scope while others question the fiscal implications.',
      excerpt: 'New economic measures aim to boost growth and create employment opportunities.',
      category: 'politics',
      tags: ['politics', 'economy', 'policy'],
      featuredImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
      isBreaking: false,
      isFeatured: false,
      views: 567,
      shares: { whatsapp: 23, twitter: 45, facebook: 19 },
      publishedAt: new Date(now - 7200000),
    },
    {
      title: 'Stock Markets Reach New Heights Amid Positive Earnings Reports',
      slug: 'stock-markets-new-heights',
      content: 'Global stock markets surged to record highs today as major corporations reported better-than-expected quarterly earnings. Technology and healthcare sectors led the gains, with investors showing renewed confidence in economic recovery. Analysts suggest the positive momentum could continue if inflation concerns remain subdued.',
      excerpt: 'Markets rally on strong corporate earnings, reaching historic levels.',
      category: 'business',
      tags: ['business', 'stocks', 'markets'],
      featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
      isBreaking: false,
      isFeatured: false,
      views: 432,
      shares: { whatsapp: 12, twitter: 34, facebook: 8 },
      publishedAt: new Date(now - 10800000),
    },
    {
      title: 'Award-Winning Film Director Announces New Project',
      slug: 'film-director-new-project',
      content: 'The acclaimed director known for critically acclaimed films has announced their next ambitious project. The new film will be a sweeping epic spanning multiple decades and continents. Production is set to begin next spring with an all-star cast already attached to the project.',
      excerpt: 'Celebrated filmmaker reveals details of upcoming epic production.',
      category: 'entertainment',
      tags: ['entertainment', 'movies', 'cinema'],
      featuredImage: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
      isBreaking: false,
      isFeatured: false,
      views: 789,
      shares: { whatsapp: 56, twitter: 89, facebook: 45 },
      publishedAt: new Date(now - 14400000),
    },
  ];
}

export async function POST() {
  try {
    const categoriesCollection = await getCollection('categories');
    const newsCollection = await getCollection('news');
    const usersCollection = await getCollection('users');

    const existingCategories = await categoriesCollection.countDocuments({});
    const existingUsers = await usersCollection.countDocuments({});

    await Promise.all(DEMO_USERS.map(async (userData) => {
      const fullUserData = { ...userData, createdAt: new Date(), updatedAt: new Date() };
      const existingUser = await usersCollection.findOne({ email: userData.email });
      if (existingUser) {
        await usersCollection.updateOne(
          { email: userData.email },
          { $set: { ...fullUserData, id: existingUser.id } }
        );
      } else {
        await usersCollection.insertOne({ ...fullUserData, id: userData.role + '-' + uuidv4() });
      }
    }));

    if (existingCategories > 0 && existingUsers > 0) {
      return json({ message: 'Already seeded' });
    }

    if (existingCategories === 0) {
      const defaultCategories = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        id: uuidv4(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await Promise.all(defaultCategories.map(cat =>
        categoriesCollection.updateOne({ slug: cat.slug }, { $setOnInsert: cat }, { upsert: true })
      ));

      const sampleNews = buildSampleNews();
      await Promise.all(sampleNews.map(n => {
        const article = {
          ...n,
          id: uuidv4(),
          status: 'published',
          authorId: 'system',
          authorName: 'NewsDesk Team',
          createdAt: n.publishedAt,
          updatedAt: n.publishedAt,
          corrections: [],
          approvalHistory: [],
          headlineVariants: [],
          activeHeadline: 0,
          seoTitle: n.title,
          seoDescription: n.excerpt,
          seoKeywords: n.tags,
        };
        return newsCollection.updateOne(
          { slug: n.slug },
          { $setOnInsert: article },
          { upsert: true }
        );
      }));
    }

    return json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('POST /api/seed error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
