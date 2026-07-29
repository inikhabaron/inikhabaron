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
        Subscription: {
          type: 'object',
          description: 'A subscription document from the `subscriptions` collection, keyed by app-level `id` (not Mongo _id).',
          properties: {
            id: { type: 'string', example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' },
            userId: { type: 'string' },
            email: { type: 'string', nullable: true },
            plan: { type: 'string', enum: ['free', 'basic', 'premium', 'enterprise'], example: 'premium' },
            status: { type: 'string', enum: ['active', 'cancelled'], example: 'active' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time', nullable: true, description: 'null for the free plan; startDate + 30 days for paid plans.' },
            features: {
              type: 'object',
              properties: {
                adsEnabled: { type: 'boolean' },
                articleLimit: { type: 'number', description: '-1 means unlimited.' },
                offlineAccess: { type: 'boolean' },
                exclusiveContent: { type: 'boolean' },
                earlyAccess: { type: 'boolean' },
                noAds: { type: 'boolean' },
                apiAccess: { type: 'boolean', description: 'enterprise plan only.' },
                multiUser: { type: 'boolean', description: 'enterprise plan only.' },
              },
            },
            paymentMethod: { type: 'string', nullable: true, example: 'razorpay', description: 'null for the free plan.' },
            paymentId: { type: 'string', nullable: true },
            autoRenew: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        NewsletterSubscriber: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
            email: { type: 'string', example: 'reader@example.com' },
            userId: { type: 'string', nullable: true, description: 'Set if the subscriber was signed in at subscribe time.' },
            language: { type: 'string', enum: ['en', 'hi'], example: 'en' },
            categories: { type: 'array', items: { type: 'string' }, example: ['politics', 'sports'] },
            status: { type: 'string', enum: ['active', 'unsubscribed'] },
            source: { type: 'string', example: 'website' },
            subscribedAt: { type: 'string', format: 'date-time' },
            unsubscribedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        NewsletterCampaign: {
          type: 'object',
          description: 'A logged send run. `failures` (subscriber emails) is stored on the document but always excluded from API responses.',
          properties: {
            _id: { type: 'string' },
            type: { type: 'string', enum: ['monthly', 'breaking'] },
            subject: { type: 'string', example: 'KhabarON Monthly Digest — July 2026' },
            month: { type: 'string', nullable: true, description: '"YYYY-MM", monthly campaigns only.', example: '2026-07' },
            status: { type: 'string', example: 'sent' },
            startedAt: { type: 'string', format: 'date-time' },
            finishedAt: { type: 'string', format: 'date-time' },
            durationMs: { type: 'number' },
            sent: { type: 'number' },
            failed: { type: 'number' },
            skipped: { type: 'number' },
            total: { type: 'number' },
            initiatedBy: { type: 'string', nullable: true, description: 'Admin user id who triggered the send.' },
          },
        },
        Promotion: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'a1b2c3d4-1234-4a5b-8c9d-1234567890ab' },
            title: { type: 'string', example: 'Independence Day Special Coverage' },
            description: { type: 'string' },
            bannerImage: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/promo.jpg' },
            eventDate: { type: 'string', format: 'date-time', nullable: true },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['active', 'inactive'] },
            priority: { type: 'number', example: 0 },
            buttonText: { type: 'string', example: 'Read More' },
            linkType: { type: 'string', enum: ['none', 'article', 'category', 'external'] },
            linkValue: { type: 'string', description: 'Article id, category slug, or raw URL, depending on linkType.' },
            buttonLink: { type: 'string', description: 'Resolved href, derived server-side from linkType+linkValue.', example: '/news/abc123' },
            category: { type: 'string' },
            isFeatured: { type: 'boolean' },
            showCountdown: { type: 'boolean' },
            state: { type: 'string', enum: ['disabled', 'scheduled', 'expired', 'live'], description: 'Admin list only (GET /admin/promotions) — derived from status + date window vs now, not stored.' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PromotionInput: {
          type: 'object',
          required: ['title'],
          description: 'PUT replaces every sanitizable field (not a partial patch) — omitted fields fall back to defaults, not the previous stored value.',
          properties: {
            title: { type: 'string', example: 'Independence Day Special Coverage' },
            description: { type: 'string' },
            bannerImage: { type: 'string' },
            eventDate: { type: 'string', description: 'Local (IST) datetime; strings with an explicit offset/Z are honored as-is.', example: '2026-08-15T09:00' },
            startDate: { type: 'string', example: '2026-08-01T00:00' },
            endDate: { type: 'string', example: '2026-08-16T00:00' },
            status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
            priority: { type: 'number', default: 0 },
            buttonText: { type: 'string', default: 'Read More' },
            linkType: { type: 'string', enum: ['none', 'article', 'category', 'external'], default: 'none' },
            linkValue: { type: 'string' },
            category: { type: 'string' },
            isFeatured: { type: 'boolean', default: false },
            showCountdown: { type: 'boolean', default: false },
          },
        },
        State: {
          type: 'object',
          description: 'A top-level location returned by GET /locations/states.',
          properties: {
            id: { type: 'string', example: 'state-mh' },
            name: { type: 'string', example: 'Maharashtra' },
            nameHi: { type: 'string', example: 'महाराष्ट्र' },
            slug: { type: 'string', example: 'maharashtra' },
          },
        },
        District: {
          type: 'object',
          description: 'A location scoped to a parent state, returned by GET /locations/districts. No slug field (unlike State).',
          properties: {
            id: { type: 'string', example: 'district-pune' },
            name: { type: 'string', example: 'Pune' },
            nameHi: { type: 'string', example: 'पुणे' },
          },
        },
        NewsVersion: {
          type: 'object',
          description: 'A snapshot of an article pushed onto NewsArticle.versionHistory on every edit (PUT /admin/news/{id}). The list endpoint (GET .../versions) returns only {id, version, title, status, editedBy, editedByName, editedAt} per entry, newest first; the detail endpoint (GET .../versions/{versionId}) returns the full snapshot below plus `version`.',
          properties: {
            id: { type: 'string', example: 'a1b2c3d4-1234-4a5b-8c9d-0e1f2a3b4c5d' },
            version: { type: 'number', description: '1-based position in versionHistory at snapshot time (computed on read, not stored).', example: 3 },
            title: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            featuredImage: { type: 'string' },
            status: { type: 'string' },
            isBreaking: { type: 'boolean' },
            editedBy: { type: 'string', description: 'User id who made the edit that produced this snapshot.' },
            editedByName: { type: 'string' },
            editedAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          description: 'A comment on a news article (distinct from ReelComment, which is scoped to reels). Returned by the admin moderation list, joined with `user` and `article` previews.',
          properties: {
            _id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
            articleId: { type: 'string' },
            userId: { type: 'string' },
            parentCommentId: { type: 'string', nullable: true, description: 'null for a top-level comment; only one level of replies is allowed.' },
            content: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'hidden'] },
            approveAt: { type: 'string', format: 'date-time', nullable: true, description: 'When auto-moderation will approve this comment, if enabled at creation time.' },
            likes: { type: 'number' },
            replyCount: { type: 'number' },
            reports: { type: 'number' },
            edited: { type: 'boolean' },
            isDeleted: { type: 'boolean' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            moderationHistory: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, by: { type: 'string' }, byName: { type: 'string' }, at: { type: 'string', format: 'date-time' }, reason: { type: 'string' } } } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            user: { type: 'object', nullable: true, properties: { id: { type: 'string' }, name: { type: 'string' }, avatar: { type: 'string' } } },
            article: { type: 'object', nullable: true, description: 'Only present on the admin moderation list join.', properties: { id: { type: 'string' }, title: { type: 'string' }, slug: { type: 'string' } } },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'a1b2c3d4-1234-4a5b-9c1d-abcdef123456' },
            name: { type: 'string', example: 'Elections' },
            slug: { type: 'string', example: 'elections' },
            description: { type: 'string' },
            color: { type: 'string', example: '#2563EB' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        FollowedEntry: {
          type: 'object',
          description: 'One followed category/author/city as returned by GET /users/following. Field availability depends on which list it appears in (categories: name/nameHi/color; authors: name/avatar; cities: name only). exists:false means the followed id no longer resolves (e.g. a deleted category/author) — id is preserved so the client can still unfollow it.',
          properties: {
            id: { type: 'string', description: 'Category slug, author user id, or city name, depending on the list.' },
            exists: { type: 'boolean' },
            name: { type: 'string' },
            nameHi: { type: 'string', description: 'Categories only.' },
            color: { type: 'string', description: 'Categories only.' },
            avatar: { type: 'string', description: 'Authors only.' },
          },
        },
        ReadingProgress: {
          type: 'object',
          properties: {
            scrollY: { type: 'number', example: 1240 },
            scrollPercent: { type: 'number', example: 62 },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ReadingHistoryEntry: {
          type: 'object',
          description: 'A document from the legacy `reading_history` collection — a denormalized snapshot of the article at read time. Distinct from the newer per-article ReadingProgress used by continue-reading.',
          properties: {
            userId: { type: 'string' },
            newsId: { type: 'string' },
            newsTitle: { type: 'string' },
            newsExcerpt: { type: 'string' },
            newsFeaturedImage: { type: 'string' },
            newsCategory: { type: 'string' },
            scrollPosition: { type: 'number' },
            readPercentage: { type: 'number' },
            lastRead: { type: 'string', format: 'date-time' },
          },
        },
        UserLocation: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'false when scope is national (the default).' },
            scope: { type: 'string', enum: ['national', 'state', 'district'] },
            country: { type: 'string', example: 'India' },
            stateId: { type: 'string' },
            stateName: { type: 'string' },
            stateSlug: { type: 'string' },
            districtId: { type: 'string' },
            districtName: { type: 'string' },
            districtSlug: { type: 'string' },
            source: { type: 'string', enum: ['manual', 'auto'] },
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
      '/admin/newsletter': {
        get: {
          summary: 'List newsletter subscribers, or export as CSV (admin/editor)',
          tags: ['Admin Newsletter'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'format=csv streams a text/csv attachment of up to 10000 rows instead of the paginated JSON envelope.',
          parameters: [
            { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv'] }, description: 'Pass "csv" to download a CSV export instead of JSON.' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Case-insensitive substring match on email.' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'unsubscribed', 'all'], default: 'all' } },
            { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'hi', 'all'], default: 'all' } },
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20, maximum: 100 } },
          ],
          responses: {
            '200': {
              description: 'Subscriber page with stats, or a CSV file when format=csv',
              content: {
                'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/NewsletterSubscriber' } }, total: { type: 'number' }, page: { type: 'number' }, limit: { type: 'number' }, hasNext: { type: 'boolean' }, stats: { type: 'object', properties: { active: { type: 'number' }, unsubscribed: { type: 'number' }, total: { type: 'number' } } } } } } }, example: { success: true, message: 'Subscribers fetched successfully', data: { items: [], total: 0, page: 1, limit: 20, hasNext: false, stats: { active: 120, unsubscribed: 8, total: 128 } } } },
                'text/csv': { schema: { type: 'string' }, example: 'email,status,language,categories,source,subscribedAt,unsubscribedAt\n"reader@example.com","active","en","politics; sports","website","2026-07-01T00:00:00.000Z",""' },
              },
            },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Unauthorized' } } } },
            '403': { description: 'Not admin/editor', content: { 'application/json': { example: { success: false, message: 'Forbidden' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/newsletter/{id}': {
        patch: {
          summary: 'Update a subscriber (admin/editor)',
          tags: ['Admin Newsletter'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Mongo ObjectId of the subscriber.' }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'unsubscribed'] }, language: { type: 'string' }, categories: { type: 'array', items: { type: 'string' } } } }, example: { status: 'unsubscribed' } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { example: { success: true, message: 'Subscriber updated successfully', data: { success: true } } } } },
            '400': { description: 'Invalid subscriber id', content: { 'application/json': { example: { success: false, message: 'Invalid subscriber id' } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not admin/editor' },
            '404': { description: 'Subscriber not found', content: { 'application/json': { example: { success: false, message: 'Subscriber not found' } } } },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Delete a subscriber (admin/editor)',
          tags: ['Admin Newsletter'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Mongo ObjectId of the subscriber.' }],
          responses: {
            '200': { description: 'Deleted', content: { 'application/json': { example: { success: true, message: 'Subscriber deleted successfully', data: { success: true } } } } },
            '400': { description: 'Invalid subscriber id' },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not admin/editor' },
            '404': { description: 'Subscriber not found' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/newsletter/campaigns': {
        get: {
          summary: 'List recent newsletter send campaigns (admin/editor)',
          tags: ['Admin Newsletter'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'For the admin "send history" panel — subscriber-identifying `failures` are excluded at the query level.',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'number', default: 10, maximum: 50 } }],
          responses: {
            '200': { description: 'Campaign list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { campaigns: { type: 'array', items: { $ref: '#/components/schemas/NewsletterCampaign' } } } } } }, example: { success: true, message: 'Campaigns fetched successfully', data: { campaigns: [] } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not admin/editor' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/newsletter/preview': {
        get: {
          summary: 'Generate a newsletter HTML/text preview without sending (admin/editor)',
          tags: ['Admin Newsletter'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Builds the same content/template the real send would use, addressed to a fixed placeholder recipient — nothing is sent.',
          parameters: [
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['monthly', 'breaking'], default: 'monthly' } },
            { name: 'articleId', in: 'query', schema: { type: 'string' }, description: 'Feature a specific article in a "breaking" preview; ignored for "monthly".' },
          ],
          responses: {
            '200': { description: 'Rendered preview', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { subject: { type: 'string' }, html: { type: 'string' }, text: { type: 'string' } } } } }, example: { success: true, message: 'Preview generated successfully', data: { subject: 'KhabarON Monthly Digest — July 2026', html: '<html>...</html>', text: 'KhabarON Monthly Digest...' } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not admin/editor' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/newsletter/send': {
        post: {
          summary: 'Send the newsletter to all active subscribers (admin/editor)',
          tags: ['Admin Newsletter'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Monthly sends are idempotent per calendar month unless force=true. Recipient-level failure emails are never returned over HTTP — only counts (see the campaign log for detail).',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { type: { type: 'string', enum: ['monthly', 'breaking'], default: 'monthly' }, articleId: { type: 'string', description: 'Feature a specific article in a "breaking" send.' }, force: { type: 'boolean', default: false, description: 'Resend a monthly digest already sent this month.' } } }, example: { type: 'monthly', force: false } } } },
          responses: {
            '200': { description: 'Sent', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { success: { type: 'boolean' }, type: { type: 'string' }, sent: { type: 'number' }, failed: { type: 'number' }, skipped: { type: 'number' }, total: { type: 'number' } } } } }, example: { success: true, message: 'Newsletter sent: 128 succeeded, 2 failed, 0 skipped', data: { success: true, type: 'monthly', sent: 128, failed: 2, skipped: 0, total: 130 } } } } },
            '400': { description: 'Not sent — already sent this month (monthly, without force) or no content available', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, error: { type: 'object' } } }, example: { success: false, message: 'The monthly newsletter for 2026-07 was already sent on 2026-07-01. Pass force to resend.', error: { success: false, type: 'monthly', sent: 0, failed: 0, skipped: 0, total: 0, alreadySent: true } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not admin/editor' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/promotions': {
        get: {
          summary: 'List all promotions, any status (admin/editor/reporter)',
          tags: ['Admin Promotions'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Same order the public list uses (featured first, then priority, then soonest event); each item is annotated with a computed `state`.',
          responses: {
            '200': { description: 'Promotions', content: { 'application/json': { schema: { type: 'object', properties: { promotions: { type: 'array', items: { $ref: '#/components/schemas/Promotion' } } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to load promotions' } } } },
          },
        },
        post: {
          summary: 'Create a promotion (admin/editor)',
          tags: ['Admin Promotions'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PromotionInput' } } } },
          responses: {
            '201': { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, promotion: { $ref: '#/components/schemas/Promotion' } } } } } },
            '400': { description: 'Missing title', content: { 'application/json': { example: { error: 'Title is required' } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (admin/editor only)' },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to create promotion' } } } },
          },
        },
      },
      '/admin/promotions/{id}': {
        put: {
          summary: 'Replace a promotion (admin/editor)',
          tags: ['Admin Promotions'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PromotionInput' } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, promotion: { $ref: '#/components/schemas/Promotion' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (admin/editor only)' },
            '404': { description: 'Promotion not found', content: { 'application/json': { example: { error: 'Promotion not found' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to update promotion' } } } },
          },
        },
        delete: {
          summary: 'Delete a promotion (admin/editor)',
          tags: ['Admin Promotions'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (admin/editor only)' },
            '404': { description: 'Promotion not found', content: { 'application/json': { example: { error: 'Promotion not found' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to delete promotion' } } } },
          },
        },
      },
      '/newsletter': {
        post: {
          summary: 'Subscribe an email to the newsletter (public)',
          tags: ['Newsletter'],
          description: 'No auth required; if the caller has a session cookie, the subscription is linked to that user id automatically. Re-subscribing a previously-unsubscribed email reactivates it.',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', example: 'reader@example.com' }, language: { type: 'string', enum: ['en', 'hi'], default: 'en' }, categories: { type: 'array', items: { type: 'string' } }, source: { type: 'string', default: 'website' } } } } } },
          responses: {
            '201': { description: 'Subscribed (or reactivated)', content: { 'application/json': { examples: { fresh: { value: { success: true, message: 'Subscribed successfully', data: null } }, reactivated: { value: { success: true, message: 'Welcome back! Your subscription has been reactivated', data: null } } } } } },
            '400': { description: 'Missing/invalid email', content: { 'application/json': { examples: { missing: { value: { success: false, message: 'Email is required' } }, invalid: { value: { success: false, message: 'Enter a valid email address' } } } } } },
            '409': { description: 'Already subscribed', content: { 'application/json': { example: { success: false, message: 'This email is already subscribed' } } } },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Unsubscribe from the newsletter (public)',
          tags: ['Newsletter'],
          description: 'No auth required; email may be omitted if the caller has a session (falls back to the signed-in user’s email).',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', example: 'reader@example.com' } } } } } },
          responses: {
            '200': { description: 'Unsubscribed (or already was)', content: { 'application/json': { examples: { unsubscribed: { value: { success: true, message: 'Unsubscribed successfully', data: null } }, already: { value: { success: true, message: 'You are already unsubscribed', data: null } } } } } },
            '400': { description: 'No email available (not provided and not signed in)', content: { 'application/json': { example: { success: false, message: 'Email is required' } } } },
            '404': { description: 'Subscriber not found', content: { 'application/json': { example: { success: false, message: 'Subscriber not found' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/promotions': {
        get: {
          summary: 'Get active promotions (public)',
          tags: ['Promotions'],
          description: 'Only status=active promotions inside their startDate..endDate window; response is cached at the edge for 60s (s-maxage=60, stale-while-revalidate=300).',
          responses: {
            '200': { description: 'Active promotions', content: { 'application/json': { schema: { type: 'object', properties: { promotions: { type: 'array', items: { $ref: '#/components/schemas/Promotion' } } } } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to load promotions', promotions: [] } } } },
          },
        },
      },
      '/news/{id}/bookmark': {
        get: {
          summary: "Get the current user's bookmark status for a news article",
          tags: ['News'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Status', content: { 'application/json': { example: { success: true, message: 'Bookmark status fetched successfully', data: { bookmarked: true, bookmarkedAt: '2026-07-22T14:35:26.000Z' } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '404': { description: 'Article not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Article not found', error: { code: 'ARTICLE_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Bookmark a news article',
          tags: ['News'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Bookmarked (or already bookmarked)', content: { 'application/json': { example: { success: true, message: 'Article bookmarked successfully', data: { bookmarked: true, alreadyExists: false } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '404': { description: 'Article not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Article not found', error: { code: 'ARTICLE_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Remove a bookmark from a news article',
          tags: ['News'],
          security: [{ bearerAuth: [] }],
          description: 'Does not re-check that the article exists — a delete against a nonexistent bookmark just returns deleted:false.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Removed (or wasn’t bookmarked)', content: { 'application/json': { example: { success: true, message: 'Bookmark removed successfully', data: { bookmarked: false, deleted: true } } } } },
            '401': { description: 'Not authenticated' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/news/{id}/like': {
        get: {
          summary: "Get the current user's like status for a news article",
          tags: ['News'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Status', content: { 'application/json': { example: { success: true, message: 'Like status fetched successfully', data: { liked: true, likedAt: '2026-07-22T14:35:26.000Z', count: 42 } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '404': { description: 'Article not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Article not found', error: { code: 'ARTICLE_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Like a news article',
          tags: ['News'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Liked (or already liked)', content: { 'application/json': { example: { success: true, message: 'Article liked successfully', data: { liked: true, alreadyExists: false, count: 43 } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '404': { description: 'Article not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Article not found', error: { code: 'ARTICLE_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Unlike a news article',
          tags: ['News'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Unliked (or wasn’t liked)', content: { 'application/json': { example: { success: true, message: 'Article unliked successfully', data: { liked: false, deleted: true, count: 42 } } } } },
            '401': { description: 'Not authenticated' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/news/{id}/comments': {
        get: {
          summary: 'List top-level, approved comments on a news article (public)',
          tags: ['News Comments'],
          description: 'Only status=approved, non-deleted, top-level (parentCommentId=null) comments. Auto-approves any comments past their moderation delay first.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20, maximum: 50 } },
          ],
          responses: {
            '200': { description: 'Comments page', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Comment' } }, total: { type: 'number' }, page: { type: 'number' }, limit: { type: 'number' }, hasNext: { type: 'boolean' } } } } } } } },
            '404': { description: 'Article not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { success: false, message: 'Article not found', error: { code: 'ARTICLE_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Post a top-level comment on a news article',
          tags: ['News Comments'],
          security: [{ bearerAuth: [] }],
          description: 'New comments start status=pending and are auto-approved after the platform’s moderation delay (or require manual approval, depending on the current moderation setting).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', maxLength: 1000, example: 'Great reporting!' } } } } } },
          responses: {
            '200': { description: 'Submitted for review', content: { 'application/json': { example: { success: true, message: 'Comment submitted for review', data: { id: '665f1a2b3c4d5e6f7a8b9c0d', status: 'pending' } } } } },
            '400': { description: 'Missing content or content > 1000 chars', content: { 'application/json': { example: { success: false, message: 'Comment content is required' } } } },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Article not found', content: { 'application/json': { example: { success: false, message: 'Article not found', error: { code: 'ARTICLE_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/news/{id}/share': {
        post: {
          summary: 'Record a share of a news article to a platform',
          tags: ['News'],
          description: 'Increments shares.<platform> on the article document. Uses lib/api/cors.js (not the success/failure helper) so the response shape is plain {success, matched, modified}, and errors are plain {error}.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['platform'], properties: { platform: { type: 'string', enum: ['whatsapp', 'facebook', 'twitter'] } } } } } },
          responses: {
            '200': { description: 'Share recorded', content: { 'application/json': { example: { success: true, matched: 1, modified: 1 } } } },
            '400': { description: 'Missing/unsupported platform', content: { 'application/json': { example: { error: 'Invalid platform' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/news/{id}/view': {
        post: {
          summary: 'Record a view of a news article',
          tags: ['News'],
          description: 'Public, no auth. Increments views on the article document. Uses lib/api/cors.js so the response shape is plain {success, afterViews}.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'View recorded', content: { 'application/json': { example: { success: true, afterViews: 1205 } } } },
            '404': { description: 'Article not found', content: { 'application/json': { example: { error: 'News not found' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to record view' } } } },
          },
        },
      },
      '/news/{id}/why': {
        get: {
          summary: 'Get "why am I seeing this" recommendation reasons for an article',
          tags: ['News'],
          description: 'Soft-auth: works for anonymous callers too (falls back to empty interests/follows), but a signed-in caller’s stored interests/follows produce personalized reasons. Only matches status=published articles.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Reasons, highest score first', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { reasons: { type: 'array', items: { type: 'object', properties: { type: { type: 'string', enum: ['interest', 'author', 'city', 'language', 'tag', 'followedCategory', 'followedAuthor', 'followedCity', 'trending', 'breaking', 'editor'] }, title: { type: 'string' }, score: { type: 'number' }, message: { type: 'string' } } } } } } } }, example: { success: true, data: { reasons: [{ type: 'followedCategory', title: 'technology', score: 35, message: 'Because you follow technology.' }, { type: 'trending', title: 'Trending', score: 15, message: 'This article is trending today.' }] } } } } },
            '404': { description: 'Article not found (or not published)', content: { 'application/json': { example: { success: false, message: 'Article not found' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to load recommendation reasons' } } } },
          },
        },
      },
      '/news/my-city': {
        get: {
          summary: "Get news for the current user's saved location",
          tags: ['News'],
          security: [{ bearerAuth: [] }],
          description: 'Scope (national/state/district) is driven by the user’s saved users.location. Uses lib/api/cors.js — the response shape is plain {success, data, meta}, not the success()/failure() helper.',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'number', default: 20 } }],
          responses: {
            '200': { description: 'Articles for the resolved location scope', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/NewsArticle' } }, meta: { type: 'object', properties: { scope: { type: 'string', enum: ['national', 'state', 'district'] }, stateId: { type: 'string', nullable: true }, stateName: { type: 'string', nullable: true }, stateSlug: { type: 'string', nullable: true }, districtId: { type: 'string', nullable: true }, districtName: { type: 'string', nullable: true }, districtSlug: { type: 'string', nullable: true } } } } }, example: { success: true, data: [{ id: 'news-123', title: 'City council approves new metro line' }], meta: { scope: 'district', stateId: 'st-1', stateName: 'Maharashtra', stateSlug: 'maharashtra', districtId: 'd-1', districtName: 'Pune', districtSlug: 'pune' } } } } },
            '401': { description: 'Not authenticated' },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to fetch My City news.' } } } },
          },
        },
      },
      '/news/personalized': {
        get: {
          summary: 'Get the personalized news feed',
          tags: ['News'],
          description: 'Soft-auth: works for anonymous callers too (falls back to empty interests/follows, effectively an editor’s-pick feed). Ranks all published articles by a recommendation score (see /news/{id}/why for how a score is explained), then diversifies by round-robining across categories before paginating.',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
          ],
          responses: {
            '200': { description: 'Ranked, paginated feed', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { page: { type: 'number' }, limit: { type: 'number' }, total: { type: 'number' }, totalPages: { type: 'number' }, items: { type: 'array', items: { type: 'object', description: 'A projected subset of NewsArticle fields (id, slug, title, excerpt, featuredImage, category, author, authorId, authorName, location, language, recommendationTags, isTrending, isBreaking, publishedAt, views) plus the two fields below.', properties: { recommendationScore: { type: 'number' }, recommendationMatches: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, value: { type: 'string' }, weight: { type: 'number' } } } } } } } } } } }, example: { success: true, data: { page: 1, limit: 20, total: 134, totalPages: 7, items: [{ id: 'news-123', title: 'City council approves new metro line', category: 'politics', recommendationScore: 55, recommendationMatches: [{ type: 'followedCategory', value: 'politics', weight: 35 }, { type: 'trending', weight: 15 }] }] } } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to load personalized feed.' } } } },
          },
        },
      },
      '/comments/{id}': {
        patch: {
          summary: 'Edit your own article comment',
          tags: ['News Comments'],
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
          summary: 'Delete your own article comment',
          tags: ['News Comments'],
          security: [{ bearerAuth: [] }],
          description: 'Soft delete (content replaced with "[deleted]").',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted', content: { 'application/json': { example: { success: true, message: 'Comment deleted successfully', data: { success: true, deleted: true } } } } },
            '400': { description: 'Invalid id or already deleted', content: { 'application/json': { examples: { badId: { value: { success: false, message: 'Invalid comment id' } }, already: { value: { success: false, message: 'Comment already deleted' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not the comment owner', content: { 'application/json': { example: { success: false, message: 'You can delete only your own comments' } } } },
            '404': { description: 'Comment not found' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/comments/{id}/like': {
        get: {
          summary: "Get the current user's like status for an article comment",
          tags: ['News Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Status', content: { 'application/json': { example: { success: true, message: 'Comment like status fetched successfully', data: { liked: false, likes: 7 } } } } },
            '400': { description: 'Invalid comment id' },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Comment not found', content: { 'application/json': { example: { success: false, message: 'Comment not found', error: { code: 'COMMENT_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Like an article comment',
          tags: ['News Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Liked (or already liked)', content: { 'application/json': { example: { success: true, message: 'Comment liked successfully', data: { liked: true, alreadyExists: false, likes: 8 } } } } },
            '400': { description: 'Invalid comment id' },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Comment not found', content: { 'application/json': { example: { success: false, message: 'Comment not found', error: { code: 'COMMENT_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Unlike an article comment',
          tags: ['News Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Unliked (or wasn’t liked)', content: { 'application/json': { example: { success: true, message: 'Comment unliked successfully', data: { liked: false, deleted: true, likes: 7 } } } } },
            '400': { description: 'Invalid comment id' },
            '401': { description: 'Not authenticated' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/comments/{id}/replies': {
        get: {
          summary: 'List approved replies to an article comment (public)',
          tags: ['News Comments'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20, maximum: 50 } },
          ],
          responses: {
            '200': { description: 'Replies page', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Comment' } }, total: { type: 'number' }, page: { type: 'number' }, limit: { type: 'number' }, hasNext: { type: 'boolean' } } } } } } } },
            '400': { description: 'Invalid comment id', content: { 'application/json': { example: { success: false, message: 'Invalid comment id' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/comments/{id}/reply': {
        post: {
          summary: 'Reply to a top-level article comment',
          tags: ['News Comments'],
          security: [{ bearerAuth: [] }],
          description: 'One level of nesting only — replying to a reply is rejected.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'The parent (top-level) comment’s id.' }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', maxLength: 1000 } } } } } },
          responses: {
            '200': { description: 'Submitted for review', content: { 'application/json': { example: { success: true, message: 'Reply submitted for review', data: { success: true, id: '665f1a2b3c4d5e6f7a8b9c0e', status: 'pending' } } } } },
            '400': { description: 'Missing/too-long content, parent deleted, or attempting to reply to a reply', content: { 'application/json': { examples: { missing: { value: { success: false, message: 'Reply content is required' } }, nested: { value: { success: false, message: 'Replies to replies are not allowed' } }, parentDeleted: { value: { success: false, message: 'Cannot reply to a deleted comment' } } } } } },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Parent comment not found', content: { 'application/json': { example: { success: false, message: 'Parent comment not found' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/comments/{id}/report': {
        post: {
          summary: 'Report an article comment',
          tags: ['News Comments'],
          security: [{ bearerAuth: [] }],
          description: 'Deduped per user per comment (a second report from the same user is a no-op).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string', enum: ['Spam', 'Harassment', 'Hate Speech', 'Misinformation', 'Offensive Content', 'Copyright', 'Other'], default: 'Other', example: 'Spam' } } } } } },
          responses: {
            '200': { description: 'Reported (or already reported by this user)', content: { 'application/json': { example: { success: true, message: 'Comment reported successfully', data: { reported: true, alreadyReported: false, reports: 1 } } } } },
            '400': { description: 'Invalid comment id or invalid report reason', content: { 'application/json': { examples: { badId: { value: { success: false, message: 'Invalid comment id' } }, badReason: { value: { success: false, message: 'Invalid report reason' } } } } } },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Comment not found', content: { 'application/json': { example: { success: false, message: 'Comment not found', error: { code: 'COMMENT_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
        get: {
          summary: "Get the current user's report status for an article comment",
          tags: ['News Comments'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Status', content: { 'application/json': { example: { success: true, message: 'Comment report status fetched successfully', data: { reported: false, reports: 0 } } } } },
            '400': { description: 'Invalid comment id' },
            '401': { description: 'Not authenticated' },
            '404': { description: 'Comment not found', content: { 'application/json': { example: { success: false, message: 'Comment not found', error: { code: 'COMMENT_NOT_FOUND' } } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/users/{id}/history': {
        get: {
          summary: "Get a user's legacy reading history (unauthenticated, no ownership check)",
          tags: ['Reading History'],
          description: 'Reads the legacy `reading_history` collection by the id in the path — no auth guard, any caller can request any user id.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Most recent 20 entries, newest first', content: { 'application/json': { schema: { type: 'object', properties: { history: { type: 'array', items: { $ref: '#/components/schemas/ReadingHistoryEntry' } } } } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'message' } } } },
          },
        },
      },
      '/users/bookmarks': {
        get: {
          summary: "Get the current user's bookmarked articles",
          tags: ['Bookmarks'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Bookmarked articles, most recently bookmarked first', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { items: { type: 'array', items: { allOf: [{ $ref: '#/components/schemas/NewsArticle' }, { type: 'object', properties: { bookmarkedAt: { type: 'string', format: 'date-time' } } }] } }, total: { type: 'number' } } } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to fetch bookmarks' } } } },
          },
        },
      },
      '/users/bookmarks/ids': {
        get: {
          summary: "Get just the current user's bookmarked article ids",
          tags: ['Bookmarks'],
          description: 'For pages that render many BookmarkButtons — fetch bookmark status once instead of one call per button.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Article ids', content: { 'application/json': { example: { success: true, message: 'Bookmarked article ids fetched successfully', data: { articleIds: ['news-123', 'news-456'] } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to fetch bookmarked article ids' } } } },
          },
        },
      },
      '/users/continue-reading': {
        get: {
          summary: "Get the current user's in-progress articles",
          tags: ['Reading Progress'],
          description: 'Articles with saved reading progress (readingProgress collection), most recently updated first. Only published articles are included.',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'number', default: 5, maximum: 20 } }],
          responses: {
            '200': { description: 'Continue-reading list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { allOf: [{ $ref: '#/components/schemas/ReadingProgress' }, { type: 'object', properties: { article: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, slug: { type: 'string' }, featuredImage: { type: 'string' }, excerpt: { type: 'string' }, category: { type: 'string' }, publishedAt: { type: 'string', format: 'date-time' }, author: { type: 'string' }, views: { type: 'number' } } } } }] } }, meta: { type: 'object', properties: { count: { type: 'number' }, limit: { type: 'number' } } } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to fetch continue reading articles.' } } } },
          },
        },
      },
      '/users/fcm-token': {
        post: {
          summary: 'Register a push notification token for the current user',
          tags: ['Push Notifications'],
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'provider'], properties: { token: { type: 'string' }, provider: { type: 'string', enum: ['fcm', 'expo'] }, platform: { type: 'string', default: 'web' } } } } } },
          responses: {
            '200': { description: 'Registered', content: { 'application/json': { example: { success: true } } } },
            '400': { description: 'Missing token/provider or invalid provider', content: { 'application/json': { examples: { missing: { value: { error: 'token and provider are required' } }, badProvider: { value: { error: 'provider must be fcm or expo' } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'message' } } } },
          },
        },
      },
      '/users/follow': {
        post: {
          summary: 'Follow a category, author, or city',
          tags: ['Follow'],
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type', 'id'], properties: { type: { type: 'string', enum: ['category', 'author', 'city'] }, id: { type: 'string', description: 'Category slug, author user id, or city name.' } } }, example: { type: 'category', id: 'technology' } } } },
          responses: {
            '200': { description: 'Followed', content: { 'application/json': { example: { success: true, message: 'Followed successfully', data: { following: true } } } } },
            '400': { description: 'Missing type/id or invalid type', content: { 'application/json': { examples: { missing: { value: { success: false, message: 'type and id are required' } }, badType: { value: { success: false, message: 'Invalid follow type' } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to follow' } } } },
          },
        },
        delete: {
          summary: 'Unfollow a category, author, or city',
          tags: ['Follow'],
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type', 'id'], properties: { type: { type: 'string', enum: ['category', 'author', 'city'] }, id: { type: 'string' } } } } } },
          responses: {
            '200': { description: 'Unfollowed', content: { 'application/json': { example: { success: true, message: 'Unfollowed successfully', data: { following: false } } } } },
            '400': { description: 'Missing type/id or invalid type', content: { 'application/json': { examples: { missing: { value: { success: false, message: 'type and id are required' } }, badType: { value: { success: false, message: 'Invalid follow type' } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to unfollow' } } } },
          },
        },
      },
      '/users/following': {
        get: {
          summary: 'Get everything the current user follows',
          tags: ['Follow'],
          description: 'One lookup returning all three followed lists, each entry enriched with display data (or exists:false if the target was deleted).',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Following lists', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { categories: { type: 'array', items: { $ref: '#/components/schemas/FollowedEntry' } }, authors: { type: 'array', items: { $ref: '#/components/schemas/FollowedEntry' } }, cities: { type: 'array', items: { $ref: '#/components/schemas/FollowedEntry' } } } } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to fetch following list' } } } },
          },
        },
      },
      '/users/likes': {
        get: {
          summary: "Get the current user's liked articles",
          tags: ['Likes'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Liked articles, most recently liked first', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { items: { type: 'array', items: { allOf: [{ $ref: '#/components/schemas/NewsArticle' }, { type: 'object', properties: { likedAt: { type: 'string', format: 'date-time' } } }] } }, total: { type: 'number' } } } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to fetch likes' } } } },
          },
        },
      },
      '/users/location': {
        get: {
          summary: "Get the current user's saved location",
          tags: ['Location'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Location (defaults to national/India if unset)', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { allOf: [{ $ref: '#/components/schemas/UserLocation' }, { type: 'object', properties: { locationPromptSeenAt: { type: 'string', format: 'date-time', nullable: true } } }] } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to fetch user location.' } } } },
          },
        },
        put: {
          summary: "Save/update the current user's location",
          tags: ['Location'],
          description: 'Accepts either flat ids (stateId/stateName/...) or nested {state:{id,name,slug}, district:{...}} — both are read. First save (of any kind) also marks the location prompt as seen.',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { country: { type: 'string', default: 'India' }, scope: { type: 'string', enum: ['national', 'state', 'district'], default: 'national' }, stateId: { type: 'string' }, stateName: { type: 'string' }, stateSlug: { type: 'string' }, districtId: { type: 'string' }, districtName: { type: 'string' }, districtSlug: { type: 'string' }, source: { type: 'string', enum: ['manual', 'auto'] } } }, example: { scope: 'district', stateId: 'ka', stateName: 'Karnataka', districtId: 'blr', districtName: 'Bengaluru Urban', source: 'manual' } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/UserLocation' } } } } } },
            '400': { description: 'Missing stateId for scope=state, or missing stateId/districtId for scope=district', content: { 'application/json': { examples: { noState: { value: { success: false, message: 'State is required.' } }, noDistrict: { value: { success: false, message: 'State and district are required.' } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to update location.' } } } },
          },
        },
      },
      '/users/location/detect': {
        post: {
          summary: 'Reverse-geocode coordinates and match against the seeded locations collection',
          tags: ['Location'],
          description: 'Does not persist anything — the client confirms the result, then saves it via PUT /users/location. Calls an external reverse-geocoding API.',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['lat', 'lng'], properties: { lat: { type: 'number' }, lng: { type: 'number' } } } } } },
          responses: {
            '200': { description: 'Match result', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { matched: { type: 'boolean' }, scope: { type: 'string', enum: ['state', 'district'] }, stateId: { type: 'string' }, stateName: { type: 'string' }, stateSlug: { type: 'string' }, districtId: { type: 'string' }, districtName: { type: 'string' }, districtSlug: { type: 'string' } } } } }, example: { success: true, data: { matched: true, scope: 'district', stateId: 'ka', stateName: 'Karnataka', stateSlug: 'karnataka', districtId: 'blr', districtName: 'Bengaluru Urban', districtSlug: 'bengaluru-urban' } } } } },
            '400': { description: 'lat/lng missing or not numbers', content: { 'application/json': { example: { success: false, message: 'lat and lng are required.' } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to resolve location.' } } } },
          },
        },
      },
      '/users/location/prompt-seen': {
        post: {
          summary: 'Mark the location auto-detect prompt as answered',
          tags: ['Location'],
          description: 'So the prompt is never shown again for this user, regardless of whether they allowed, denied, or dismissed it.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Marked', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to update.' } } } },
          },
        },
      },
      '/users/notifications': {
        get: {
          summary: "Get the current user's notification preference",
          tags: ['Notifications'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Preference', content: { 'application/json': { example: { success: true, data: { enabled: true } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
          },
        },
        put: {
          summary: "Update the current user's notification preference",
          tags: ['Notifications'],
          security: [{ bearerAuth: [] }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { enabled: { type: 'boolean', default: true } } } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { example: { success: true, data: { enabled: false } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
          },
        },
      },
      '/users/reading-history': {
        post: {
          summary: 'Upsert a legacy reading-history entry (unauthenticated)',
          tags: ['Reading History'],
          description: 'No auth guard — userId is taken directly from the body. Upserts into the legacy reading_history collection.',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { odellerId: { type: 'string', description: 'Optional explicit dedup key; defaults to `${userId}_${newsId}`.' }, userId: { type: 'string' }, newsId: { type: 'string' }, newsTitle: { type: 'string' }, newsExcerpt: { type: 'string' }, newsFeaturedImage: { type: 'string' }, newsCategory: { type: 'string' }, scrollPosition: { type: 'number' }, readPercentage: { type: 'number' } } } } } },
          responses: {
            '200': { description: 'Upserted', content: { 'application/json': { example: { success: true } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'message' } } } },
          },
        },
      },
      '/users/reading-progress': {
        post: {
          summary: 'Save (or clear) reading progress for an article',
          tags: ['Reading Progress'],
          description: 'scrollPercent >= 95 is treated as complete: the progress document is deleted instead of saved (so continue-reading naturally drops finished articles).',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['articleId'], properties: { articleId: { type: 'string' }, scrollY: { type: 'number' }, scrollPercent: { type: 'number' } } } } } },
          responses: {
            '200': { description: 'Saved or completed', content: { 'application/json': { examples: { saved: { value: { success: true, message: 'Reading progress saved.', completed: false } }, completed: { value: { success: true, message: 'Reading completed.', completed: true } } } } } },
            '400': { description: 'Missing articleId', content: { 'application/json': { example: { success: false, message: 'Article ID is required.' } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to save reading progress.' } } } },
          },
        },
      },
      '/users/reading-progress/{articleId}': {
        get: {
          summary: 'Get saved reading progress for one article',
          tags: ['Reading Progress'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Progress, or null if none saved', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { allOf: [{ $ref: '#/components/schemas/ReadingProgress' }], nullable: true } } } } } },
            '400': { description: 'Missing articleId', content: { 'application/json': { example: { success: false, message: 'Article ID is required.' } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to fetch reading progress.' } } } },
          },
        },
        delete: {
          summary: 'Delete saved reading progress for one article',
          tags: ['Reading Progress'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted (or wasn’t found)', content: { 'application/json': { example: { success: true, message: 'Reading progress removed.', deleted: true } } } },
            '400': { description: 'Missing articleId', content: { 'application/json': { example: { success: false, message: 'Article ID is required.' } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to delete reading progress.' } } } },
          },
        },
      },
      '/users/sync': {
        post: {
          summary: 'Create or update a user record from a Firebase sign-in (unauthenticated)',
          tags: ['Users'],
          description: 'No auth guard — matches/creates by firebaseUid from the body. Called right after client-side Firebase sign-in, before the JWT session cookie exists.',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['firebaseUid'], properties: { firebaseUid: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, avatar: { type: 'string' }, phone: { type: 'string', nullable: true }, fcmToken: { type: 'string', nullable: true } } } } } },
          responses: {
            '200': { description: 'Existing user updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, user: { $ref: '#/components/schemas/User' }, isNew: { type: 'boolean', example: false } } } } } },
            '201': { description: 'New user created (role defaults to reader; followedCategories/Authors/Cities start empty)', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, user: { $ref: '#/components/schemas/User' }, isNew: { type: 'boolean', example: true } } } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'message' } } } },
          },
        },
      },
      '/admin/comments': {
        get: {
          summary: 'List comments for moderation (admin/editor/reporter)',
          tags: ['Admin Comments'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'hidden', 'all'] } },
            { name: 'articleId', in: 'query', schema: { type: 'string' } },
            { name: 'userId', in: 'query', schema: { type: 'string' } },
            { name: 'reported', in: 'query', schema: { type: 'boolean' }, description: 'true = only comments with reports > 0.' },
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20, maximum: 100 } },
          ],
          responses: {
            '200': { description: 'Comments page', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Comment' } }, total: { type: 'number' }, page: { type: 'number' }, limit: { type: 'number' }, hasNext: { type: 'boolean' } } } } }, example: { success: true, message: 'Comments fetched successfully', data: { items: [], total: 0, page: 1, limit: 20 } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Unauthorized' } } } },
            '403': { description: 'Not a moderator (admin/editor/reporter)', content: { 'application/json': { example: { success: false, message: 'Forbidden' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/comments/{id}': {
        delete: {
          summary: 'Permanently delete a comment (admin/editor/reporter)',
          tags: ['Admin Comments'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Mongo ObjectId of the comment.' }],
          responses: {
            '200': { description: 'Deleted', content: { 'application/json': { example: { success: true, message: 'Comment deleted successfully', data: { success: true } } } } },
            '400': { description: 'Invalid comment id', content: { 'application/json': { example: { success: false, message: 'Invalid comment id' } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Comment not found', content: { 'application/json': { example: { success: false, message: 'Comment not found' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/comments/{id}/approve': {
        patch: {
          summary: 'Approve a pending comment (admin/editor/reporter)',
          tags: ['Admin Comments'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } },
          responses: {
            '200': { description: 'Approved', content: { 'application/json': { example: { success: true, message: 'Comment approved successfully', data: { success: true } } } } },
            '400': { description: 'Invalid comment id', content: { 'application/json': { example: { success: false, message: 'Invalid comment id' } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Comment not found', content: { 'application/json': { example: { success: false, message: 'Comment not found' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/comments/{id}/hide': {
        patch: {
          summary: 'Hide a comment (admin/editor/reporter)',
          tags: ['Admin Comments'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } },
          responses: {
            '200': { description: 'Hidden', content: { 'application/json': { example: { success: true, message: 'Comment hidden successfully', data: { success: true } } } } },
            '400': { description: 'Invalid comment id' },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Comment not found' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/comments/{id}/reject': {
        patch: {
          summary: 'Reject a pending comment (admin/editor/reporter)',
          tags: ['Admin Comments'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } },
          responses: {
            '200': { description: 'Rejected', content: { 'application/json': { example: { success: true, message: 'Comment rejected successfully', data: { success: true } } } } },
            '400': { description: 'Invalid comment id' },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Comment not found' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/calendar': {
        get: {
          summary: 'Get month activity dot-counts for the editorial calendar (admin/editor)',
          tags: ['Admin Calendar'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Counts unique articles (not raw events) per activity type per day, derived entirely from news document fields (publishedAt/scheduledAt/status/versionHistory/corrections) — no dedicated calendar collection.',
          parameters: [
            { name: 'start', in: 'query', required: true, schema: { type: 'string', format: 'date-time' } },
            { name: 'end', in: 'query', required: true, schema: { type: 'string', format: 'date-time' } },
            { name: 'type', in: 'query', schema: { type: 'string' }, description: 'Comma-separated activity types, e.g. "published,scheduled". One of: published, scheduled, updated, breaking, draft, tasks.' },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'role', in: 'query', schema: { type: 'string' }, description: "Filter by the acting user's role." },
            { name: 'author', in: 'query', schema: { type: 'string' }, description: "Case-insensitive substring match on the acting user's name." },
          ],
          responses: {
            '200': { description: 'Counts keyed by yyyy-MM-dd', content: { 'application/json': { example: { success: true, message: 'Calendar activity counts fetched successfully', data: { counts: { '2026-07-25': { published: 2, scheduled: 1, updated: 0, breaking: 0, draft: 1, tasks: 0 } } } } } } },
            '400': { description: 'Missing or invalid start/end', content: { 'application/json': { examples: { missing: { value: { success: false, message: 'start and end query params are required' } }, invalid: { value: { success: false, message: 'start and end must be valid dates' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not admin/editor' },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Schedule a draft article for future publication (admin, or editor with canPublishScheduled permission)',
          tags: ['Admin Calendar'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['articleId', 'scheduledAt'], properties: { articleId: { type: 'string' }, scheduledAt: { type: 'string', format: 'date-time' } } } } } },
          responses: {
            '200': { description: 'Scheduled', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: { article: { $ref: '#/components/schemas/NewsArticle' } } } } }, example: { success: true, message: 'Article scheduled successfully', data: { article: { id: 'news-123', status: 'scheduled' } } } } } },
            '400': { description: 'Missing fields, article already published, or scheduledAt not a valid future date', content: { 'application/json': { examples: { missing: { value: { success: false, message: 'articleId and scheduledAt are required' } }, alreadyPublished: { value: { success: false, message: 'Article is already published; unpublish it via PUT /api/admin/news/[id] before rescheduling' } }, invalidDate: { value: { success: false, message: 'scheduledAt must be a valid future date' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'No permission to schedule articles', content: { 'application/json': { example: { success: false, message: 'You do not have permission to schedule articles' } } } },
            '404': { description: 'Article not found', content: { 'application/json': { example: { success: false, message: 'Article not found' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/calendar/day': {
        get: {
          summary: 'Get the full itemized activity schedule for one day (admin/editor)',
          tags: ['Admin Calendar'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: '`summary` uses the same unique-article dedup as GET /admin/calendar; `sections` lists every discrete event un-deduplicated, grouped into schedule/published/updated/breaking/drafts/tasks.',
          parameters: [
            { name: 'date', in: 'query', required: true, schema: { type: 'string', format: 'date-time' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'role', in: 'query', schema: { type: 'string' } },
            { name: 'author', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Day activity', content: { 'application/json': { example: { success: true, message: 'Day activity fetched successfully', data: { activity: { date: '2026-07-25', summary: { published: 1, scheduled: 0, updated: 0, breaking: 0, draft: 0, tasks: 0 }, sections: { schedule: [], published: [], updated: [], breaking: [], drafts: [], tasks: [] } } } } } } },
            '400': { description: 'Missing or invalid date', content: { 'application/json': { examples: { missing: { value: { success: false, message: 'date query param is required' } }, invalid: { value: { success: false, message: 'date must be a valid date' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Not admin/editor' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/tags': {
        get: {
          summary: 'List all tags (admin/editor/reporter)',
          tags: ['Admin Tags'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          responses: {
            '200': { description: 'Tags list', content: { 'application/json': { schema: { type: 'object', properties: { tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to load tags' } } } },
          },
        },
        post: {
          summary: 'Create a tag (admin/editor)',
          tags: ['Admin Tags'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, slug: { type: 'string', description: 'Defaults to a slugified name if omitted.' }, description: { type: 'string' }, color: { type: 'string', default: '#2563EB' }, isActive: { type: 'boolean', default: true } } } } } },
          responses: {
            '201': { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, tag: { $ref: '#/components/schemas/Tag' } } } } } },
            '400': { description: 'Missing name', content: { 'application/json': { example: { error: 'Name is required' } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (not admin/editor)' },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to create tag' } } } },
          },
        },
      },
      '/admin/tags/{id}': {
        put: {
          summary: 'Update a tag (admin/editor)',
          tags: ['Admin Tags'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', description: 'Any Tag field except id/_id, which are stripped server-side if sent.', properties: { name: { type: 'string' }, slug: { type: 'string' }, description: { type: 'string' }, color: { type: 'string' }, isActive: { type: 'boolean' } } } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, tag: { $ref: '#/components/schemas/Tag' } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (not admin/editor)' },
            '404': { description: 'Tag not found', content: { 'application/json': { example: { error: 'Tag not found' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to update tag' } } } },
          },
        },
        delete: {
          summary: 'Delete a tag (admin/editor)',
          tags: ['Admin Tags'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Deletes unconditionally — no existence check, so this returns success even when the id did not match any tag.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (not admin/editor)' },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to delete tag' } } } },
          },
        },
      },
      '/admin/settings/comment-moderation': {
        get: {
          summary: 'Get the platform comment moderation settings (admin/editor/reporter)',
          tags: ['Admin Settings'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Auto-creates a default document (mode: "auto", delaySeconds: 3) on first read if none exists yet.',
          responses: {
            '200': { description: 'Settings', content: { 'application/json': { example: { success: true, settings: { _id: 'comment_moderation', mode: 'auto', delaySeconds: 3, updatedBy: null, updatedAt: '2026-07-20T10:00:00.000Z' } } } } },
            '403': { description: 'Not authenticated or not staff — both cases return 403 here (no 401 is used by this route).', content: { 'application/json': { example: { error: 'Unauthorized' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Something went wrong' } } } },
          },
        },
        post: {
          summary: 'Update the platform comment moderation settings (admin/editor/reporter)',
          tags: ['Admin Settings'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['mode', 'delaySeconds'], properties: { mode: { type: 'string', enum: ['auto', 'manual'] }, delaySeconds: { type: 'number', minimum: 0, description: 'Seconds a new comment waits before auto-approval when mode is "auto".' } } } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { example: { success: true, settings: { _id: 'comment_moderation', mode: 'manual', delaySeconds: 0, updatedBy: 'admin-uuid-1', updatedAt: '2026-07-25T09:00:00.000Z' } } } } },
            '400': { description: 'Invalid mode or delaySeconds', content: { 'application/json': { examples: { badMode: { value: { error: 'Invalid moderation mode' } }, badDelay: { value: { error: 'Invalid delay' } } } } } },
            '403': { description: 'Not authenticated or not staff', content: { 'application/json': { example: { error: 'Unauthorized' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/reporter-metrics': {
        get: {
          summary: 'List engagement metrics per reporter, across all published articles (admin/editor)',
          tags: ['Admin Reporter Metrics'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'One row per author with at least one published article, sorted by views descending. `exists: false` means the author user document is missing/deleted.',
          responses: {
            '200': { description: 'Reporter metrics list', content: { 'application/json': { schema: { type: 'object', properties: { reporters: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, avatar: { type: 'string' }, role: { type: 'string' }, exists: { type: 'boolean' }, articlesPublished: { type: 'number' }, views: { type: 'number' }, shares: { type: 'number' }, comments: { type: 'number' }, bookmarks: { type: 'number' }, likes: { type: 'number' } } } } } }, example: { reporters: [{ id: 'reporter-uuid-1', name: 'Asha Rao', avatar: 'https://example.com/avatar.jpg', role: 'reporter', exists: true, articlesPublished: 24, views: 15230, shares: 340, comments: 88, bookmarks: 120, likes: 610 }] } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor)' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/reporter-metrics/{id}': {
        get: {
          summary: "Get one reporter's full metrics breakdown, article by article (admin/editor)",
          tags: ['Admin Reporter Metrics'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: "The reporter's user id." }],
          responses: {
            '200': { description: 'Reporter detail with totals and per-article breakdown', content: { 'application/json': { schema: { type: 'object', properties: { reporter: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, avatar: { type: 'string' }, role: { type: 'string' }, bio: { type: 'string' } } }, totals: { type: 'object', properties: { articlesPublished: { type: 'number' }, views: { type: 'number' }, shares: { type: 'number' }, comments: { type: 'number' }, bookmarks: { type: 'number' }, likes: { type: 'number' } } }, articles: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, category: { type: 'string' }, publishedAt: { type: 'string', format: 'date-time' }, views: { type: 'number' }, shares: { type: 'number' }, comments: { type: 'number' }, bookmarks: { type: 'number' }, likes: { type: 'number' } } } } } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (not admin/editor)' },
            '404': { description: 'Reporter not found', content: { 'application/json': { example: { error: 'Reporter not found' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/push-tokens': {
        get: {
          summary: 'List all registered push notification tokens with owner emails (admin only)',
          tags: ['Admin Push Tokens'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Admin-only, since this exposes PII (device tokens + user emails).',
          responses: {
            '200': { description: 'Tokens list', content: { 'application/json': { schema: { type: 'object', properties: { tokens: { type: 'array', items: { type: 'object', properties: { userId: { type: 'string' }, token: { type: 'string' }, provider: { type: 'string' }, platform: { type: 'string' }, email: { type: 'string', nullable: true }, lastSeenAt: { type: 'string', format: 'date-time' } } } }, count: { type: 'number' } } }, example: { tokens: [{ userId: 'user-uuid-1', token: 'fcm-token-abc', provider: 'fcm', platform: 'android', email: 'reader@example.com', lastSeenAt: '2026-07-24T18:00:00.000Z' }], count: 1 } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (admin only)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/youtube-config': {
        get: {
          summary: 'Get the configured YouTube live/embed settings (admin/editor/reporter)',
          tags: ['Admin Youtube'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          responses: {
            '200': { description: 'Config (empty object if never set)', content: { 'application/json': { example: { config: { key: 'youtube', videoId: 'dQw4w9WgXcQ', channelId: 'UC1234', title: 'Live coverage', isLive: true, updatedAt: '2026-07-25T08:00:00.000Z' } } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden' },
            '500': { description: 'Server error' },
          },
        },
        post: {
          summary: 'Set the YouTube live/embed settings (admin/editor)',
          tags: ['Admin Youtube'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Upserts a single `config` document keyed by key="youtube".',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { videoId: { type: 'string', nullable: true }, channelId: { type: 'string', nullable: true }, title: { type: 'string', nullable: true }, isLive: { type: 'boolean', default: false } } } } } },
          responses: {
            '200': { description: 'Saved', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated' },
            '403': { description: 'Forbidden (not admin/editor)' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/ads/analytics': {
        get: {
          summary: 'Get aggregate ad impression/click/revenue stats (admin/editor)',
          tags: ['Admin Ads'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Reads the ad_impressions collection. `stats.ctr` is a string (toFixed(2)) unless there are zero impressions, in which case it is the number 0.',
          responses: {
            '200': { description: 'Ad analytics', content: { 'application/json': { schema: { type: 'object', properties: { stats: { type: 'object', properties: { totalImpressions: { type: 'number' }, todayImpressions: { type: 'number' }, totalClicks: { type: 'number' }, todayClicks: { type: 'number' }, ctr: { type: 'string', description: 'Percentage, e.g. "3.42". Numeric 0 when totalImpressions is 0.' }, totalRevenue: { type: 'number' } } }, byType: { type: 'array', items: { type: 'object', properties: { _id: { type: 'string', description: 'adType' }, impressions: { type: 'number' }, clicks: { type: 'number' } } } }, byPlacement: { type: 'array', items: { type: 'object', properties: { _id: { type: 'string', description: 'placement' }, impressions: { type: 'number' }, clicks: { type: 'number' } } } } } }, example: { stats: { totalImpressions: 48213, todayImpressions: 512, totalClicks: 1104, todayClicks: 19, ctr: '2.29', totalRevenue: 3421.5 }, byType: [{ _id: 'banner', impressions: 30000, clicks: 700 }], byPlacement: [{ _id: 'in-feed', impressions: 20000, clicks: 500 }] } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor)' },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/news/{id}': {
        put: {
          summary: 'Update an article — also the entry point for status-workflow transitions (submit/approve/publish) and breaking/trending flags',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Any authenticated user may call this; canEditArticle then gates the edit (reporters may only edit their own draft/needs_revision articles). Touching isBreaking/breakingSuggested/trendingSuggested/isTrending or a status change each require their own permission. Every call pushes a snapshot of the pre-edit article onto versionHistory. The response `news` field is the full document, which carries extra workflow fields (versionHistory, approvalHistory, corrections, etc.) not reflected in the NewsArticle schema.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  description: 'Partial update — only fields present are applied. All optional.',
                  properties: {
                    title: { type: 'string' }, content: { type: 'string' }, excerpt: { type: 'string' },
                    category: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
                    featuredImage: { type: 'string' },
                    status: { type: 'string', enum: ['draft', 'pending_review', 'needs_revision', 'ready_to_publish', 'published', 'scheduled', 'rejected'] },
                    isBreaking: { type: 'boolean' }, breakingSuggested: { type: 'boolean' },
                    trendingSuggested: { type: 'boolean' }, isTrending: { type: 'boolean' },
                    scheduledAt: { type: 'string', format: 'date-time', nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, news: { $ref: '#/components/schemas/NewsArticle' } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Unauthorized' } } } },
            '403': { description: 'Forbidden — reason depends on what the body touched', content: { 'application/json': { examples: {
              cannotEdit: { value: { error: 'Cannot edit this article' } },
              cannotSuggestBreaking: { value: { error: 'Cannot suggest breaking news' } },
              cannotMarkBreaking: { value: { error: 'Only admin can mark articles as breaking news' } },
              cannotApproveTrending: { value: { error: 'Cannot approve trending status' } },
              cannotSubmit: { value: { error: 'Cannot submit for review' } },
              cannotApprove: { value: { error: 'Cannot approve article' } },
              cannotPublish: { value: { error: 'Cannot publish article' } },
            } } } },
            '404': { description: 'Article not found', content: { 'application/json': { example: { error: 'Article not found' } } } },
            '500': { description: 'Server error' },
          },
        },
        delete: {
          summary: 'Delete an article',
          tags: ['Admin News'],
          description: 'No auth guard is present in this handler (unlike the PUT on the same route) — any caller who can reach the route can delete any article. Flagging as a likely gap; verify before relying on it being admin-only.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted', content: { 'application/json': { example: { success: true } } } },
            '404': { description: 'Article not found', content: { 'application/json': { example: { error: 'News not found' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/news/{id}/approve': {
        post: {
          summary: 'Approve and publish an article (admin/editor)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Sets status=published, publishedAt=now, and appends an approvalHistory entry ({ action: "approved", by, byName, at, comment }).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { comment: { type: 'string', example: 'Approved for publication' } } } } } },
          responses: {
            '200': { description: 'success reflects whether the article was found and modified', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to approve article' } } } },
          },
        },
      },
      '/admin/news/{id}/approve-breaking': {
        post: {
          summary: 'Approve a breaking-news suggestion (admin only)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Sets isBreaking=true, breakingApproved=true, appends an approvalHistory entry, and sends a breaking-news notification. Missing auth and insufficient role both return 403 (this route never returns 401).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { comment: { type: 'string', example: 'Breaking news approved' } } } } } },
          responses: {
            '200': { description: 'success reflects whether the article was found and modified', content: { 'application/json': { example: { success: true } } } },
            '403': { description: 'Not authenticated, or not admin', content: { 'application/json': { example: { error: 'Unauthorized - Admin only' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/news/{id}/approve-trending': {
        post: {
          summary: 'Approve a trending suggestion (admin/editor)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Sets isTrending=true, appends an approvalHistory entry, and sends a trending notification. Missing auth and insufficient role both return 403 (this route never returns 401).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { comment: { type: 'string', example: 'Trending status approved' } } } } } },
          responses: {
            '200': { description: 'success reflects whether the article was found and modified', content: { 'application/json': { example: { success: true } } } },
            '403': { description: 'Not authenticated, or not admin/editor', content: { 'application/json': { example: { error: 'Unauthorized' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/news/{id}/breaking': {
        post: {
          summary: 'Mark or unmark an article as breaking news (admin only)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Sets isBreaking/breakingApproved to the given value (defaults to false if omitted — so an empty body unmarks) and appends an approvalHistory entry (marked_breaking/unmarked_breaking). Sends a breaking-news notification only when isBreaking is set true. Missing auth and insufficient role both return 403.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { isBreaking: { type: 'boolean', default: false } } } } } },
          responses: {
            '200': { description: 'success reflects whether the article was found and modified', content: { 'application/json': { example: { success: true } } } },
            '403': { description: 'Not authenticated, or not admin', content: { 'application/json': { example: { error: 'Unauthorized - Admin only' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/news/{id}/correction': {
        post: {
          summary: 'Append a published correction note to an article (admin/editor)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Pushes { id, text, by, byName, at } onto the article’s corrections array. `text` is not validated server-side — an empty/missing text is stored as-is.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { text: { type: 'string', example: 'Corrected the reported casualty figure.' } } } } } },
          responses: {
            '200': { description: 'success reflects whether the article was found and modified', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to add correction' } } } },
          },
        },
      },
      '/admin/news/{id}/publish': {
        post: {
          summary: 'Publish an article directly (admin only)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Sets status=published, publishedAt=now, approvedBy=caller, appends an approvalHistory entry, and — only when notify:true is passed and the update took effect — sends a "published" notification. Missing auth and insufficient role both return 403.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { comment: { type: 'string', example: 'Published' }, notify: { type: 'boolean', default: false } } } } } },
          responses: {
            '200': { description: 'success reflects whether the article was found and modified', content: { 'application/json': { example: { success: true } } } },
            '403': { description: 'Not authenticated, or not admin', content: { 'application/json': { example: { error: 'Unauthorized - Admin only' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/news/{id}/reject': {
        post: {
          summary: 'Reject an article (admin/editor)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Sets status="rejected" and appends an approvalHistory entry ({ action: "rejected", by, byName, at, comment }).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { comment: { type: 'string', example: 'Rejected - needs revision' } } } } } },
          responses: {
            '200': { description: 'success reflects whether the article was found and modified', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to reject article' } } } },
          },
        },
      },
      '/admin/news/{id}/revise': {
        post: {
          summary: 'Send an article back for revision (admin/editor)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Sets status="NEEDS_REVISION" (uppercase literal — inconsistent with the lowercase "needs_revision" produced by normalizeStatus elsewhere) and reviewedBy=caller, then appends both an approvalHistory entry (action: "sent_back") and a corrections entry with the same comment text. Missing auth and insufficient role both return 403.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { comment: { type: 'string', example: 'Please revise the article' } } } } } },
          responses: {
            '200': { description: 'success reflects whether the article was found and modified', content: { 'application/json': { example: { success: true } } } },
            '403': { description: 'Not authenticated, or not admin/editor', content: { 'application/json': { example: { error: 'Unauthorized' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/news/{id}/submit': {
        post: {
          summary: 'Submit a draft article for review (admin/editor/reporter)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Sets status="pending" (not normalizeStatus’s "pending_review") and appends an approvalHistory entry ({ action: "submitted", by, byName, at, comment }). Reporters use this to submit their own drafts.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { comment: { type: 'string', example: 'Submitted for review' } } } } } },
          responses: {
            '200': { description: 'success reflects whether the article was found and modified', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor/reporter)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to submit article' } } } },
          },
        },
      },
      '/admin/news/{id}/versions': {
        get: {
          summary: 'List an article’s version history (admin/editor)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Returns an abbreviated view of each versionHistory entry (id, version, title, status, editedBy, editedByName, editedAt — no content/excerpt/tags), newest first. Use the {versionId} route for the full snapshot.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Version list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, articleId: { type: 'string' }, title: { type: 'string' }, versions: { type: 'array', items: { $ref: '#/components/schemas/NewsVersion' } } } }, example: { success: true, articleId: 'news-123', title: 'Breaking News Title', versions: [{ id: 'a1b2c3', version: 2, title: 'Breaking News Title (edited)', status: 'draft', editedBy: 'user-1', editedByName: 'Jane Editor', editedAt: '2026-07-20T10:00:00.000Z' }] } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '404': { description: 'Article not found', content: { 'application/json': { example: { error: 'Article not found' } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/news/{id}/versions/{versionId}': {
        get: {
          summary: 'Get one version snapshot in full (admin/editor)',
          tags: ['Admin News'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'versionId', in: 'path', required: true, schema: { type: 'string' }, description: 'The version snapshot’s own id (versionHistory[].id), not a position/index.' },
          ],
          responses: {
            '200': { description: 'Full version snapshot', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, articleId: { type: 'string' }, version: { $ref: '#/components/schemas/NewsVersion' } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '404': { description: 'Article not found, or versionId not found in its versionHistory', content: { 'application/json': { examples: { article: { value: { error: 'Article not found' } }, version: { value: { error: 'Version not found' } } } } } },
            '500': { description: 'Server error' },
          },
        },
      },
      '/admin/categories/{id}': {
        put: {
          summary: 'Update a category (admin/editor)',
          tags: ['Admin Categories'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Full/partial field overwrite via $set — whatever the body contains is written as-is (id/_id are stripped first). No field allowlist, unlike the Users PUT.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, slug: { type: 'string' }, description: { type: 'string' }, color: { type: 'string' }, icon: { type: 'string' }, order: { type: 'number' }, isActive: { type: 'boolean' } } } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '404': { description: 'Category not found', content: { 'application/json': { example: { error: 'Category not found' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to update category' } } } },
          },
        },
        delete: {
          summary: 'Delete a category (admin/editor)',
          tags: ['Admin Categories'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Hard delete, and unconditional — returns success:true even if no category matched the id (deleteOne’s result is not checked).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted (or no-op if id did not exist)', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin/editor)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to delete category' } } } },
          },
        },
      },
      '/admin/users/{id}': {
        put: {
          summary: 'Update a user (admin only)',
          tags: ['Admin Users'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Only an allowlist of fields is writable (name, role, bio, avatar, isActive, isVerified, permissions, email) — prevents mass-assignment/role-escalation via extra body fields. email is lowercased, role is lowercased/trimmed. `password`, if present, is hashed before storage (never plaintext) and is handled separately from the allowlist.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string', enum: ['admin', 'editor', 'reporter', 'user'] }, bio: { type: 'string' }, avatar: { type: 'string' }, isActive: { type: 'boolean' }, isVerified: { type: 'boolean' }, permissions: { type: 'object' }, email: { type: 'string' }, password: { type: 'string', description: 'Hashed server-side before storage.' } } } } } },
          responses: {
            '200': { description: 'Updated', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '404': { description: 'User not found', content: { 'application/json': { example: { error: 'User not found' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to update user' } } } },
          },
        },
        delete: {
          summary: 'Delete a user (admin only)',
          tags: ['Admin Users'],
          security: [{ bearerAuth: [] }, { adminTokenHeader: [] }],
          description: 'Hard delete, and unconditional — returns success:true even if no user matched the id (deleteOne’s result is not checked).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted (or no-op if id did not exist)', content: { 'application/json': { example: { success: true } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { error: 'Authentication required' } } } },
            '403': { description: 'Forbidden (not admin)', content: { 'application/json': { example: { error: 'Forbidden' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to delete user' } } } },
          },
        },
      },
      '/ads/click': {
        post: {
          summary: 'Record a click on a previously-recorded ad impression (public)',
          tags: ['Ads'],
          description: 'Sets clicked=true, clickedAt=now on the ad_impressions document matching impressionId. Still returns 200 if no document matches (updateOne with zero matches is not treated as an error).',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['impressionId'], properties: { impressionId: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' } } } } } },
          responses: {
            '200': { description: 'Recorded', content: { 'application/json': { example: { success: true } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Internal error message' } } } },
          },
        },
      },
      '/ads/config': {
        get: {
          summary: 'Get ad placement configuration (public)',
          tags: ['Ads'],
          description: 'Returns the static ADS_CONFIG object — not read from the database.',
          responses: {
            '200': {
              description: 'Ad config',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { config: { type: 'object', properties: {
                    placements: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, type: { type: 'string', enum: ['programmatic', 'native', 'video'] }, position: { type: 'string' }, size: { type: 'string', description: 'Present for programmatic banner placements, e.g. "728x90".' }, afterParagraph: { type: 'number', description: 'Present for native in-article placements.' }, duration: { type: 'number', description: 'Present for the video-preroll placement (seconds).' }, enabled: { type: 'boolean' } } } },
                    refreshInterval: { type: 'number', example: 30000 },
                    lazyLoad: { type: 'boolean', example: true },
                  } } } },
                  example: { config: { placements: [{ id: 'header-banner', type: 'programmatic', position: 'header', size: '728x90', enabled: true }], refreshInterval: 30000, lazyLoad: true } },
                },
              },
            },
          },
        },
      },
      '/ads/impression': {
        post: {
          summary: 'Record an ad impression (public)',
          tags: ['Ads'],
          description: 'Inserts a new ad_impressions document with a generated id; the returned impressionId is later passed to POST /ads/click.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['adId', 'adType', 'placement', 'sessionId'], properties: {
              adId: { type: 'string' }, adType: { type: 'string' }, placement: { type: 'string', example: 'header-banner' },
              userId: { type: 'string', nullable: true, description: 'Omit/null for anonymous viewers.' },
              sessionId: { type: 'string' }, newsId: { type: 'string', nullable: true },
              estimatedRevenue: { type: 'number', default: 0 },
            } } } },
          },
          responses: {
            '200': { description: 'Recorded', content: { 'application/json': { example: { success: true, impressionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Internal error message' } } } },
          },
        },
      },
      '/analytics/session': {
        post: {
          summary: 'Record or heartbeat an anonymous analytics session (public)',
          tags: ['Analytics'],
          description: 'Upserts a session document keyed by sessionId; increments a global totalSessions counter only the first time a given sessionId is seen.',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['sessionId'], properties: { sessionId: { type: 'string' } } } } } },
          responses: {
            '200': { description: 'Session recorded', content: { 'application/json': { example: { success: true, sessionId: 'abc123', insertedNewSession: true, totalSessions: 4821 } } } },
            '400': { description: 'Missing sessionId', content: { 'application/json': { example: { error: 'sessionId is required' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Internal server error' } } } },
          },
        },
      },
      '/auth/logout': {
        post: {
          summary: 'Clear the khabaron_session cookie',
          tags: ['Auth'],
          description: 'Clears the httpOnly session cookie. Does not verify or require an existing session — safe to call unconditionally.',
          responses: {
            '200': { description: 'Logged out', content: { 'application/json': { example: { success: true, message: 'Logged out successfully' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to logout' } } } },
          },
        },
      },
      '/auth/session': {
        post: {
          summary: 'Exchange a Firebase ID token for a KhabarON session',
          tags: ['Auth'],
          description: 'Verifies the Firebase ID token server-side, upserts the corresponding users document (creating it on first login), signs a 7-day session JWT, and sets it as the httpOnly khabaron_session cookie. The same token is also returned in the body for mobile clients (no cookie jar) to store and send back as `Authorization: Bearer <token>`.',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['idToken'], properties: { idToken: { type: 'string', description: 'Firebase ID token from the client SDK sign-in flow.' } } } } } },
          responses: {
            '200': {
              description: 'Login successful',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object', properties: {
                user: { allOf: [{ $ref: '#/components/schemas/User' }, { type: 'object', properties: { firebaseUid: { type: 'string' }, phone: { type: 'string', nullable: true }, avatar: { type: 'string' }, provider: { type: 'string', example: 'google.com' }, isActive: { type: 'boolean' }, lastLoginAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }] },
                token: { type: 'string', description: 'The signed session JWT — same value set as the khabaron_session cookie.' },
              } } } }, example: { success: true, message: 'Login successful', data: { user: { id: 'user-uuid', email: 'reader@example.com', name: 'Reader', role: 'user' }, token: 'eyJhbGciOi...' } } } },
            },
            '400': { description: 'Missing idToken', content: { 'application/json': { example: { success: false, message: 'Firebase ID Token is required' } } } },
            '401': { description: 'Firebase token invalid/expired', content: { 'application/json': { example: { success: false, message: 'Invalid Firebase token' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Unable to create session' } } } },
          },
        },
      },
      '/authors/{id}': {
        get: {
          summary: 'Get a public author profile and their recent published articles',
          tags: ['Authors'],
          description: 'Only returns users whose role is reporter, editor, or admin. The password field is stripped before returning.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Author profile with up to 10 recent published articles', content: { 'application/json': { schema: { type: 'object', properties: { author: { $ref: '#/components/schemas/User' }, articles: { type: 'array', items: { $ref: '#/components/schemas/NewsArticle' }, description: 'status=published only, sorted by publishedAt desc, limit 10.' } } } } } },
            '404': { description: 'Author not found (or found but not reporter/editor/admin)', content: { 'application/json': { example: { error: 'Author not found' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Internal error message' } } } },
          },
        },
      },
      '/cron/notifications': {
        get: {
          summary: 'Safety-net sweep to recover stuck/undispatched notification jobs (Vercel Cron only)',
          tags: ['Cron'],
          description: 'Not a user-facing route — real notification delivery happens inline from admin approval routes. This sweep just recovers jobs that never dispatched (e.g. a crashed request) or got stuck mid-send. Runs once/day per vercel.json. Authenticated via a `Authorization: Bearer <CRON_SECRET>` header that Vercel signs on scheduled invocations — this is a shared secret, NOT a user JWT, and does not use the bearerAuth or adminTokenHeader schemes defined elsewhere in this spec. Processes up to 50 pending jobs per invocation (bounded to avoid timing out on a large backlog).',
          parameters: [{ name: 'Authorization', in: 'header', required: true, schema: { type: 'string', example: 'Bearer <CRON_SECRET>' }, description: 'Vercel Cron shared secret.' }],
          responses: {
            '200': { description: 'Sweep completed', content: { 'application/json': { example: { success: true, recovered: 2, processed: 3, jobIds: ['job-1', 'job-2', 'job-3'] } } } },
            '401': { description: 'Missing/incorrect Authorization header', content: { 'application/json': { example: { error: 'Unauthorized' } } } },
            '500': { description: 'CRON_SECRET not configured on the server', content: { 'application/json': { example: { error: 'CRON_SECRET not configured' } } } },
          },
        },
      },
      '/health': {
        get: {
          summary: 'Liveness check (public)',
          tags: ['Health'],
          responses: {
            '200': { description: 'Service is up', content: { 'application/json': { example: { status: 'ok', timestamp: '2026-07-25T10:00:00.000Z' } } } },
          },
        },
      },
      '/locations/districts': {
        get: {
          summary: 'Get active districts for a state (public)',
          tags: ['Locations'],
          description: 'Response is edge-cached for 24 hours (revalidate = 86400).',
          parameters: [{ name: 'stateId', in: 'query', required: true, schema: { type: 'string' }, description: "The parent state's id." }],
          responses: {
            '200': { description: 'Districts for the given state', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/District' } } } } } } },
            '400': { description: 'Missing stateId', content: { 'application/json': { example: { success: false, message: 'stateId is required.' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to fetch districts.' } } } },
          },
        },
      },
      '/locations/states': {
        get: {
          summary: 'Get active states (public)',
          tags: ['Locations'],
          description: 'Response is edge-cached for 24 hours (revalidate = 86400).',
          responses: {
            '200': { description: 'List of states', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/State' } } } } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { success: false, message: 'Failed to fetch states.' } } } },
          },
        },
      },
      '/market/quotes': {
        get: {
          summary: 'Get live market quotes (public)',
          tags: ['Market'],
          description: 'ids is a comma-separated list of instrument ids (sensex, nifty, banknifty, gold, silver, usdinr, crude, crypto); unknown ids are silently dropped. Defaults to only the currently enabled instruments (sensex, nifty). Backed by a short-lived fresh cache plus a last-known-good fallback (stale:true) if the upstream Yahoo Finance call fails. Response is edge-cached 10s (stale-while-revalidate 30s).',
          parameters: [{ name: 'ids', in: 'query', schema: { type: 'string' }, example: 'sensex,nifty', description: 'Comma-separated instrument ids. Defaults to the enabled set.' }],
          responses: {
            '200': {
              description: 'Quotes for the requested instruments',
              content: { 'application/json': { schema: { type: 'object', properties: { quotes: { type: 'array', items: { type: 'object', properties: {
                id: { type: 'string', example: 'sensex' }, name: { type: 'string' }, shortName: { type: 'string' },
                value: { type: 'number' }, change: { type: 'number' }, changePercent: { type: 'number' },
                direction: { type: 'string', enum: ['up', 'down', 'flat'] }, currency: { type: 'string', nullable: true },
                previousClose: { type: 'number', nullable: true }, dayHigh: { type: 'number', nullable: true }, dayLow: { type: 'number', nullable: true },
                marketState: { type: 'string', nullable: true, example: 'REGULAR' }, marketTime: { type: 'number', nullable: true, description: 'Unix ms.' },
                updatedAt: { type: 'number', description: 'Unix ms.' }, available: { type: 'boolean' }, stale: { type: 'boolean', description: 'true when this is a last-known-good fallback quote, not a fresh fetch.' },
                error: { type: 'string', description: 'Present only when available=false.' },
              } } } } }, example: { quotes: [{ id: 'sensex', name: 'Sensex', shortName: 'SENSEX', value: 81234.56, change: 120.3, changePercent: 0.15, direction: 'up', currency: 'INR', available: true, stale: false }] } } },
            },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to load market data', quotes: [] } } } },
          },
        },
      },
      '/subscribers': {
        get: {
          summary: 'Get all active email subscribers',
          tags: ['Subscribers'],
          description: 'No auth guard in the current implementation — returns full subscriber records, including email addresses, to any caller.',
          responses: {
            '200': { description: 'Active subscribers', content: { 'application/json': { schema: { type: 'object', properties: { subscribers: { type: 'array', items: { type: 'object', properties: { email: { type: 'string' }, isActive: { type: 'boolean' }, subscribedAt: { type: 'string', format: 'date-time' } } } }, count: { type: 'number' } } }, example: { subscribers: [{ email: 'reader@example.com', isActive: true, subscribedAt: '2026-01-10T08:00:00.000Z' }], count: 1 } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Internal error message' } } } },
          },
        },
      },
      '/tags': {
        get: {
          summary: 'Get active tags, newest first (public)',
          tags: ['Tags'],
          description: 'Public read-only counterpart to /admin/tags (which requires admin auth and returns all tags regardless of isActive). Response is edge-cached for 5 minutes.',
          responses: {
            '200': { description: 'Active tags', content: { 'application/json': { schema: { type: 'object', properties: { tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } } } } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Internal error message' } } } },
          },
        },
      },
      '/youtube/live': {
        get: {
          summary: 'Get the current YouTube live/latest-video status for the configured channel',
          tags: ['YouTube'],
          description: "Three-tier resolution: (1) if an admin has set a manual videoId in config (key=\"youtube\"), that always wins (manual:true); (2) else, if channelId + apiKey are configured, queries the YouTube Data API for an active livestream, falling back to the channel's latest uploaded video if none is live; (3) if channelId/apiKey are missing or still a placeholder, returns configured:false or liveDetection:false instead of erroring. No OPTIONS/CORS preflight support on this route.",
          responses: {
            '200': {
              description: 'Live/latest video status — shape varies by tier, see examples',
              content: { 'application/json': { schema: { type: 'object', properties: {
                isLive: { type: 'boolean' }, configured: { type: 'boolean' }, manual: { type: 'boolean' }, liveDetection: { type: 'boolean' },
                videoId: { type: 'string' }, channelId: { type: 'string' }, uploadsPlaylistId: { type: 'string' },
                title: { type: 'string', nullable: true }, thumbnail: { type: 'string' }, channelTitle: { type: 'string' }, error: { type: 'string' },
              } }, examples: {
                manualOverride: { summary: 'Admin-configured manual videoId', value: { isLive: true, configured: true, manual: true, videoId: 'dQw4w9WgXcQ', channelId: 'UCxxxx', title: 'Live: City Council Session' } },
                liveDetected: { summary: 'Live via YouTube Data API', value: { isLive: true, configured: true, liveDetection: true, channelId: 'UCxxxx', videoId: 'dQw4w9WgXcQ', title: 'Breaking: Live coverage', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', channelTitle: 'KhabarON' } },
                latestFallback: { summary: 'Not live, latest upload returned instead', value: { isLive: false, configured: true, liveDetection: true, channelId: 'UCxxxx', videoId: 'abc123', title: "Yesterday's bulletin", channelTitle: 'KhabarON' } },
                notConfigured: { summary: 'No channelId configured', value: { isLive: false, configured: false } },
              } } },
            },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Internal error message' } } } },
          },
        },
      },
      '/subscriptions': {
        post: {
          summary: 'Create (activate) a subscription for the signed-in user',
          tags: ['Subscriptions'],
          security: [{ bearerAuth: [] }],
          description: 'Bound to the session user (not an arbitrary userId in the body). Non-free plans require a valid Razorpay payment signature, verified server-side via HMAC — the subscription is rejected (402) if it doesn’t check out.',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    plan: { type: 'string', enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free', example: 'premium' },
                    razorpayOrderId: { type: 'string', description: 'Required (with paymentId/signature) for any non-free plan. Also accepted as razorpay_order_id.' },
                    razorpayPaymentId: { type: 'string', description: 'Also accepted as razorpay_payment_id.' },
                    razorpaySignature: { type: 'string', description: 'Also accepted as razorpay_signature. HMAC_SHA256(`orderId|paymentId`, key_secret).' },
                    autoRenew: { type: 'boolean', default: true },
                  },
                },
                example: { plan: 'premium', razorpayOrderId: 'order_abc123', razorpayPaymentId: 'pay_xyz789', razorpaySignature: 'generated_signature_hash' },
              },
            },
          },
          responses: {
            '201': { description: 'Subscription created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, subscription: { $ref: '#/components/schemas/Subscription' } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
            '402': { description: 'Payment signature verification failed (non-free plan)', content: { 'application/json': { example: { error: 'Payment verification failed' } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Failed to create subscription' } } } },
          },
        },
      },
      '/subscriptions/{id}/cancel': {
        post: {
          summary: 'Cancel a subscription',
          tags: ['Subscriptions'],
          description: 'Sets status to "cancelled" and autoRenew to false by subscription id. Note: this route does not check authentication or verify the caller owns the subscription.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: "The subscription's id (not the user id)." }],
          responses: {
            '200': { description: 'Cancelled', content: { 'application/json': { example: { success: true } } } },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Some error message' } } } },
          },
        },
      },
      '/subscriptions/plans': {
        get: {
          summary: 'List available subscription plans',
          tags: ['Subscriptions'],
          description: 'Static plan catalog (free/basic/premium/enterprise) used to render pricing/upgrade UI.',
          responses: {
            '200': {
              description: 'Plan list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      plans: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', enum: ['free', 'basic', 'premium', 'enterprise'] },
                            name: { type: 'string', example: 'Premium' },
                            price: { type: 'number', example: 299 },
                            period: { type: 'string', example: 'month' },
                            features: { type: 'array', items: { type: 'string' }, example: ['Unlimited articles', 'Ad-free experience'] },
                            popular: { type: 'boolean' },
                          },
                        },
                      },
                    },
                  },
                  example: { plans: [{ id: 'free', name: 'Free', price: 0, period: 'forever', features: ['10 articles per day', 'Standard news access', 'Ad-supported'], popular: false }] },
                },
              },
            },
          },
        },
      },
      '/subscriptions/user/{id}': {
        get: {
          summary: "Get a user's active subscription",
          tags: ['Subscriptions'],
          description: "Looks up the active subscription for the given user id. Not auth-gated — the id is taken directly from the path and any caller can query any user's subscription. Falls back to a free-plan placeholder (no id/dates) if the user has no active subscription.",
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'The user id (users.id, not the subscription id).' }],
          responses: {
            '200': {
              description: 'Active subscription, or a free-plan fallback',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { subscription: { $ref: '#/components/schemas/Subscription' } } },
                  examples: {
                    active: { value: { subscription: { id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab', userId: 'user-123', plan: 'premium', status: 'active', autoRenew: true } } },
                    none: { summary: 'No active subscription found', value: { subscription: { plan: 'free', features: { adsEnabled: true, articleLimit: 10, offlineAccess: false, exclusiveContent: false, earlyAccess: false, noAds: false } } } },
                  },
                },
              },
            },
            '500': { description: 'Server error', content: { 'application/json': { example: { error: 'Some error message' } } } },
          },
        },
      },
      '/test/cookie': {
        get: {
          summary: 'Debug: dump all cookies on the request',
          tags: ['Test'],
          description: 'Diagnostic endpoint (not for production use) that returns every cookie visible to the server, for inspecting session/cookie state during development.',
          responses: {
            '200': {
              description: 'All cookies on the incoming request',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { cookies: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' } } } } } },
                  example: { cookies: [{ name: 'khabaron_session', value: 'eyJhbGciOi...' }] },
                },
              },
            },
          },
        },
      },
      '/test/firebase': {
        get: {
          summary: 'Debug: verify the Firebase Admin SDK is initialized',
          tags: ['Test'],
          description: 'Diagnostic endpoint (not for production use) confirming the server-side Firebase Admin module loaded without throwing; does not actually exercise any Firebase Admin call.',
          responses: {
            '200': {
              description: 'Initialization check result',
              content: {
                'application/json': {
                  examples: {
                    ok: { value: { success: true, message: 'Firebase Admin initialized successfully' } },
                    failed: { value: { success: false, error: 'Some error message' } },
                  },
                },
              },
            },
          },
        },
      },
      '/test/user': {
        get: {
          summary: 'Debug: resolve the current session user',
          tags: ['Test'],
          security: [{ bearerAuth: [] }],
          description: 'Diagnostic endpoint (not for production use) that echoes back the full Mongo user document resolved from the session cookie/JWT, for verifying auth is wired correctly.',
          responses: {
            '200': { description: 'Current user', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, user: { $ref: '#/components/schemas/User' } } } } } },
            '401': { description: 'Not authenticated', content: { 'application/json': { example: { success: false, message: 'Authentication required' } } } },
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
