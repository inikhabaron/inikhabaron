import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { generateUploadSignature, deleteImage } from '@/lib/cloudinary';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Resend } from 'resend';

// Initialize Razorpay (will work when keys are added)
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith('TODO')) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (e) {
  console.log('Razorpay not configured');
}

// Initialize Resend (will work when key is added)
let resend = null;
try {
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('TODO')) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (e) {
  console.log('Resend not configured');
}

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Helper to parse path
function getPath(request) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/(.*)/);
  return pathMatch ? pathMatch[1] : '';
}

// Helper to get subscription features
function getSubscriptionFeatures(plan) {
  const features = {
    free: {
      adsEnabled: true,
      articleLimit: 10, // per day
      offlineAccess: false,
      exclusiveContent: false,
      earlyAccess: false,
      noAds: false,
    },
    basic: {
      adsEnabled: true,
      articleLimit: 50,
      offlineAccess: true,
      exclusiveContent: false,
      earlyAccess: false,
      noAds: false,
    },
    premium: {
      adsEnabled: false,
      articleLimit: -1, // unlimited
      offlineAccess: true,
      exclusiveContent: true,
      earlyAccess: true,
      noAds: true,
    },
    enterprise: {
      adsEnabled: false,
      articleLimit: -1,
      offlineAccess: true,
      exclusiveContent: true,
      earlyAccess: true,
      noAds: true,
      apiAccess: true,
      multiUser: true,
    },
  };
  return features[plan] || features.free;
}

