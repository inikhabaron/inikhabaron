import swaggerJsdoc from 'swagger-jsdoc';
import { NextResponse } from 'next/server';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NewsDesk API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for the NewsDesk platform',
      contact: {
        name: 'API Support',
        email: 'support@newsdesk.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://newsdesk.com/api',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        NewsArticle: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'news-123' },
            title: { type: 'string', example: 'Breaking News Title' },
            slug: { type: 'string', example: 'breaking-news-title' },
            content: { type: 'string', example: 'Full article content...' },
            excerpt: { type: 'string', example: 'Short summary...' },
            category: { type: 'string', example: 'technology' },
            tags: { type: 'array', items: { type: 'string' }, example: ['AI', 'tech'] },
            featuredImage: { type: 'string', example: 'https://example.com/image.jpg' },
            status: { type: 'string', enum: ['draft', 'pending', 'published', 'scheduled', 'rejected'] },
            isBreaking: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            authorName: { type: 'string' },
            views: { type: 'number' },
            shares: { type: 'object', properties: { whatsapp: { type: 'number' }, twitter: { type: 'number' }, facebook: { type: 'number' } } },
            publishedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            color: { type: 'string', example: '#DC2626' },
            icon: { type: 'string' },
            order: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'editor', 'reporter', 'user'] },
            isVerified: { type: 'boolean' },
            bio: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AdminLoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@newsdesk.com' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        AdminLoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            admin: { $ref: '#/components/schemas/User' },
            token: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            status: { type: 'number' },
          },
        },
        Reel: {
          type: 'object',
          description: 'A short-video "reel" document as returned by every reels endpoint. `reporter`/`linkedArticle`/`thumbnails` are joined/derived server-side — never stored on the document itself.',
          properties: {
            id: { type: 'string', example: 'dd145a90-cb83-4ca0-94c7-83ecb000d0d9' },
            title: { type: 'string', example: 'City council approves new metro line' },
            description: { type: 'string', example: 'Full coverage of today’s announcement.' },
            video: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'Raw Cloudinary upload URL — do NOT play this directly.', example: 'https://res.cloudinary.com/demo/video/upload/v1/reels/abc123.mp4' },
                publicId: { type: 'string', example: 'reels/abc123' },
                duration: { type: 'number', description: 'Seconds', example: 42 },
                width: { type: 'number', example: 1080 },
                height: { type: 'number', example: 1920 },
                format: { type: 'string', example: 'mp4' },
                bytes: { type: 'number', example: 13928110 },
                playbackUrl: { type: 'string', description: 'Delivery-optimized (f_auto,q_auto) URL — use this for playback.', example: 'https://res.cloudinary.com/demo/video/upload/f_auto,q_auto/reels/abc123.mp4' },
                playbackUrlLowBandwidth: { type: 'string', description: 'Same, with q_auto:low — use on constrained networks.', example: 'https://res.cloudinary.com/demo/video/upload/f_auto,q_auto:low/reels/abc123.mp4' },
              },
            },
            thumbnail: { type: 'object', nullable: true, description: 'Admin-uploaded custom thumbnail override, if any.', properties: { url: { type: 'string' }, publicId: { type: 'string' } } },
            thumbnails: {
              type: 'object',
              nullable: true,
              description: 'Ready-to-use derived thumbnail URLs at three sizes (from the custom thumbnail if set, else auto-derived from the video frame).',
              properties: {
                small: { type: 'string', example: 'https://res.cloudinary.com/demo/video/upload/so_0,w_150,h_267,c_fill/reels/abc123.jpg' },
                medium: { type: 'string' },
                large: { type: 'string' },
              },
            },
            category: { type: 'string', example: 'politics' },
            tags: { type: 'array', items: { type: 'string' }, example: ['metro', 'infrastructure'] },
            reporterId: { type: 'string', example: 'reporter-uuid-123' },
            reporter: { type: 'object', nullable: true, description: 'Joined at read time from reporterId — never stored on the reel.', properties: { id: { type: 'string' }, name: { type: 'string' }, avatar: { type: 'string' } } },
            location: {
              type: 'object',
              properties: { enabled: { type: 'boolean' }, scope: { type: 'string', enum: ['national', 'state', 'district'] }, country: { type: 'string' }, stateName: { type: 'string' }, districtName: { type: 'string' } },
            },
            language: { type: 'string', enum: ['en', 'hi'], example: 'en' },
            linkedArticleId: { type: 'string', nullable: true },
            linkedArticle: { type: 'object', nullable: true, description: 'Joined preview of the linked news article, if any.', properties: { id: { type: 'string' }, title: { type: 'string' }, slug: { type: 'string' } } },
            status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'unpublished'] },
            scheduledAt: { type: 'string', format: 'date-time', nullable: true },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
            isFeatured: { type: 'boolean' },
            isSensitive: { type: 'boolean', description: 'Client should show a tap-to-view overlay before playback when true.' },
            isReported: { type: 'boolean' },
            reportCount: { type: 'number' },
            reportStatus: { type: 'string', enum: ['none', 'pending', 'reviewed', 'actioned'] },
            isDeleted: { type: 'boolean' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            isAd: { type: 'boolean', description: 'Future-monetization placeholder, unused today.' },
            sponsorId: { type: 'string', nullable: true },
            campaignId: { type: 'string', nullable: true },
            views: { type: 'number' },
            threeSecondViews: { type: 'number' },
            completedViews: { type: 'number' },
            replayCount: { type: 'number' },
            exitCount: { type: 'number' },
            totalWatchTimeMs: { type: 'number' },
            likeCount: { type: 'number' },
            bookmarkCount: { type: 'number' },
            commentCount: { type: 'number' },
            shares: {
              type: 'object',
              properties: { whatsapp: { type: 'number' }, twitter: { type: 'number' }, facebook: { type: 'number' }, instagram: { type: 'number' }, copyLink: { type: 'number' }, other: { type: 'number' } },
            },
            createdBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ReelCreateRequest: {
          type: 'object',
          required: ['title', 'video'],
          properties: {
            title: { type: 'string', example: 'City council approves new metro line' },
            description: { type: 'string' },
            video: {
              type: 'object',
              required: ['url'],
              description: 'The object returned by the client-side Cloudinary video upload.',
              properties: { url: { type: 'string' }, publicId: { type: 'string' }, duration: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' }, format: { type: 'string' }, bytes: { type: 'number' } },
            },
            thumbnail: { type: 'object', nullable: true, properties: { url: { type: 'string' } } },
            category: { type: 'string', example: 'politics' },
            tags: { type: 'array', items: { type: 'string' } },
            reporterId: { type: 'string', description: 'Defaults to the uploading staff user if omitted.' },
            location: { type: 'object' },
            language: { type: 'string', enum: ['en', 'hi'], default: 'en' },
            linkedArticleId: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'unpublished'], default: 'draft' },
            scheduledAt: { type: 'string', format: 'date-time' },
            isFeatured: { type: 'boolean', default: false },
            isSensitive: { type: 'boolean', default: false },
          },
        },
        ReelUpdateRequest: {
          type: 'object',
          description: 'Same shape as ReelCreateRequest, all fields optional — only fields present in the body are updated. isSensitive/reportStatus require moderator permission; isDeleted requires admin.',
          properties: {
            title: { type: 'string' }, description: { type: 'string' }, video: { type: 'object' }, thumbnail: { type: 'object' },
            category: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, reporterId: { type: 'string' },
            location: { type: 'object' }, language: { type: 'string' }, linkedArticleId: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'unpublished'] }, scheduledAt: { type: 'string', format: 'date-time' },
            isFeatured: { type: 'boolean' }, isSensitive: { type: 'boolean' }, reportStatus: { type: 'string', enum: ['none', 'pending', 'reviewed', 'actioned'] },
            isDeleted: { type: 'boolean', description: 'Admin-only. true = soft delete, false = restore.' },
          },
        },
        ReelComment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
            reelId: { type: 'string' },
            userId: { type: 'string' },
            parentCommentId: { type: 'string', nullable: true, description: 'null for a top-level comment; only one level of replies is allowed.' },
            content: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved'] },
            likes: { type: 'number' },
            replyCount: { type: 'number' },
            edited: { type: 'boolean' },
            isDeleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            user: { type: 'object', nullable: true, properties: { id: { type: 'string' }, name: { type: 'string' }, avatar: { type: 'string' } } },
          },
        },
        ReelAnalyticsEventRequest: {
          type: 'object',
          required: ['event'],
          properties: {
            event: { type: 'string', enum: ['view', 'threeSecond', 'complete', 'replay', 'exit', 'share'], example: 'view' },
            watchDurationMs: { type: 'number', description: 'Required and must be >= 2000 for a `view` event to count (see 400 response).', example: 3000 },
            platform: { type: 'string', enum: ['whatsapp', 'twitter', 'facebook', 'instagram', 'copyLink', 'other'], description: 'Required for `share` events.' },
            viewerKey: { type: 'string', description: 'Optional client-generated anonymous id, used to dedup `view` events per viewer per 30-minute window when the caller has no session. Ignored for other events.', example: 'device-a1b2c3' },
          },
        },
        ReelReportRequest: {
          type: 'object',
          properties: { reason: { type: 'string', example: 'Misleading content' } },
        },
        Pagination: {
          type: 'object',
          properties: { page: { type: 'number', example: 1 }, limit: { type: 'number', example: 10 }, total: { type: 'number', example: 134 }, pages: { type: 'number', example: 14 } },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Reel not found' },
            error: { type: 'object', nullable: true, properties: { code: { type: 'string', example: 'REEL_NOT_FOUND' } } },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'App-facing routes: JWT from POST /api/auth/session (also accepted as the khabaron_session cookie for web). Admin routes: same JWT, staff role required.',
        },
        adminTokenHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-admin-token',
          description: 'Alternate to bearerAuth for admin (/api/admin/**) routes only.',
        },
      },
    },
    paths: {
      '/news': {
        get: {
          summary: 'Get all published news articles',
          tags: ['News'],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'number' },
              description: 'Page number for pagination',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number' },
              description: 'Items per page',
            },
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by category',
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search in title and content',
            },
          ],
          responses: {
            '200': {
              description: 'List of published articles',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      news: { type: 'array', items: { $ref: '#/components/schemas/NewsArticle' } },
                      total: { type: 'number' },
                      pages: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/news/breaking': {
        get: {
          summary: 'Get breaking news',
          tags: ['News'],
          responses: {
            '200': {
              description: 'List of breaking news articles',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/NewsArticle' },
                  },
                },
              },
            },
          },
        },
      },
      '/news/{id}': {
        get: {
          summary: 'Get article detail and increment views',
          tags: ['News'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Article details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NewsArticle' },
                },
              },
            },
            '404': {
              description: 'Article not found',
            },
          },
        },
      },
      '/categories': {
        get: {
          summary: 'Get all active categories',
          tags: ['Categories'],
          responses: {
            '200': {
              description: 'List of categories',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' },
                  },
                },
              },
            },
          },
        },
      },
      '/admin/login': {
        post: {
          summary: 'Admin login with email and password',
          tags: ['Admin Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AdminLoginResponse' },
                },
              },
            },
            '400': {
              description: 'Missing email or password',
            },
            '401': {
              description: 'Invalid credentials',
            },
            '403': {
              description: 'User does not have admin access',
            },
          },
        },
      },
      '/admin/news': {
        get: {
          summary: 'Get all news articles (all statuses) - Admin only',
          tags: ['Admin News'],
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['draft', 'pending', 'published', 'scheduled', 'rejected', 'all'] },
              description: 'Filter by status',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number' },
            },
          ],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of all articles',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      news: { type: 'array', items: { $ref: '#/components/schemas/NewsArticle' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create new article - Admin only',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    excerpt: { type: 'string' },
                    category: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    featuredImage: { type: 'string' },
                    status: { type: 'string' },
                    authorName: { type: 'string' },
                    seoTitle: { type: 'string' },
                    seoDescription: { type: 'string' },
                    seoKeywords: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Article created successfully',
            },
          },
        },
      },
      '/admin/categories': {
        get: {
          summary: 'Get all categories - Admin only',
          tags: ['Admin Categories'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of categories',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create new category - Admin only',
          tags: ['Admin Categories'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    description: { type: 'string' },
                    color: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Category created',
            },
          },
        },
      },
      '/admin/users': {
        get: {
          summary: 'Get all users - Admin only',
          tags: ['Admin Users'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
      '/admin/analytics': {
        get: {
          summary: 'Get admin analytics dashboard - Admin only',
          tags: ['Admin Analytics'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Analytics data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalArticles: { type: 'number' },
                      publishedCount: { type: 'number' },
                      draftCount: { type: 'number' },
                      pendingCount: { type: 'number' },
                      totalViews: { type: 'number' },
                      topArticles: { type: 'array' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/cloudinary/signature': {
        get: {
          summary: 'Get Cloudinary upload signature',
          tags: ['Upload'],
          parameters: [
            {
              name: 'folder',
              in: 'query',
              schema: { type: 'string' },
              description: 'Upload folder in Cloudinary',
            },
          ],
          responses: {
            '200': {
              description: 'Cloudinary signature for client-side upload',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      cloudName: { type: 'string' },
                      apiKey: { type: 'string' },
                      signature: { type: 'string' },
                      timestamp: { type: 'string' },
                      folder: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/seed': {
        post: {
          summary: 'Seed database with demo data',
          tags: ['Database'],
          description: 'Populate database with default categories, sample news, and demo users (admin/editor/reporter)',
          responses: {
            '200': {
              description: 'Database seeded successfully',
            },
          },
        },
      },
      '/reels': {
        get: {
          summary: 'Get the reels feed (public)',
          tags: ['Reels'],
          description: 'Vertical-feed listing. Only status=published, isDeleted=false reels are returned. Auto-publishes any due scheduled reels first.',
          parameters: [
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['latest', 'trending', 'personalized'], default: 'latest' }, description: 'trending = recency-decayed engagement score over the last 30 days. personalized currently behaves like trending (extension point for a future recommendation engine).' },
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category slug.' },
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 10, maximum: 50 } },
          ],
          responses: {
            '200': {
              description: 'Feed page',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Reel' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } },
                  example: { success: true, message: 'Reels feed fetched successfully', data: { items: [{ id: 'dd145a90-cb83-4ca0-94c7-83ecb000d0d9', title: 'City council approves new metro line', status: 'published', views: 1204, likeCount: 88 }], pagination: { page: 1, limit: 10, total: 134, pages: 14 } } },
                },
              },
            },
            '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Unable to fetch reels feed' } } } },
          },
        },
      },
      '/reels/{id}': {
        get: {
          summary: 'Get a single reel (public)',
          tags: ['Reels'],
          description: 'Only returns the reel if it is published and not deleted (draft/scheduled/unpublished/deleted reels 404 here — use the admin endpoint to view those).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Reel detail', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/Reel' } } } } } },
            '404': { description: 'Not found, not published, or deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Reel not found', error: { code: 'REEL_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/{id}/related': {
        get: {
          summary: 'Get related reels (public)',
          tags: ['Reels'],
          description: 'Same category, excludes the given reel, published + not deleted only.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 10, maximum: 50 } },
          ],
          responses: {
            '200': { description: 'Related reels', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Reel' } } } } } } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/{id}/analytics': {
        post: {
          summary: 'Record an engagement event (public, soft-auth)',
          tags: ['Reels'],
          description: 'One extensible endpoint for all passive engagement signals — no route per signal. Not identity-required (unlike like/bookmark/report): if the caller has a session, it is used to dedup `view` events per-user; otherwise pass `viewerKey` for anonymous dedup.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReelAnalyticsEventRequest' }, example: { event: 'view', watchDurationMs: 3000, viewerKey: 'device-a1b2c3' } } } },
          responses: {
            '200': {
              description: 'Event recorded (or acknowledged as an in-window duplicate)',
              content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, event: { type: 'string' }, counted: { type: 'boolean', description: '`view` only: false when this viewer already had a counted view for this reel within the last 30 minutes.' } } } } }, example: { success: true, message: 'Event recorded successfully', data: { success: true, event: 'view', counted: true } } } },
            },
            '400': {
              description: 'Invalid event name, missing `platform` for a share event, or a `view` with watchDurationMs < 2000',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, examples: {
                invalidEvent: { value: { success: false, message: 'Invalid event. Must be one of: view, threeSecond, complete, replay, exit, share' } },
                tooShort: { value: { success: false, message: 'A view only counts after a minimum watch duration', error: { code: 'WATCH_DURATION_TOO_SHORT' } } },
                missingPlatform: { value: { success: false, message: 'platform is required for share events' } },
              } } },
            },
            '404': { description: 'Reel not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Reel not found', error: { code: 'REEL_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/{id}/report': {
        post: {
          summary: 'Report a reel',
          tags: ['Reels'],
          security: [{ bearerAuth: [] }],
          description: 'Deduped per user per reel (a second report from the same user is a no-op). Flags the reel isReported=true, reportStatus="pending" on first report.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ReelReportRequest' } } } },
          responses: {
            '200': { description: 'Reported (or already reported by this user)', content: { 'application/json': { example: { success: true, message: 'Reel reported successfully', data: { reported: true, alreadyExists: false } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '404': { description: 'Reel not found' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/{id}/like': {
        get: {
          summary: "Get the current user's like status for a reel",
          tags: ['Reels'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Status', content: { 'application/json': { example: { success: true, message: 'Like status fetched successfully', data: { liked: true, likedAt: '2026-07-22T14:35:26.000Z', count: 42 } } } } },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Reel not found' },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Like a reel',
          tags: ['Reels'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Liked (or already liked)', content: { 'application/json': { example: { success: true, message: 'Reel liked successfully', data: { liked: true, alreadyExists: false, count: 43 } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '404': { description: 'Reel not found', content: { 'application/json': { example: { success: false, message: 'Reel not found', error: { code: 'REEL_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Unlike a reel',
          tags: ['Reels'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Unliked (or wasn’t liked)', content: { 'application/json': { example: { success: true, message: 'Reel unliked successfully', data: { liked: false, deleted: true, count: 42 } } } } },
            '401': { description: 'Not authenticated' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/{id}/bookmark': {
        get: {
          summary: "Get the current user's bookmark status for a reel",
          tags: ['Reels'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Status', content: { 'application/json': { example: { success: true, data: { bookmarked: false, bookmarkedAt: null, count: 12 } } } } },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Reel not found' },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Bookmark a reel',
          tags: ['Reels'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Bookmarked (or already bookmarked)', content: { 'application/json': { example: { success: true, message: 'Reel bookmarked successfully', data: { bookmarked: true, alreadyExists: false, count: 13 } } } } },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Reel not found' },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Remove a bookmark',
          tags: ['Reels'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Removed (or wasn’t bookmarked)', content: { 'application/json': { example: { success: true, message: 'Bookmark removed successfully', data: { bookmarked: false, deleted: true, count: 12 } } } } },
            '401': { description: 'Not authenticated' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/{id}/comments': {
        get: {
          summary: 'List top-level comments on a reel (public)',
          tags: ['Reels Comments'],
          description: 'Only status=approved, non-deleted, top-level (parentCommentId=null) comments. Auto-approves any comments past their moderation delay first.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20, maximum: 50 } },
          ],
          responses: {
            '200': { description: 'Comments page', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/ReelComment' } }, total: { type: 'number' }, page: { type: 'number' }, limit: { type: 'number' }, hasNext: { type: 'boolean' } } } } } } } },
            '404': { description: 'Reel not found' },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Post a top-level comment',
          tags: ['Reels Comments'],
          security: [{ bearerAuth: [] }],
          description: 'New comments start status=pending and are auto-approved after the platform’s moderation delay (or require manual approval, depending on the current moderation setting).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', maxLength: 1000, example: 'Great reporting!' } } } } } },
          responses: {
            '200': { description: 'Submitted for review', content: { 'application/json': { example: { success: true, message: 'Comment submitted for review', data: { id: '665f1a2b3c4d5e6f7a8b9c0d', status: 'pending' } } } } },
            '400': { description: 'Missing content or content > 1000 chars', content: { 'application/json': { example: { success: false, message: 'Comment content is required' } } } },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Reel not found' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/comments/{id}': {
        patch: {
          summary: 'Edit your own comment',
          tags: ['Reels Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Mongo ObjectId of the comment.' }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', maxLength: 1000 } } } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { example: { success: true, message: 'Comment updated successfully', data: { success: true } } } } },
            '400': { description: 'Invalid id, missing content, content too long, or the comment is deleted', content: { 'application/json': { examples: { badId: { value: { success: false, message: 'Invalid comment id' } }, deleted: { value: { success: false, message: 'Comment has been deleted' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not the comment owner', content: { 'application/json': { example: { success: false, message: 'You can edit only your own comments' } } } },
            '404': { description: 'Comment not found' },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Delete your own comment',
          tags: ['Reels Comments'],
          security: [{ bearerAuth: [] }],
          description: 'Soft delete (content replaced with "[deleted]") — decrements the parent reel’s commentCount.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted', content: { 'application/json': { example: { success: true, message: 'Comment deleted successfully', data: { success: true, deleted: true } } } } },
            '400': { description: 'Invalid id or already deleted' },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not the comment owner', content: { 'application/json': { example: { success: false, message: 'You can delete only your own comments' } } } },
            '404': { description: 'Comment not found' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/comments/{id}/reply': {
        post: {
          summary: 'Reply to a top-level comment',
          tags: ['Reels Comments'],
          security: [{ bearerAuth: [] }],
          description: 'One level of nesting only — replying to a reply is rejected.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'The parent (top-level) comment’s id.' }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', maxLength: 1000 } } } } } },
          responses: {
            '200': { description: 'Submitted for review', content: { 'application/json': { example: { success: true, message: 'Reply submitted for review', data: { success: true, id: '665f1a2b3c4d5e6f7a8b9c0e', status: 'pending' } } } } },
            '400': { description: 'Missing/too-long content, parent deleted, or attempting to reply to a reply', content: { 'application/json': { examples: { nested: { value: { success: false, message: 'Replies to replies are not allowed' } }, parentDeleted: { value: { success: false, message: 'Cannot reply to a deleted comment' } } } } } },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Parent comment not found' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/comments/{id}/replies': {
        get: {
          summary: 'List replies to a comment (public)',
          tags: ['Reels Comments'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20, maximum: 50 } },
          ],
          responses: {
            '200': { description: 'Replies page', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/ReelComment' } }, total: { type: 'number' }, hasNext: { type: 'boolean' } } } } } } } },
            '400': { description: 'Invalid comment id' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/comments/{id}/like': {
        get: {
          summary: "Get the current user's like status for a comment",
          tags: ['Reels Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Status', content: { 'application/json': { example: { success: true, data: { liked: false, likes: 7 } } } } },
            '400': { description: 'Invalid comment id' },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Comment not found', content: { 'application/json': { example: { success: false, message: 'Comment not found', error: { code: 'COMMENT_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Like a comment',
          tags: ['Reels Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Liked (or already liked)', content: { 'application/json': { example: { success: true, message: 'Comment liked successfully', data: { liked: true, alreadyExists: false, likes: 8 } } } } },
            '400': { description: 'Invalid comment id' },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Comment not found' },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Unlike a comment',
          tags: ['Reels Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Unliked', content: { 'application/json': { example: { success: true, message: 'Comment unliked successfully', data: { liked: false, deleted: true, likes: 7 } } } } },
            '400': { description: 'Invalid comment id' },
            '401': { description: 'Not authenticated' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/liked': {
        get: {
          summary: "Get the current user's liked reels",
          tags: ['Reels'],
          security: [{ bearerAuth: [] }],
          description: 'For a Profile/"Liked" screen. Returns full Reel objects (with a `likedAt` timestamp added), ordered most-recently-liked first.',
          responses: {
            '200': { description: 'Liked reels', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { items: { type: 'array', items: { allOf: [{ $ref: '#/components/schemas/Reel' }, { type: 'object', properties: { likedAt: { type: 'string', format: 'date-time' } } }] } }, total: { type: 'number' } } } } } } } },
            '401': { description: 'Not authenticated' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/reels/bookmarked': {
        get: {
          summary: "Get the current user's bookmarked reels",
          tags: ['Reels'],
          security: [{ bearerAuth: [] }],
          description: 'For a Profile/"Saved" screen. Returns full Reel objects (with a `bookmarkedAt` timestamp added), ordered most-recently-saved first.',
          responses: {
            '200': { description: 'Bookmarked reels', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Reel' } }, total: { type: 'number' } } } } } } } },
            '401': { description: 'Not authenticated' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/news/{id}/reels': {
        get: {
          summary: 'Get reels linked to a news article (public)',
          tags: ['Reels'],
          description: 'Reverse lookup for the reel↔article linking feature. Returns only {id, title, thumbnail} per reel — enough for a "Watch Reel" affordance, not full Reel objects.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'The news article id.' }],
          responses: {
            '200': { description: 'Linked reels', content: { 'application/json': { example: { success: true, message: 'Linked reels fetched successfully', data: { items: [{ id: 'dd145a90-cb83-4ca0-94c7-83ecb000d0d9', title: 'City council approves new metro line', thumbnail: 'https://res.cloudinary.com/demo/video/upload/so_0,w_150,h_267,c_fill/reels/abc123.jpg' }] } } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/reels': {
        get: {
          summary: 'List reels (admin/editor/reporter)',
          tags: ['Admin Reels'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Includes drafts/scheduled/unpublished by default (excludes soft-deleted unless includeDeleted=true). Text search uses the reels_text_search index across title/description/tags.',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'scheduled', 'published', 'unpublished', 'all'] } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'reporterId', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'includeDeleted', in: 'query', schema: { type: 'boolean', default: false } },
          ],
          responses: {
            '200': { description: 'Reels list', content: { 'application/json': { schema: { type: 'object', properties: { reels: { type: 'array', items: { $ref: '#/components/schemas/Reel' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Authenticated but not staff (admin/editor/reporter)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Create a reel (admin/editor/reporter)',
          tags: ['Admin Reels'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReelCreateRequest' } } } },
          responses: {
            '201': { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, reel: { $ref: '#/components/schemas/Reel' } } } } } },
            '400': { description: 'Missing title or video.url', content: { 'application/json': { examples: { noTitle: { value: { error: 'Title is required' } }, noVideo: { value: { error: 'A video upload is required' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (not staff)' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/reels/{id}': {
        get: {
          summary: 'Get a reel for editing (admin/editor/reporter)',
          tags: ['Admin Reels'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Unlike the public GET /reels/{id}, this returns the reel regardless of status (draft/scheduled/unpublished/deleted included).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Reel', content: { 'application/json': { schema: { type: 'object', properties: { reel: { $ref: '#/components/schemas/Reel' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (not staff)' },
            '404': { description: 'Reel not found', content: { 'application/json': { example: { error: 'Reel not found' } } } },
            '500': { description: 'Server error' },
          },
        },
        put: {
          summary: 'Update a reel (publish/unpublish/schedule/edit/restore all flow through this one PUT)',
          tags: ['Admin Reels'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Permission is layered: canEditReel gates any edit at all (reporters may only edit their own draft reels; editors/admins any reel); flipping status to "published" additionally requires canPublishReel (admin only); touching isSensitive/reportStatus additionally requires moderator permission; touching isDeleted (restore) is admin-only.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReelUpdateRequest' }, examples: {
            publish: { summary: 'Publish a draft', value: { status: 'published' } },
            unpublish: { summary: 'Unpublish', value: { status: 'unpublished' } },
            schedule: { summary: 'Schedule', value: { status: 'scheduled', scheduledAt: '2026-08-01T09:00:00.000Z' } },
            restore: { summary: 'Restore a soft-deleted reel (admin only)', value: { isDeleted: false } },
            resolveReport: { summary: 'Resolve a report', value: { reportStatus: 'reviewed' } },
          } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, reel: { $ref: '#/components/schemas/Reel' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden — the specific reason depends on what the body touched', content: { 'application/json': { examples: {
              cannotEdit: { value: { error: 'Cannot edit this reel' } },
              cannotPublish: { value: { error: 'Cannot publish this reel' } },
              cannotModerate: { value: { error: 'Cannot moderate this reel' } },
              cannotRestore: { value: { error: 'Cannot restore this reel' } },
            } } } },
            '404': { description: 'Reel not found' },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Soft-delete a reel (admin only)',
          tags: ['Admin Reels'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Sets isDeleted=true, deletedAt=now — never a hard delete. Restore via PUT {isDeleted:false}.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (admin only)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '404': { description: 'Reel not found' },
            '500': { description: 'Server error' },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export async function GET(request) {
  return NextResponse.json(swaggerSpec);
}
