'use client';

import Link from 'next/link';
import { User } from 'lucide-react';

import { getArticleAuthors } from '@/lib/news/authors';
import styles from './ArticleAuthors.module.css';

// Renders an article's byline for any number of authors. One author or six,
// the markup is the same list — it wraps instead of switching layouts, so
// there is no per-count special case to keep in sync.
//
// Takes the raw `article` rather than a pre-built list so every caller goes
// through getArticleAuthors and legacy single-author articles render here
// without the caller knowing which shape it has.
// `fallbackName` covers articles with no byline at all — callers that would
// rather show a house name ("KhabarON") than nothing pass one; callers that
// want the byline to disappear entirely leave it unset.
//
// `authorId` links only the first author's name/photo to their /author/[id]
// page — co-authors in authors[] have no id (just name/image/bio), so they
// stay plain text. Same index===0 && authorId condition the crawler-only
// link in ArticleSeoContent.js already uses; this is the human-visible
// counterpart of that link, which previously didn't exist anywhere.
export default function ArticleAuthors({ article, label, textColor, mutedColor, accent, size = 'md', fallbackName, authorId }) {
  const resolved = getArticleAuthors(article);
  const authors = resolved.length
    ? resolved
    : (fallbackName ? [{ name: fallbackName, image: null }] : []);
  if (!authors.length) return null;

  return (
    <span className={`${styles.authors} ${size === 'sm' ? styles.sm : ''}`}>
      {label && (
        <span className={styles.label} style={{ color: mutedColor }}>
          {label}:
        </span>
      )}
      {authors.map((author, index) => {
        const content = (
          <>
            {author.image ? (
              <img src={author.image} alt="" className={styles.avatar} loading="lazy" />
            ) : (
              <span className={styles.avatarFallback} style={{ backgroundColor: accent }}>
                <User className={styles.avatarFallbackIcon} aria-hidden="true" />
              </span>
            )}
            <span className={styles.name} style={{ color: textColor }}>{author.name}</span>
          </>
        );
        // Names can repeat and there is no per-author id, so position is the
        // only stable key available.
        const key = `${author.name}-${index}`;
        return index === 0 && authorId ? (
          <Link key={key} href={`/author/${authorId}`} className={`${styles.author} ${styles.authorLink}`}>
            {content}
          </Link>
        ) : (
          <span key={key} className={styles.author}>{content}</span>
        );
      })}
    </span>
  );
}