// Helper to auto-publish scheduled articles
async function autoPublishScheduledArticles() {
  try {
    const newsCollection = await getCollection('news');
    const now = new Date();
    
    const result = await newsCollection.updateMany(
      { 
        status: 'scheduled', 
        scheduledAt: { $lte: now } 
      },
      { 
        $set: { 
          status: 'published', 
          publishedAt: now,
          updatedAt: now 
        } 
      }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Auto-publish error:', error);
    return 0;
  }
}

// ==================== GET ROUTES ====================
export async function GET(request) {
  const path = getPath(request);
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  try {
    // Auto-publish scheduled articles on every request (lightweight check)
    await autoPublishScheduledArticles();
    
    // Health check
    if (path === 'health') {
      return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    // ===== NEWS ENDPOINTS =====
    
    // Get all published news (public)
    if (path === 'news' || path === 'news/') {
      const newsCollection = await getCollection('news');
      const category = searchParams.get('category');
      const limit = parseInt(searchParams.get('limit') || '20');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;
      const search = searchParams.get('search');
      
      let query = { status: 'published', publishedAt: { $lte: new Date() } };
      
      if (category && category !== 'all') {
        query.category = category;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ];
      }
      
      const [rawNews, total] = await Promise.all([
        newsCollection.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit * 3).toArray(),
        newsCollection.countDocuments(query),
      ]);

      const seenSlugs = new Set();
      const news = rawNews.filter(n => seenSlugs.has(n.slug) ? false : seenSlugs.add(n.slug)).slice(0, limit);

      return NextResponse.json({
        news,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, { headers: corsHeaders });
    }

    // Get breaking/headline news
    if (path === 'news/breaking') {
      const newsCollection = await getCollection('news');
      const news = await newsCollection
        .find({ status: 'published', isBreaking: true, publishedAt: { $lte: new Date() } })
        .sort({ publishedAt: -1 })
        .limit(10)
        .toArray();
      return NextResponse.json({ news }, { headers: corsHeaders });
    }

    // Get single news by ID
    if (path.match(/^news\/[a-zA-Z0-9-]+$/)) {
      const newsId = path.split('/')[1];
      const newsCollection = await getCollection('news');
      const news = await newsCollection.findOne({ id: newsId });
      
      if (!news) {
        return NextResponse.json({ error: 'News not found' }, { status: 404, headers: corsHeaders });
      }
      
      // Increment view count
      await newsCollection.updateOne({ id: newsId }, { $inc: { views: 1 } });
      
      return NextResponse.json({ news }, { headers: corsHeaders });
    }

    // ===== ADMIN NEWS ENDPOINTS =====
    
    // Get all news for admin (including drafts)
    if (path === 'admin/news') {
      const newsCollection = await getCollection('news');
      const status = searchParams.get('status');
      const limit = parseInt(searchParams.get('limit') || '50');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;
      
      let query = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      
      const [news, total] = await Promise.all([
        newsCollection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
        newsCollection.countDocuments(query),
      ]);
      
      return NextResponse.json({
        news,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, { headers: corsHeaders });
    }

    // ===== CATEGORIES =====
    
    if (path === 'categories') {
      const categoriesCollection = await getCollection('categories');
      const allCategories = await categoriesCollection.find({ isActive: true }).sort({ order: 1 }).toArray();
      const seen = new Set();
      const categories = allCategories.filter(c => seen.has(c.slug) ? false : seen.add(c.slug));
      return NextResponse.json({ categories }, { headers: corsHeaders });
    }

    // Admin - all categories
    if (path === 'admin/categories') {
      const categoriesCollection = await getCollection('categories');
      const allCategories = await categoriesCollection.find({}).sort({ order: 1 }).toArray();
      const seen = new Set();
      const categories = allCategories.filter(c => seen.has(c.slug) ? false : seen.add(c.slug));
      return NextResponse.json({ categories }, { headers: corsHeaders });
    }

    // ===== USERS/AUTHORS =====
    
    if (path === 'admin/users') {
      const usersCollection = await getCollection('users');
      const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ users }, { headers: corsHeaders });
    }

    if (path.match(/^authors\/[a-zA-Z0-9-]+$/)) {
      const authorId = path.split('/')[1];
      const usersCollection = await getCollection('users');
      const author = await usersCollection.findOne({ id: authorId, role: { $in: ['reporter', 'editor', 'admin'] } });
      
      if (!author) {
        return NextResponse.json({ error: 'Author not found' }, { status: 404, headers: corsHeaders });
      }
      
      // Get author's published articles
      const newsCollection = await getCollection('news');
      const articles = await newsCollection
        .find({ authorId, status: 'published' })
        .sort({ publishedAt: -1 })
        .limit(10)
        .toArray();
      
      return NextResponse.json({ author: { ...author, password: undefined }, articles }, { headers: corsHeaders });
    }

    // ===== ANALYTICS =====
    
    if (path === 'admin/analytics') {
      const newsCollection = await getCollection('news');
      const usersCollection = await getCollection('users');
      
      const [totalNews, publishedNews, draftNews, pendingNews, totalViews, totalUsers] = await Promise.all([
        newsCollection.countDocuments({}),
        newsCollection.countDocuments({ status: 'published' }),
        newsCollection.countDocuments({ status: 'draft' }),
        newsCollection.countDocuments({ status: 'pending' }),
        newsCollection.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]).toArray(),
        usersCollection.countDocuments({}),
      ]);
      
      // Top performing articles
      const topArticles = await newsCollection
        .find({ status: 'published' })
        .sort({ views: -1 })
        .limit(10)
        .toArray();
      
      return NextResponse.json({
        stats: {
          totalNews,
          publishedNews,
          draftNews,
          pendingNews,
          totalViews: totalViews[0]?.total || 0,
          totalUsers,
        },
        topArticles,
      }, { headers: corsHeaders });
    }

    // ===== CLOUDINARY SIGNATURE =====
    
    if (path === 'cloudinary/signature') {
      const folder = searchParams.get('folder') || 'news';
      const resourceType = searchParams.get('resource_type') || 'image';
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return NextResponse.json({ error: 'Cloudinary credentials are not configured' }, { status: 500, headers: corsHeaders });
      }
      const signature = generateUploadSignature(folder, resourceType);
      return NextResponse.json(signature, { headers: corsHeaders });
    }

    // ===== READING HISTORY =====
    
    if (path.match(/^users\/[a-zA-Z0-9_-]+\/history$/)) {
      const userId = path.split('/')[1];
      const historyCollection = await getCollection('reading_history');
      const history = await historyCollection
        .find({ userId })
        .sort({ lastRead: -1 })
        .limit(20)
        .toArray();
      return NextResponse.json({ history }, { headers: corsHeaders });
    }

    // ===== SUBSCRIPTIONS =====
    
    // Get subscription plans
    if (path === 'subscriptions/plans') {
      const plans = [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          period: 'forever',
          features: ['10 articles per day', 'Standard news access', 'Ad-supported'],
          popular: false,
        },
        {
          id: 'basic',
          name: 'Basic',
          price: 99,
          period: 'month',
          features: ['50 articles per day', 'Offline reading', 'Reduced ads', 'Email newsletter'],
          popular: false,
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 299,
          period: 'month',
          features: ['Unlimited articles', 'Ad-free experience', 'Exclusive content', 'Early access', 'Offline reading', 'Priority support'],
          popular: true,
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 999,
          period: 'month',
          features: ['Everything in Premium', 'API access', 'Multi-user accounts', 'Custom integrations', 'Dedicated support'],
          popular: false,
        },
      ];
      return NextResponse.json({ plans }, { headers: corsHeaders });
    }

    // Get user subscription
    if (path.match(/^subscriptions\/user\/[a-zA-Z0-9_-]+$/)) {
      const userId = path.split('/')[2];
      const subscriptionsCollection = await getCollection('subscriptions');
      const subscription = await subscriptionsCollection.findOne({ userId, status: 'active' });
      return NextResponse.json({ subscription: subscription || { plan: 'free', features: getSubscriptionFeatures('free') } }, { headers: corsHeaders });
    }

    // ===== ADS CONFIGURATION =====
    
    // Get ad placements config
    if (path === 'ads/config') {
      const adsConfig = {
        placements: [
          { id: 'header-banner', type: 'programmatic', position: 'header', size: '728x90', enabled: true },
          { id: 'sidebar-square', type: 'programmatic', position: 'sidebar', size: '300x250', enabled: true },
          { id: 'in-article-1', type: 'native', position: 'in-article', afterParagraph: 3, enabled: true },
          { id: 'in-article-2', type: 'native', position: 'in-article', afterParagraph: 7, enabled: true },
          { id: 'footer-banner', type: 'programmatic', position: 'footer', size: '728x90', enabled: true },
          { id: 'video-preroll', type: 'video', position: 'video-player', duration: 15, enabled: true },
        ],
        refreshInterval: 30000, // 30 seconds
        lazyLoad: true,
      };
      return NextResponse.json({ config: adsConfig }, { headers: corsHeaders });
    }

    // Get ad analytics (admin)
    if (path === 'admin/ads/analytics') {
      const adsCollection = await getCollection('ad_impressions');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [totalImpressions, todayImpressions, totalClicks, todayClicks, revenueData] = await Promise.all([
        adsCollection.countDocuments({}),
        adsCollection.countDocuments({ timestamp: { $gte: today } }),
        adsCollection.countDocuments({ clicked: true }),
        adsCollection.countDocuments({ clicked: true, timestamp: { $gte: today } }),
        adsCollection.aggregate([{ $group: { _id: null, total: { $sum: '$revenue' } } }]).toArray(),
      ]);
      
      const byType = await adsCollection.aggregate([
        { $group: { _id: '$adType', impressions: { $sum: 1 }, clicks: { $sum: { $cond: ['$clicked', 1, 0] } } } }
      ]).toArray();
      
      const byPlacement = await adsCollection.aggregate([
        { $group: { _id: '$placement', impressions: { $sum: 1 }, clicks: { $sum: { $cond: ['$clicked', 1, 0] } } } }
      ]).toArray();
      
      return NextResponse.json({
        stats: {
          totalImpressions,
          todayImpressions,
          totalClicks,
          todayClicks,
          ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
          totalRevenue: revenueData[0]?.total || 0,
        },
        byType,
        byPlacement,
      }, { headers: corsHeaders });
    }

    // ===== YOUTUBE LIVE STREAM =====

    // Get YouTube live stream status
    if (path === 'youtube/live') {
      const configCollection = await getCollection('config');
      const dbConfig = await configCollection.findOne({ key: 'youtube' });

      // Manual video ID set by admin — highest priority, embed immediately
      if (dbConfig?.videoId) {
        return NextResponse.json({
          isLive: dbConfig.isLive ?? true,
          configured: true,
          manual: true,
          videoId: dbConfig.videoId,
          channelId: dbConfig.channelId || process.env.YOUTUBE_CHANNEL_ID,
          title: dbConfig.title || null,
        }, { headers: corsHeaders });
      }

      const channelId = dbConfig?.channelId || process.env.YOUTUBE_CHANNEL_ID;
      const apiKey = process.env.YOUTUBE_API_KEY;

      // Channel ID alone is enough for iframe embed; API key is only needed for live detection
      if (!channelId || channelId.startsWith('TODO')) {
        return NextResponse.json({
          isLive: false,
          configured: false,
        }, { headers: corsHeaders });
      }

      // Uploads playlist ID = channel ID with UC → UU prefix swap
      const uploadsPlaylistId = 'UU' + channelId.slice(2);

      // No API key → fallback embed only (YouTube handles live redirect itself)
      if (!apiKey || apiKey.startsWith('TODO')) {
        return NextResponse.json({
          isLive: false,
          configured: true,
          channelId,
          uploadsPlaylistId,
          liveDetection: false,
        }, { headers: corsHeaders });
      }

      try {
        // Step 1: check if channel is currently live
        const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
        const liveRes = await fetch(liveUrl);
        const liveData = await liveRes.json();

        if (liveData.items && liveData.items.length > 0) {
          const liveVideo = liveData.items[0];
          return NextResponse.json({
            isLive: true,
            configured: true,
            liveDetection: true,
            channelId,
            videoId: liveVideo.id.videoId,
            title: liveVideo.snippet.title,
            thumbnail: liveVideo.snippet.thumbnails.high?.url,
            channelTitle: liveVideo.snippet.channelTitle,
          }, { headers: corsHeaders });
        }

        // Step 2: not live → fetch latest uploaded video
        const latestUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=1&key=${apiKey}`;
        const latestRes = await fetch(latestUrl);
        const latestData = await latestRes.json();

        if (latestData.items && latestData.items.length > 0) {
          const latest = latestData.items[0].snippet;
          return NextResponse.json({
            isLive: false,
            configured: true,
            liveDetection: true,
            channelId,
            videoId: latest.resourceId.videoId,
            title: latest.title,
            thumbnail: latest.thumbnails?.high?.url,
            channelTitle: latest.channelTitle,
          }, { headers: corsHeaders });
        }

        // Step 3: no videos found at all
        return NextResponse.json({
          isLive: false,
          configured: true,
          liveDetection: true,
          channelId,
        }, { headers: corsHeaders });
      } catch (error) {
        return NextResponse.json({
          isLive: false,
          configured: true,
          liveDetection: false,
          channelId,
          error: error.message,
        }, { headers: corsHeaders });
      }
    }

    // Get YouTube admin config
    if (path === 'admin/youtube-config') {
      const configCollection = await getCollection('config');
      const config = await configCollection.findOne({ key: 'youtube' });
      return NextResponse.json({ config: config || {} }, { headers: corsHeaders });
    }

    // ===== PUSH NOTIFICATION TOKENS =====

    // Get all push tokens for sending notifications
    if (path === 'admin/push-tokens') {
      const usersCollection = await getCollection('users');
      const users = await usersCollection.find({ fcmToken: { $ne: null } }).toArray();
      const tokens = users.map(u => ({ userId: u.id, token: u.fcmToken, email: u.email }));
      return NextResponse.json({ tokens, count: tokens.length }, { headers: corsHeaders });
    }

    // ===== EMAIL SUBSCRIBERS =====
    
    if (path === 'subscribers') {
      const subscribersCollection = await getCollection('email_subscribers');
      const subscribers = await subscribersCollection.find({ isActive: true }).toArray();
      return NextResponse.json({ subscribers, count: subscribers.length }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// ==================== POST ROUTES ====================
export async function POST(request) {
  const path = getPath(request);

  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is okay for some endpoints like seed
    }

    // Save YouTube admin config
    if (path === 'admin/youtube-config') {
      const { videoId, channelId, title, isLive } = body;
      const configCollection = await getCollection('config');
      await configCollection.updateOne(
        { key: 'youtube' },
        { $set: { key: 'youtube', videoId: videoId || null, channelId: channelId || null, title: title || null, isLive: !!isLive, updatedAt: new Date() } },
        { upsert: true }
      );
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // ===== NEWS CRUD =====

    // Create news article
    if (path === 'admin/news') {
      const newsCollection = await getCollection('news');
      
      const newsItem = {
        id: uuidv4(),
        title: body.title,
        slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content: body.content,
        excerpt: body.excerpt || body.content?.substring(0, 200),
        category: body.category,
        tags: body.tags || [],
        featuredImage: body.featuredImage || null,
        images: body.images || [],
        status: body.status || 'draft', // draft, pending, published, scheduled, rejected
        isBreaking: body.isBreaking || false,
        isFeatured: body.isFeatured || false,
        authorId: body.authorId,
        authorName: body.authorName,
        source: body.source || null,
        sourceUrl: body.sourceUrl || null,
        // SEO fields
        seoTitle: body.seoTitle || body.title,
        seoDescription: body.seoDescription || body.excerpt,
        seoKeywords: body.seoKeywords || [],
        // A/B Testing headlines
        headlineVariants: body.headlineVariants || [],
        activeHeadline: 0,
        // Scheduling
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        publishedAt: body.status === 'published' ? new Date() : null,
        // Workflow
        approvalHistory: [],
        corrections: [],
        // Analytics
        views: 0,
        shares: { whatsapp: 0, twitter: 0, facebook: 0 },
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await newsCollection.insertOne(newsItem);
      return NextResponse.json({ success: true, news: newsItem }, { status: 201, headers: corsHeaders });
    }

    // Submit for approval (Reporter -> Editor)
    if (path.match(/^admin\/news\/[a-zA-Z0-9-]+\/submit$/)) {
      const newsId = path.split('/')[2];
      const newsCollection = await getCollection('news');
      
      const result = await newsCollection.updateOne(
        { id: newsId },
        {
          $set: { status: 'pending', updatedAt: new Date() },
          $push: {
            approvalHistory: {
              action: 'submitted',
              by: body.userId,
              byName: body.userName,
              at: new Date(),
              comment: body.comment || 'Submitted for review',
            },
          },
        }
      );
      
      return NextResponse.json({ success: result.modifiedCount > 0 }, { headers: corsHeaders });
    }

    // Approve article (Editor/Admin)
    if (path.match(/^admin\/news\/[a-zA-Z0-9-]+\/approve$/)) {
      const newsId = path.split('/')[2];
      const newsCollection = await getCollection('news');
      
      const result = await newsCollection.updateOne(
        { id: newsId },
        {
          $set: { 
            status: 'published', 
            publishedAt: new Date(),
            updatedAt: new Date(),
          },
          $push: {
            approvalHistory: {
              action: 'approved',
              by: body.userId,
              byName: body.userName,
              at: new Date(),
              comment: body.comment || 'Approved for publication',
            },
          },
        }
      );
      
      return NextResponse.json({ success: result.modifiedCount > 0 }, { headers: corsHeaders });
    }

    // Reject article (Editor/Admin)
    if (path.match(/^admin\/news\/[a-zA-Z0-9-]+\/reject$/)) {
      const newsId = path.split('/')[2];
      const newsCollection = await getCollection('news');
      
      const result = await newsCollection.updateOne(
        { id: newsId },
        {
          $set: { status: 'rejected', updatedAt: new Date() },
          $push: {
            approvalHistory: {
              action: 'rejected',
              by: body.userId,
              byName: body.userName,
              at: new Date(),
              comment: body.comment || 'Rejected - needs revision',
            },
          },
        }
      );
      
      return NextResponse.json({ success: result.modifiedCount > 0 }, { headers: corsHeaders });
    }

    // Add correction to article
    if (path.match(/^admin\/news\/[a-zA-Z0-9-]+\/correction$/)) {
      const newsId = path.split('/')[2];
      const newsCollection = await getCollection('news');
      
      const result = await newsCollection.updateOne(
        { id: newsId },
        {
          $set: { updatedAt: new Date() },
          $push: {
            corrections: {
              id: uuidv4(),
              text: body.text,
              by: body.userId,
              byName: body.userName,
              at: new Date(),
            },
          },
        }
      );
      
      return NextResponse.json({ success: result.modifiedCount > 0 }, { headers: corsHeaders });
    }

    // Track share
    if (path.match(/^news\/[a-zA-Z0-9-]+\/share$/)) {
      const newsId = path.split('/')[1];
      const platform = body.platform; // whatsapp, twitter, facebook
      const newsCollection = await getCollection('news');
      
      await newsCollection.updateOne(
        { id: newsId },
        { $inc: { [`shares.${platform}`]: 1 } }
      );
      
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // ===== CATEGORIES =====
    
    if (path === 'admin/categories') {
      const categoriesCollection = await getCollection('categories');
      
      const category = {
        id: uuidv4(),
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: body.description || '',
        icon: body.icon || null,
        color: body.color || '#3B82F6',
        order: body.order || 0,
        isActive: body.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await categoriesCollection.insertOne(category);
      return NextResponse.json({ success: true, category }, { status: 201, headers: corsHeaders });
    }

    // ===== USERS =====
    
    // Register/Update user from Firebase Auth
    if (path === 'users/sync') {
      const usersCollection = await getCollection('users');
      
      const existingUser = await usersCollection.findOne({ firebaseUid: body.firebaseUid });
      
      if (existingUser) {
        // Update existing user
        await usersCollection.updateOne(
          { firebaseUid: body.firebaseUid },
          {
            $set: {
              email: body.email,
              name: body.name,
              avatar: body.avatar,
              lastLogin: new Date(),
              updatedAt: new Date(),
            },
          }
        );
        const updatedUser = await usersCollection.findOne({ firebaseUid: body.firebaseUid });
        return NextResponse.json({ success: true, user: updatedUser, isNew: false }, { headers: corsHeaders });
      }
      
      // Create new user
      const newUser = {
        id: uuidv4(),
        firebaseUid: body.firebaseUid,
        email: body.email,
        name: body.name,
        avatar: body.avatar,
        phone: body.phone || null,
        role: 'reader', // reader, reporter, editor, admin
        isVerified: false,
        bio: '',
        fcmToken: body.fcmToken || null,
        preferences: {
          categories: [],
          notifications: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      };
      
      await usersCollection.insertOne(newUser);
      return NextResponse.json({ success: true, user: newUser, isNew: true }, { status: 201, headers: corsHeaders });
    }

    // Update FCM token
    if (path === 'users/fcm-token') {
      const usersCollection = await getCollection('users');
      
      await usersCollection.updateOne(
        { firebaseUid: body.firebaseUid },
        { $set: { fcmToken: body.fcmToken, updatedAt: new Date() } }
      );
      
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // ===== READING HISTORY =====
    
    if (path === 'users/reading-history') {
      const historyCollection = await getCollection('reading_history');
      
      await historyCollection.updateOne(
        { odellerId: body.odellerId || `${body.userId}_${body.newsId}` },
        {
          $set: {
            userId: body.userId,
            newsId: body.newsId,
            newsTitle: body.newsTitle,
            newsExcerpt: body.newsExcerpt || '',
            newsFeaturedImage: body.newsFeaturedImage || '',
            newsCategory: body.newsCategory || '',
            scrollPosition: body.scrollPosition || 0,
            readPercentage: body.readPercentage || 0,
            lastRead: new Date(),
          },
        },
        { upsert: true }
      );
      
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // ===== ADMIN USER MANAGEMENT =====
    
    if (path === 'admin/users') {
      const usersCollection = await getCollection('users');
      
      const user = {
        id: uuidv4(),
        email: body.email,
        name: body.name,
        role: body.role || 'reporter',
        isVerified: body.isVerified || false,
        bio: body.bio || '',
        avatar: body.avatar || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await usersCollection.insertOne(user);
      return NextResponse.json({ success: true, user }, { status: 201, headers: corsHeaders });
    }

    // ===== SUBSCRIPTIONS =====
    
    // Create subscription
    if (path === 'subscriptions') {
      const subscriptionsCollection = await getCollection('subscriptions');
      
      const subscription = {
        id: uuidv4(),
        userId: body.userId,
        email: body.email,
        plan: body.plan || 'free', // free, basic, premium, enterprise
        status: 'active', // active, cancelled, expired
        startDate: new Date(),
        endDate: body.plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for paid
        features: getSubscriptionFeatures(body.plan || 'free'),
        paymentMethod: body.paymentMethod || null,
        autoRenew: body.autoRenew !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await subscriptionsCollection.insertOne(subscription);
      return NextResponse.json({ success: true, subscription }, { status: 201, headers: corsHeaders });
    }

    // Cancel subscription
    if (path.match(/^subscriptions\/[a-zA-Z0-9-]+\/cancel$/)) {
      const subscriptionId = path.split('/')[1];
      const subscriptionsCollection = await getCollection('subscriptions');
      
      await subscriptionsCollection.updateOne(
        { id: subscriptionId },
        { $set: { status: 'cancelled', autoRenew: false, updatedAt: new Date() } }
      );
      
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // ===== AD IMPRESSIONS =====
    
    // Track ad impression
    if (path === 'ads/impression') {
      const adsCollection = await getCollection('ad_impressions');
      
      const impression = {
        id: uuidv4(),
        adId: body.adId,
        adType: body.adType, // programmatic, native, video
        placement: body.placement, // header, sidebar, in-article, footer
        userId: body.userId || null,
        sessionId: body.sessionId,
        newsId: body.newsId || null,
        timestamp: new Date(),
        clicked: false,
        revenue: body.estimatedRevenue || 0,
      };
      
      await adsCollection.insertOne(impression);
      return NextResponse.json({ success: true, impressionId: impression.id }, { headers: corsHeaders });
    }

    // Track ad click
    if (path === 'ads/click') {
      const adsCollection = await getCollection('ad_impressions');
      
      await adsCollection.updateOne(
        { id: body.impressionId },
        { $set: { clicked: true, clickedAt: new Date() } }
      );
      
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // ===== SEED DEFAULT DATA =====
    
    if (path === 'seed') {
      const categoriesCollection = await getCollection('categories');
      const newsCollection = await getCollection('news');
      
      // Check if already seeded
      const existingCategories = await categoriesCollection.countDocuments({});
      if (existingCategories > 0) {
        return NextResponse.json({ message: 'Already seeded' }, { headers: corsHeaders });
      }
      
      // Seed categories (upsert by slug to avoid race condition duplicates)
      const defaultCategories = [
        { id: uuidv4(), name: 'Politics', slug: 'politics', color: '#DC2626', icon: 'Building', order: 1, isActive: true },
        { id: uuidv4(), name: 'Sports', slug: 'sports', color: '#16A34A', icon: 'Trophy', order: 2, isActive: true },
        { id: uuidv4(), name: 'Business', slug: 'business', color: '#2563EB', icon: 'Briefcase', order: 3, isActive: true },
        { id: uuidv4(), name: 'Entertainment', slug: 'entertainment', color: '#9333EA', icon: 'Film', order: 4, isActive: true },
        { id: uuidv4(), name: 'Technology', slug: 'technology', color: '#0891B2', icon: 'Laptop', order: 5, isActive: true },
        { id: uuidv4(), name: 'Local', slug: 'local', color: '#CA8A04', icon: 'MapPin', order: 6, isActive: true },
        { id: uuidv4(), name: 'National', slug: 'national', color: '#EA580C', icon: 'Flag', order: 7, isActive: true },
        { id: uuidv4(), name: 'World', slug: 'world', color: '#4F46E5', icon: 'Globe', order: 8, isActive: true },
      ].map(cat => ({ ...cat, createdAt: new Date(), updatedAt: new Date() }));

      await Promise.all(defaultCategories.map(cat =>
        categoriesCollection.updateOne({ slug: cat.slug }, { $setOnInsert: cat }, { upsert: true })
      ));
      
      // Seed sample news
      const sampleNews = [
        {
          id: uuidv4(),
          title: 'Breaking: Major Tech Company Announces Revolutionary AI Product',
          slug: 'tech-company-ai-product',
          content: 'In a groundbreaking announcement today, a leading technology company unveiled their latest AI-powered product that promises to transform the industry. The new system combines advanced machine learning with intuitive user interfaces to deliver unprecedented capabilities. Industry analysts predict this could reshape the competitive landscape for years to come. The company plans to begin rolling out the product to select markets next quarter, with a global launch expected by year end.',
          excerpt: 'A leading tech company unveils groundbreaking AI product set to transform the industry.',
          category: 'technology',
          tags: ['AI', 'technology', 'innovation'],
          featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
          status: 'published',
          isBreaking: true,
          isFeatured: true,
          authorId: 'system',
          authorName: 'NewsDesk Team',
          views: 1250,
          shares: { whatsapp: 45, twitter: 89, facebook: 32 },
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          title: 'Local Team Wins Championship in Historic Victory',
          slug: 'local-team-championship-victory',
          content: 'The local sports team has achieved a historic victory, winning the championship for the first time in over two decades. Fans flooded the streets in celebration as the final whistle blew, marking the end of a remarkable season. The team\'s coach praised the players\' dedication and teamwork, while the captain dedicated the win to the loyal supporters who never lost faith.',
          excerpt: 'Historic championship win brings joy to fans after two decades of waiting.',
          category: 'sports',
          tags: ['sports', 'championship', 'local'],
          featuredImage: 'https://images.unsplash.com/photo-1461896836934- voices-a2438c?w=800',
          status: 'published',
          isBreaking: false,
          isFeatured: true,
          authorId: 'system',
          authorName: 'NewsDesk Team',
          views: 890,
          shares: { whatsapp: 120, twitter: 56, facebook: 78 },
          publishedAt: new Date(Date.now() - 3600000),
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 3600000),
        },
        {
          id: uuidv4(),
          title: 'Government Announces New Economic Policy Package',
          slug: 'government-economic-policy',
          content: 'The government today unveiled a comprehensive economic policy package aimed at boosting growth and creating jobs. The measures include tax incentives for small businesses, infrastructure investments, and support for green energy initiatives. Economic experts have given mixed reactions, with some praising the ambitious scope while others question the fiscal implications.',
          excerpt: 'New economic measures aim to boost growth and create employment opportunities.',
          category: 'politics',
          tags: ['politics', 'economy', 'policy'],
          featuredImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
          status: 'published',
          isBreaking: false,
          isFeatured: false,
          authorId: 'system',
          authorName: 'NewsDesk Team',
          views: 567,
          shares: { whatsapp: 23, twitter: 45, facebook: 19 },
          publishedAt: new Date(Date.now() - 7200000),
          createdAt: new Date(Date.now() - 7200000),
          updatedAt: new Date(Date.now() - 7200000),
        },
        {
          id: uuidv4(),
          title: 'Stock Markets Reach New Heights Amid Positive Earnings Reports',
          slug: 'stock-markets-new-heights',
          content: 'Global stock markets surged to record highs today as major corporations reported better-than-expected quarterly earnings. Technology and healthcare sectors led the gains, with investors showing renewed confidence in economic recovery. Analysts suggest the positive momentum could continue if inflation concerns remain subdued.',
          excerpt: 'Markets rally on strong corporate earnings, reaching historic levels.',
          category: 'business',
          tags: ['business', 'stocks', 'markets'],
          featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
          status: 'published',
          isBreaking: false,
          isFeatured: false,
          authorId: 'system',
          authorName: 'NewsDesk Team',
          views: 432,
          shares: { whatsapp: 12, twitter: 34, facebook: 8 },
          publishedAt: new Date(Date.now() - 10800000),
          createdAt: new Date(Date.now() - 10800000),
          updatedAt: new Date(Date.now() - 10800000),
        },
        {
          id: uuidv4(),
          title: 'Award-Winning Film Director Announces New Project',
          slug: 'film-director-new-project',
          content: 'The acclaimed director known for critically acclaimed films has announced their next ambitious project. The new film will be a sweeping epic spanning multiple decades and continents. Production is set to begin next spring with an all-star cast already attached to the project.',
          excerpt: 'Celebrated filmmaker reveals details of upcoming epic production.',
          category: 'entertainment',
          tags: ['entertainment', 'movies', 'cinema'],
          featuredImage: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
          status: 'published',
          isBreaking: false,
          isFeatured: false,
          authorId: 'system',
          authorName: 'NewsDesk Team',
          views: 789,
          shares: { whatsapp: 56, twitter: 89, facebook: 45 },
          publishedAt: new Date(Date.now() - 14400000),
          createdAt: new Date(Date.now() - 14400000),
          updatedAt: new Date(Date.now() - 14400000),
        },
      ];
      
      await Promise.all(sampleNews.map(n =>
        newsCollection.updateOne(
          { slug: n.slug },
          { $setOnInsert: { ...n, corrections: [], approvalHistory: [], headlineVariants: [], activeHeadline: 0, seoTitle: n.title, seoDescription: n.excerpt, seoKeywords: n.tags } },
          { upsert: true }
        )
      ));
      
      return NextResponse.json({ success: true, message: 'Database seeded successfully' }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// ==================== PUT ROUTES ====================
export async function PUT(request) {
  const path = getPath(request);

  try {
    const body = await request.json();

    // Update news article
    if (path.match(/^admin\/news\/[a-zA-Z0-9-]+$/)) {
      const newsId = path.split('/')[2];
      const newsCollection = await getCollection('news');
      
      const updateData = {
        ...body,
        updatedAt: new Date(),
      };
      
      // Handle publish date
      if (body.status === 'published' && !body.publishedAt) {
        updateData.publishedAt = new Date();
      }
      
      if (body.scheduledAt) {
        updateData.scheduledAt = new Date(body.scheduledAt);
      }
      
      delete updateData.id;
      delete updateData._id;
      
      const result = await newsCollection.updateOne(
        { id: newsId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'News not found' }, { status: 404, headers: corsHeaders });
      }
      
      const updatedNews = await newsCollection.findOne({ id: newsId });
      return NextResponse.json({ success: true, news: updatedNews }, { headers: corsHeaders });
    }

    // Update category
    if (path.match(/^admin\/categories\/[a-zA-Z0-9-]+$/)) {
      const categoryId = path.split('/')[2];
      const categoriesCollection = await getCollection('categories');
      
      const updateData = {
        ...body,
        updatedAt: new Date(),
      };
      
      delete updateData.id;
      delete updateData._id;
      
      const result = await categoriesCollection.updateOne(
        { id: categoryId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404, headers: corsHeaders });
      }
      
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // Update user role/status
    if (path.match(/^admin\/users\/[a-zA-Z0-9-]+$/)) {
      const userId = path.split('/')[2];
      const usersCollection = await getCollection('users');
      
      const updateData = {
        ...body,
        updatedAt: new Date(),
      };
      
      delete updateData.id;
      delete updateData._id;
      delete updateData.firebaseUid;
      
      const result = await usersCollection.updateOne(
        { id: userId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
      }
      
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// ==================== DELETE ROUTES ====================
export async function DELETE(request) {
  const path = getPath(request);

  try {
    // Delete news article
    if (path.match(/^admin\/news\/[a-zA-Z0-9-]+$/)) {
      const newsId = path.split('/')[2];
      const newsCollection = await getCollection('news');
      
      // Get article to delete associated images
      const article = await newsCollection.findOne({ id: newsId });
      
      if (!article) {
        return NextResponse.json({ error: 'News not found' }, { status: 404, headers: corsHeaders });
      }
      
      // Delete from Cloudinary if images exist
      if (article.featuredImage && article.featuredImage.includes('cloudinary')) {
        // Extract public_id and delete
        // TODO: Implement cloudinary deletion
      }
      
      await newsCollection.deleteOne({ id: newsId });
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // Delete category
    if (path.match(/^admin\/categories\/[a-zA-Z0-9-]+$/)) {
      const categoryId = path.split('/')[2];
      const categoriesCollection = await getCollection('categories');
      
      await categoriesCollection.deleteOne({ id: categoryId });
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // Delete user
    if (path.match(/^admin\/users\/[a-zA-Z0-9-]+$/)) {
      const userId = path.split('/')[2];
      const usersCollection = await getCollection('users');
      
      await usersCollection.deleteOne({ id: userId });
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
