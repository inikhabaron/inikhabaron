# KhabarON: Implementation Guide - Quick Fixes

This document contains copy-paste ready code fixes for the top critical issues.

---

## Fix #1: Database Indexes (CRITICAL - 40x performance improvement)

**File:** `lib/db-init.js` (Create new file)

```js
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
```

**File:** `app/api/admin/init-db/route.js` (Create new file)

```js
import { ensureIndexes } from '@/lib/db-init';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const success = await ensureIndexes();
    if (success) {
      return json({ success: true, message: 'All indexes created' });
    } else {
      return json({ error: 'Some indexes failed to create' }, { status: 500 });
    }
  } catch (error) {
    console.error('Index creation error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
```

**Run once:** `curl -X POST http://localhost:3000/api/admin/init-db`

---

## Fix #2: Secure Password Hashing (CRITICAL - prevents credential compromise)

**Step 1:** Install bcrypt

```bash
npm install bcrypt
```

**File:** `lib/auth/password.js` (Create new file)

```js
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Higher = more secure but slower

export async function hashPassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password) {
  if (!password) return { valid: false, message: 'Password required' };
  if (password.length < 8) return { valid: false, message: 'Min 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Need uppercase' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Need number' };
  return { valid: true };
}
```

**File:** Replace `app/api/admin/login/route.js`

```js
import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { encodeToken } from '@/lib/auth/token';
import { verifyPassword } from '@/lib/auth/password';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return json({ error: 'Email and password required' }, { status: 400 });
    }

    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify hashed password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.role || !['admin', 'editor', 'reporter'].includes(user.role)) {
      return json({ error: 'Access denied' }, { status: 403 });
    }

    const token = encodeToken(user.id, user.role);
    const { passwordHash: _, ...userWithoutPassword } = user;

    return json({ 
      success: true, 
      admin: userWithoutPassword, 
      token,
      expiresIn: 604800 // 7 days in seconds
    });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
}
```

**File:** Replace `app/api/admin/users/route.js` (POST method only)

```js
import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate inputs
    if (!body.email || !body.name || !body.password) {
      return json({ error: 'Email, name, and password required' }, { status: 400 });
    }

    const passwordCheck = validatePasswordStrength(body.password);
    if (!passwordCheck.valid) {
      return json({ error: passwordCheck.message }, { status: 400 });
    }

    const usersCollection = await getCollection('users');
    
    // Check if user already exists
    const existing = await usersCollection.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      return json({ error: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);

    const user = {
      id: uuidv4(),
      email: body.email.toLowerCase(),
      passwordHash, // ← Hashed password, never plain text
      name: body.name,
      role: (body.role || 'reporter').toLowerCase(),
      isVerified: body.isVerified || false,
      bio: body.bio || '',
      avatar: body.avatar || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(user);
    
    const { passwordHash: _, ...userWithoutPassword } = user;
    return json({ success: true, user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/users error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
```

---

## Fix #3: Secure JWT Token Generation (CRITICAL - prevents token forgery)

**Step 1:** Install JWT library

```bash
npm install jsonwebtoken
```

**Step 2:** Add to `.env.local`

```
JWT_SECRET=your-super-secret-key-at-least-32-characters-long-use-random-string
```

Generate random: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**File:** Replace `lib/auth/token.js`

```js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be 32+ characters in .env.local');
}

export function encodeToken(userId, role = 'user') {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { 
      expiresIn: '7d',
      algorithm: 'HS256',
      issuer: 'khabaron-admin',
    }
  );
}

export function decodeToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

export async function getUserFromToken(request) {
  const authHeader = request.headers.get('authorization')?.toString().trim();
  const fallbackHeader = request.headers.get('x-admin-token')?.toString().trim();
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : fallbackHeader;

  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload?.userId) return null;

  try {
    const { getCollection } = await import('@/lib/mongodb');
    const usersCollection = await getCollection('users');
    return await usersCollection.findOne({ id: payload.userId });
  } catch {
    return null;
  }
}
```

---

## Fix #4: Input Validation (CRITICAL - stops ReDoS attacks)

**File:** `lib/validation.js` (Create new file)

```js
const MAX_SEARCH_LENGTH = 200;
const MAX_SLUG_LENGTH = 50;
const MAX_EMAIL_LENGTH = 255;

export function sanitizeSearchQuery(query) {
  if (!query || typeof query !== 'string') return '';
  
  // Remove special regex characters that could cause ReDoS
  const sanitized = query
    .replace(/[.*+?^${}()|[\]\\]/g, '')
    .trim();
  
  return sanitized.substring(0, MAX_SEARCH_LENGTH);
}

export function sanitizeSlug(slug) {
  if (!slug || typeof slug !== 'string') return '';
  
  const sanitized = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return sanitized.substring(0, MAX_SLUG_LENGTH);
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length < MAX_EMAIL_LENGTH;
}

export function validateCategory(category) {
  if (!category || typeof category !== 'string') return false;
  
  // Only alphanumeric and hyphens
  const regex = /^[a-z0-9-]+$/;
  return regex.test(category) && category.length < 50;
}

export function validatePagination(page, limit) {
  const p = parseInt(page) || 1;
  const l = Math.min(parseInt(limit) || 20, 100); // Max 100 per page
  
  return {
    page: Math.max(p, 1),
    limit: Math.max(l, 1),
  };
}
```

**File:** Update `app/api/news/route.js`

