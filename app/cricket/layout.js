import { SITE } from '@/lib/seo/config';

// The page is a client component and cannot export metadata, so this layout
// gives it its own title and canonical (otherwise it would inherit the
// homepage's).
export const metadata = {
  title: 'Live Cricket Scores',
  description: `Live cricket scores, match updates and results from ${SITE.name}.`,
  // No canonical here: this layout also wraps /cricket/[id], which sets its own.
};

export default function Layout({ children }) {
  return children;
}
