/**
 * Renders one or more JSON-LD structured-data objects as
 * <script type="application/ld+json"> tags.
 *
 * This is a server component (no "use client"), so the structured data is part
 * of the initial HTML — visible to Googlebot, Google News, Bingbot and every
 * AI crawler without needing JavaScript execution.
 *
 * Usage:
 *   <JsonLd data={newsArticleSchema(article)} />
 *   <JsonLd data={[websiteSchema(), organizationGraph()]} />
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  const items = Array.isArray(data) ? data.filter(Boolean) : [data];
  if (!items.length) return null;

  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify output is safe here; escape "<" to prevent any
          // accidental </script> breakout from user-supplied text.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
