import { articlePath } from '@/lib/seo/slug';

/**
 * Real <a href> around a card headline. The cards navigate with a click handler
 * on the card itself (router.push), which crawlers don't follow — this gives
 * them a genuine link to the article. preventDefault stops the browser's own
 * navigation; the click still bubbles to the card, whose handler does the
 * client-side transition exactly as before.
 */
export default function ArticleLink({ item, children }) {
  return (
    <a
      href={articlePath(item)}
      onClick={(e) => e.preventDefault()}
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      {children}
    </a>
  );
}
