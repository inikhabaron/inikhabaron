/**
 * Visible, accessible breadcrumb navigation (server component).
 * Pairs with the BreadcrumbList JSON-LD emitted on the same page.
 */
export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" style={{ fontSize: '13px', margin: '12px 0', color: '#4B5563' }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {last ? (
                <span aria-current="page" style={{ color: '#111827', fontWeight: 600 }}>{item.name}</span>
              ) : (
                <a href={item.url} style={{ color: '#152a58' }}>{item.name}</a>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
