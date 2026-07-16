/**
 * Lightweight, fully server-rendered page shell for SEO landing pages
 * (category, author, policy pages). Provides a crawlable header with category
 * navigation and an E-E-A-T footer linking to publisher/about/policy pages.
 *
 * Kept intentionally independent of the interactive client Header/Footer so
 * these pages render entirely on the server with zero client JS required.
 */
import { SITE } from '@/lib/seo/config';
import { getCatLabel } from '@/lib/news-utils';

export default function SeoPageShell({ categories = [], activeSlug, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F6F7F9', color: '#111827' }}>
      <header style={{ background: '#152a58', color: '#fff' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="/" style={{ color: '#fff', fontWeight: 800, fontSize: '20px', textDecoration: 'none' }}>
            {SITE.name}
          </a>
          <nav aria-label="Categories" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '14px' }}>
            {categories.slice(0, 10).map((c) => (
              <a
                key={c.slug}
                href={`/category/${c.slug}`}
                style={{ color: c.slug === activeSlug ? '#fff' : '#c7d0e6', textDecoration: 'none', fontWeight: c.slug === activeSlug ? 700 : 400 }}
              >
                {c.name || getCatLabel(c.slug, 'en') || c.slug}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px' }}>
        {children}
      </main>

      <footer style={{ background: '#0D1117', color: '#c7d0e6', marginTop: '40px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '28px 16px', display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div>
            <strong style={{ color: '#fff' }}>{SITE.name}</strong>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>{SITE.description}</p>
          </div>
          <nav aria-label="Company">
            <strong style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>Company</strong>
            <a href="/about" style={footLink}>About Us</a>
            <a href="/contact" style={footLink}>Contact</a>
          </nav>
          <nav aria-label="Policies">
            <strong style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>Editorial</strong>
            <a href="/editorial-policy" style={footLink}>Editorial Policy</a>
            <a href="/corrections-policy" style={footLink}>Corrections Policy</a>
            <a href="/privacy-policy" style={footLink}>Privacy Policy</a>
          </nav>
          <nav aria-label="Feeds">
            <strong style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>Follow</strong>
            <a href="/rss.xml" style={footLink}>RSS Feed</a>
            <a href={SITE.social.twitter} style={footLink} rel="noopener">Twitter / X</a>
            <a href={SITE.social.facebook} style={footLink} rel="noopener">Facebook</a>
          </nav>
        </div>
        <div style={{ borderTop: '1px solid #252E40', padding: '14px 16px', fontSize: '12px', textAlign: 'center' }}>
          © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

const footLink = { display: 'block', color: '#c7d0e6', textDecoration: 'none', fontSize: '13px', marginBottom: '6px' };
