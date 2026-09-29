import { SITE, absoluteUrl } from '@/lib/seo/config';

// The page is a client component and cannot export metadata, so this layout
// gives it its own title and canonical (otherwise it would inherit the
// homepage's).
export const metadata = {
  title: 'Stock Market Live',
  description: `Live market quotes and business updates from ${SITE.name}.`,
  alternates: { canonical: absoluteUrl('/market') },
};

export default function Layout({ children }) {
  return children;
}
