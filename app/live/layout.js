import { SITE, absoluteUrl } from '@/lib/seo/config';

// The page is a client component and cannot export metadata, so this layout
// gives it its own title and canonical (otherwise it would inherit the
// homepage's).
export const metadata = {
  title: 'Live News Updates',
  description: `Live news updates and breaking developments as they happen, from ${SITE.name}.`,
  alternates: { canonical: absoluteUrl('/live') },
};

export default function Layout({ children }) {
  return children;
}
