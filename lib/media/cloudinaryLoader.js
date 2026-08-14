// next/image `loader` prop for components rendering article images.
//
// Vercel's built-in Image Optimization (the default /_next/image proxy)
// bills per unique image variant, and article images (many distinct
// Cloudinary sources, each resized to several widths/formats) exhausted the
// account's monthly quota — Vercel then returned 402 on every optimized
// image request and the live site rendered with no images at all.
//
// Cloudinary already resizes/transcodes on its own CDN via URL parameters,
// so for Cloudinary-hosted sources this builds that URL directly and skips
// Vercel's pipeline entirely (free, no quota). Anything else (the unsplash
// placeholder fallback, other CDNs) is routed through Vercel's own
// /_next/image proxy, replicating next/image's default loader — this is
// NOT configured globally via images.loaderFile because that disables
// /_next/image for every image in the app, including the static logo
// images that don't need to change (confirmed locally: it 404s).
const CLOUDINARY_HOST = 'res.cloudinary.com';

export function cloudinaryLoader({ src, width, quality }) {
  let hostname = null;
  try {
    hostname = new URL(src, 'https://khabaron.invalid').hostname;
  } catch {
    hostname = null;
  }

  if (hostname === CLOUDINARY_HOST && src.includes('/upload/')) {
    const q = quality ? `q_${quality}` : 'q_auto';
    const transform = `f_auto,${q},c_limit,w_${width}`;
    return src.replace('/upload/', `/upload/${transform}/`);
  }

  const params = new URLSearchParams({ url: src, w: String(width), q: String(quality || 75) });
  return `/_next/image?${params.toString()}`;
}
