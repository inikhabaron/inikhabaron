const nextConfig = {
  output: 'standalone',
  // Do not fail the production build on lint errors (keeps deploys unblocked;
  // lint is still run separately in CI/dev).
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Image optimization ON — serves modern AVIF/WebP, correct sizes and lazy
    // loading via next/image. remotePatterns intentionally allows any HTTPS host
    // because story images come from many CDNs (Cloudinary, Firebase, wire
    // services, etc.) — this preserves existing functionality while enabling
    // optimization. Plain <img> tags elsewhere are unaffected.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    minimumCacheTTL: 60,
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    // SEO-friendly security headers. Framing is left permissive (frame-ancestors *)
    // to preserve existing embed/ad behaviour, but we add the headers search
    // engines and browsers expect on a trustworthy site.
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
      // Keep the site embeddable (unchanged from previous behaviour).
      { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
    ];
    const corsHeaders = [
      { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGINS || '*' },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: '*' },
    ];
    return [
      { source: '/(.*)', headers: securityHeaders },
      // CORS only needs to apply to the API surface.
      { source: '/api/(.*)', headers: corsHeaders },
    ];
  },
};

module.exports = nextConfig;
