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
    //
    // Deliberately NOT setting a global `loader`/`loaderFile` here: doing so
    // disables Next's own /_next/image route for every image in the app
    // (confirmed locally — it 404s), which would break the static logo
    // images that have no reason to change. Instead, article-image
    // components pass `loader={cloudinaryLoader}` (lib/media/cloudinaryLoader.js)
    // per-<Image> so only Cloudinary-hosted sources bypass Vercel's
    // optimizer; logo/static images keep using the default Vercel pipeline.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    minimumCacheTTL: 60,
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    // 432 added to tightly match the 3-column desktop article grid
    // (kn-card-img renders at ~33vw ≈ 420-450px there) — without it, the
    // nearest bucket was 384 below and the next deviceSize (640) above, so
    // grid thumbnails were served ~50% larger than their display size.
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 432],
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
    //
    // CORS is deliberately NOT set here. next.config.js headers() are static
    // (config-time), so they can't inspect the request's Origin and reflect
    // only allowlisted ones back — they can only ever emit one fixed value for
    // every caller. lib/api/cors.js does that check per-request instead
    // (see corsHeadersFor); adding a second, blanket CORS header here
    // previously both duplicated it (spec-invalid — browsers reject a
    // response with two Access-Control-Allow-Origin values) and defeated it
    // (disallowed origins still got the config-level wildcard). CORS for the
    // API surface is owned exclusively by lib/api/cors.js — do not reintroduce
    // it here.
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
      // Keep the site embeddable (unchanged from previous behaviour).
      { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
    ];
    return [
      { source: '/(.*)', headers: securityHeaders },
    ];
  },
};

module.exports = nextConfig;
