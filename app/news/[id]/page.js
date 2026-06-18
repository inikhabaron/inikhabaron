import NewsClient from './NewsClient';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000';

async function getArticle(id) {
  try {
    const res = await fetch(
      `${SITE_URL}/api/news/${id}`,
      {
        cache: 'no-store',
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    return data.news || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const article = await getArticle(params.id);

  if (!article) {
    return {
      title: 'KhabarON - Your Daily News Source',
      description:
        'Stay informed with the latest news across politics, sports, business, entertainment, and technology.',
    };
  }

  const title =
    article.seoTitle ||
    article.title;

  const description =
    article.seoDescription ||
    article.excerpt ||
    '';

  const image =
    article.featuredImage ||
    `${SITE_URL}/LOGO1.jpeg`;

  return {
    title,
    description,

    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE_URL}/news/${article.id}`,

      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function Page() {
  return <NewsClient />;
}