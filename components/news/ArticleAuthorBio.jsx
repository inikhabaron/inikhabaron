'use client';

import { User } from 'lucide-react';

import { getArticleAuthors } from '@/lib/news/authors';
import styles from './ArticleAuthorBio.module.css';

/**
 * The "About the Author" block at the end of an article — distinct from
 * `ArticleAuthors` (the compact byline near the headline). Takes the raw
 * `article` rather than a pre-built list for the same reason `ArticleAuthors`
 * does: every caller goes through `getArticleAuthors()` so legacy
 * single-author articles (and articles saved before "About Author" existed,
 * which simply have no `bio`) render here without the caller special-casing
 * either shape.
 *
 * Renders nothing when the article has no byline at all — there is nothing
 * true to say about an anonymous story. Renders normally, minus the bio
 * paragraph, when an author has no `bio` — a missing photo or missing bio
 * must never hide the name.
 */
export default function ArticleAuthorBio({ article, surface, bdr, T1, T2, T3, accent }) {
  const authors = getArticleAuthors(article);
  if (!authors.length) return null;

  return (
    <section
      className={styles.wrap}
      style={{ backgroundColor: surface, borderColor: bdr }}
      aria-label={authors.length > 1 ? 'About the authors' : 'About the author'}
    >
      <span className={styles.heading} style={{ color: T3 }}>
        {authors.length > 1 ? 'ABOUT THE AUTHORS' : 'ABOUT THE AUTHOR'}
      </span>

      {authors.map((author, index) => (
        <div
          key={`${author.name}-${index}`}
          className={styles.row}
          style={index > 0 ? { borderTopColor: bdr } : undefined}
        >
          {author.image ? (
            <img src={author.image} alt="" className={styles.avatar} loading="lazy" />
          ) : (
            <span className={styles.avatarFallback} style={{ backgroundColor: accent }}>
              <User className={styles.avatarFallbackIcon} aria-hidden="true" />
            </span>
          )}
          <div className={styles.textCol}>
            <span className={styles.name} style={{ color: T1 }}>{author.name}</span>
            {author.bio ? <p className={styles.bio} style={{ color: T2 }}>{author.bio}</p> : null}
          </div>
        </div>
      ))}
    </section>
  );
}
