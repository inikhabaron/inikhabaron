import { SITE, absoluteUrl } from '@/lib/seo/config';

// The page is a client component and cannot export metadata, so this layout
// gives it its own title and canonical (otherwise it would inherit the
// homepage's).
export const metadata = {
  title: 'My City News',
  description: `Local news for your city from ${SITE.name}.`,
  alternates: { canonical: absoluteUrl('/my-city') },
  // Personalised by the reader's location; not a useful standalone search result.
  robots: { index: false, follow: true },
};

export default function Layout({ children }) {
  return children;
}
