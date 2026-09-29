import JsonLd from '@/components/seo/JsonLd';
import { getPublicLiveBlogBySlug } from '@/lib/services/liveBlogs/liveBlogService';
import { getPublicLiveBlogUpdates } from '@/lib/services/liveBlogs/liveBlogUpdateService';
import { SITE, SITE_URL } from '@/lib/seo/config';
import { liveBlogSchema, breadcrumbSchema } from '@/lib/seo/jsonld';
import { stripHtml, truncate } from '@/lib/seo/utils';

// The page itself is a client component (it polls for updates), so it cannot
// export metadata or emit structured data. This server layout does both for it.
export const revalidate = 60;

const liveBlogUrl = (slug) => `${SITE_URL}/live-blogs/${slug}`;

async function loadBlog(slug) {
  try {
    return await getPublicLiveBlogBySlug(slug);
  } catch (err) {
    console.error('[live-blogs] load failed:', err.message);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await loadBlog(slug);
  if (!blog) {
    return { title: 'Live Blog', robots: { index: false, follow: true } };
  }
  const description = truncate(stripHtml(blog.summary || ''), 160)
    || `Live updates: ${blog.title} — follow the latest as it happens on ${SITE.name}.`;
  const image = blog.featuredImage || SITE.defaultImage;
  return {
    title: blog.status === 'live' ? `LIVE: ${blog.title}` : blog.title,
    description,
    alternates: { canonical: liveBlogUrl(slug) },
    openGraph: {
      type: 'article',
      title: blog.title,
      description,
      url: liveBlogUrl(slug),
      siteName: SITE.name,
      publishedTime: blog.createdAt ? new Date(blog.createdAt).toISOString() : undefined,
      modifiedTime: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : undefined,
      images: [{ url: image, alt: blog.title }],
    },
    twitter: { card: 'summary_large_image', title: blog.title, description, images: [image] },
  };
}

export default async function LiveBlogLayout({ children, params }) {
  const { slug } = await params;
  const blog = await loadBlog(slug);
  let jsonLd = null;

  if (blog) {
    let updates = [];
    try {
      const data = await getPublicLiveBlogUpdates(blog.id, { page: 1, limit: 20 });
      updates = data.updates.map((u) => ({
        title: stripHtml(u.content || '').slice(0, 110),
        time: u.publishedAt || u.createdAt,
        body: u.content,
      }));
    } catch (err) {
      console.error('[live-blogs] updates failed:', err.message);
    }
    jsonLd = [
      liveBlogSchema({
        title: blog.title,
        description: truncate(stripHtml(blog.summary || ''), 250) || blog.title,
        url: liveBlogUrl(slug),
        image: blog.featuredImage || undefined,
        startedAt: blog.createdAt,
        endedAt: blog.status === 'completed' ? blog.endedAt : undefined,
        updatedAt: blog.updatedAt,
        updates,
      }),
      breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Live', url: `${SITE_URL}/live` },
        { name: blog.title, url: liveBlogUrl(slug) },
      ]),
    ];
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}