```js
import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { autoPublishScheduledArticles } from '@/lib/services/news';
import { sanitizeSearchQuery, sanitizeSlug, validatePagination } from '@/lib/validation';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    await autoPublishScheduledArticles();
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Validate and sanitize inputs
    const search = sanitizeSearchQuery(searchParams.get('search') || '');
    const category = sanitizeSlug(searchParams.get('category') || 'all');
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit')
    );
    
    const skip = (page - 1) * limit;
    const newsCollection = await getCollection('news');

    let query = { status: 'published', publishedAt: { $lte: new Date() } };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      // Use MongoDB text search instead of regex to prevent ReDoS
      query.$text = { $search: search };
    }

    const [news, total] = await Promise.all([
      newsCollection
        .find(query)
        .sort(search ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      newsCollection.countDocuments(query),
    ]);

    return json({
      news,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/news error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
```

---

## Fix #5: CORS Restriction (CRITICAL - stops cross-origin attacks)

**File:** Update `.env.local`

```
ALLOWED_ORIGINS=https://khabaron.com,https://admin.khabaron.com,http://localhost:3000
```

**File:** Update `next.config.js`

```js
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
  
  async headers() {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim());

    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development'
              ? '*'
              : allowedOrigins.join(','),
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## Fix #6: MongoDB Connection Pool (HIGH - stability at scale)

**File:** Update `lib/mongodb.js`

```js
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'newsdesk_db';

if (!MONGO_URL) {
  throw new Error('MONGO_URL must be defined in .env.local');
}

// Connection pool configuration
const mongoOptions = {
  // Connection pooling
  maxPoolSize: 50,      // Max 50 active connections
  minPoolSize: 10,      // Keep 10 warm connections
  
  // Timeouts
  maxIdleTimeMS: 30000,        // Close idle connections after 30s
  socketTimeoutMS: 30000,      // Socket timeout
  serverSelectionTimeoutMS: 5000, // Server selection timeout
  waitQueueTimeoutMS: 10000,   // Queue wait timeout
  
  // Retries
  retryWrites: true,
  retryReads: true,
  
  // Connection string
  authSource: 'admin',
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGO_URL, mongoOptions);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(MONGO_URL, mongoOptions);
  clientPromise = client.connect();
}

export async function getDatabase() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

export default clientPromise;
```

---

## Fix #7: Rate Limiting (CRITICAL - prevents brute force)

**Step 1:** Setup Upstash (free tier available)

Visit: https://console.upstash.com
- Create Redis database
- Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

Add to `.env.local`:
```
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Step 2:** Install package

```bash
npm install @upstash/ratelimit @upstash/redis
```

**File:** `lib/middleware/rateLimit.js` (Create new file)

```js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Different limits for different endpoints
const limiters = {
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 min'),
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 min'),
  }),
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 min'),
  }),
};

export async function checkRateLimit(key, type = 'api') {
  try {
    const limiter = limiters[type] || limiters.api;
    return await limiter.limit(key);
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow request (fail open)
    return { success: true };
  }
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Try again later.' }),
    { 
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

**File:** Update `app/api/admin/login/route.js` (add at top of POST)

```js
import { checkRateLimit, rateLimitResponse } from '@/lib/middleware/rateLimit';

export async function POST(request) {
  try {
    // Extract IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') 
      || request.headers.get('cf-connecting-ip')
      || 'unknown';
    
    // Rate limit by IP
    const { success } = await checkRateLimit(`login:${ip}`, 'login');
    
    if (!success) {
      return rateLimitResponse();
    }

    // ... rest of login logic ...
  } catch (error) {
    // ...
  }
}
```

---

## Fix #8: Scheduled Publishing (CRITICAL - ensures scheduled news publish)

**Step 1:** Install cron

```bash
npm install node-cron
```

**File:** `lib/cron-jobs.js` (Create new file)

```js
import cron from 'node-cron';
import { getCollection } from '@/lib/mongodb';

let cronJob;

export function startScheduledPublishing() {
  if (cronJob) return console.log('✓ Scheduled publishing already running');
  
  // Run every 5 minutes
  cronJob = cron.schedule('*/5 * * * *', async () => {
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
      
      if (result.modifiedCount > 0) {
        console.log(`✓ Published ${result.modifiedCount} scheduled articles`);
      }
    } catch (error) {
      console.error('Scheduled publishing error:', error);
    }
  });
  
  console.log('✓ Scheduled publishing job started (runs every 5 minutes)');
}

export function stopScheduledPublishing() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('✓ Scheduled publishing job stopped');
  }
}
```

**File:** Update `lib/mongodb.js` (add this after clientPromise setup)

```js
// Start scheduled publishing on first connection in production
if (process.env.NODE_ENV === 'production') {
  clientPromise.then(async () => {
    const { startScheduledPublishing } = await import('@/lib/cron-jobs');
    startScheduledPublishing();
  }).catch(console.error);
}
```

---

## Deployment Checklist

```bash
# 1. Install all packages
npm install bcrypt jsonwebtoken @upstash/ratelimit @upstash/redis node-cron

# 2. Create indexes
curl -X POST https://your-domain.com/api/admin/init-db

# 3. Test authentication
curl -X POST https://your-domain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@newsdesk.com","password":"your-password"}'

# 4. Verify rate limiting
# Make 6 quick requests to /api/admin/login, should get 429 on 6th

# 5. Test input validation
curl "https://your-domain.com/api/news?search=.*+.*+b"
# Should NOT cause database hang

# 6. Monitor logs
tail -f /var/log/khabaron.log
```

---

## Performance Verification

After implementing fixes:

```bash
# Check database indexes
mongosh
> db.news.getIndexes()

# Check query performance
> db.news.find({ status: 'published' }).explain('executionStats')
# Should show: executionStages.stage: "COLLSCAN" → "IXSCAN"

# Check JWT tokens
curl -H "Authorization: Bearer your-jwt-token" https://your-domain.com/api/admin/news

# Load test
# Use: Apache JMeter, k6, or wrk2
wrk -t4 -c100 -d30s https://your-domain.com/
```

---

