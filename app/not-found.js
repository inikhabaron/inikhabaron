import { getCategories } from '@/lib/seo/data';
import { SITE } from '@/lib/seo/config';
import SeoPageShell from '@/components/seo/SeoPageShell';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

/**
 * Real 404 page: keeps the status code honest (Next sends 404) while giving
 * visitors and crawlers navigation and internal links instead of a dead end.
 */
export default async function NotFound() {
  const categories = await getCategories();
  return (
    <SeoPageShell categories={categories}>
      <h1 style={{ fontSize: '28px', margin: '24px 0 8px' }}>We couldn&apos;t find that page</h1>
      <p style={{ color: '#4B5563', maxWidth: 560 }}>
        The story may have moved or been removed. Try the latest headlines on the{' '}
        <a href="/" style={{ color: '#152a58', fontWeight: 600 }}>{SITE.name} homepage</a>
        {categories.length ? ' or browse a section:' : '.'}
      </p>
      {categories.length > 0 && (
        <ul style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: 0, listStyle: 'none' }}>
          {categories.slice(0, 12).map((c) => (
            <li key={c.slug}>
              <a href={`/category/${c.slug}`} style={{ color: '#152a58' }}>{c.name || c.slug}</a>
            </li>
          ))}
        </ul>
      )}
    </SeoPageShell>
  );
}
