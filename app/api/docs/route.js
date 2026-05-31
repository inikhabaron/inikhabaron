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
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
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
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export async function GET(request) {
  return NextResponse.json(swaggerSpec);
}
