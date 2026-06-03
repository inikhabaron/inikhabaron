import { getDatabase } from '@/lib/mongodb';

export async function ensureIndexes() {
  try {
    const db = await getDatabase();
    
    console.log('Creating database indexes...');

    // News collection indexes
    await db.collection('news').createIndex({ status: 1, publishedAt: -1 });
    console.log('✓ news: (status, publishedAt)');
    
    await db.collection('news').createIndex({ category: 1, publishedAt: -1 });
    console.log('✓ news: (category, publishedAt)');
    
    await db.collection('news').createIndex({ isBreaking: 1, publishedAt: -1 });
    console.log('✓ news: (isBreaking, publishedAt)');
    
    await db.collection('news').createIndex({ id: 1 }, { unique: true });
    console.log('✓ news: (id) unique');
    
    await db.collection('news').createIndex({ slug: 1 }, { unique: true });
    console.log('✓ news: (slug) unique');

    // User collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✓ users: (email) unique');
    
    await db.collection('users').createIndex({ firebaseUid: 1 });
    console.log('✓ users: (firebaseUid)');
    
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    console.log('✓ users: (id) unique');

    // Categories
    await db.collection('categories').createIndex({ slug: 1 }, { unique: true });
    console.log('✓ categories: (slug) unique');
    
    await db.collection('categories').createIndex({ isActive: 1 });
    console.log('✓ categories: (isActive)');

    // Ad impressions
    await db.collection('ad_impressions').createIndex({ timestamp: -1 });
    console.log('✓ ad_impressions: (timestamp)');
    
    await db.collection('ad_impressions').createIndex({ newsId: 1, timestamp: -1 });
    console.log('✓ ad_impressions: (newsId, timestamp)');

    // Newsletter
    await db.collection('newsletter').createIndex({ email: 1 }, { unique: true });
    console.log('✓ newsletter: (email) unique');

    // Reading history
    await db.collection('reading_history').createIndex({ userId: 1, lastRead: -1 });
    console.log('✓ reading_history: (userId, lastRead)');

    console.log('✅ All indexes created successfully');
    return true;
  } catch (error) {
    console.error('❌ Index creation error:', error.message);
    return false;
  }
}
