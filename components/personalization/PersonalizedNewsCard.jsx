'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, } from 'lucide-react';

import styles from './PersonalizedNewsCard.module.css';

function getRecommendationReason(article) {
  if (
    article.recommendationReason?.message
  ) {
    return article.recommendationReason.message;
  }

  if (
    article.recommendationMatches?.length
  ) {
    const match =
      article.recommendationMatches[0];

    switch (match.type) {
      case 'interest':
        return `Because you frequently read ${match.value} news.`;

      case 'author':
        return 'Because you often read this author.';

      case 'city':
        return `Because you read news from ${match.value}.`;

      case 'language':
        return 'Because it matches your preferred language.';

      case 'tag':
        return `Because you're interested in ${match.value}.`;

      case 'trending':
        return 'Because this article is trending.';

      default:
        return 'Recommended for you.';
    }
  }

  return 'Recommended for you.';
}

export default function PersonalizedNewsCard({
  article,
}) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className={styles.card}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={article.featuredImage}
          alt={article.title}
          fill
          className={styles.image}
        />

        <div className={styles.badge}>
          <Sparkles size={14} />

          <span>For You</span>
        </div>
      </div>

      <div className={styles.content}>
        <span className={styles.category}>
          {article.category}
        </span>

        <h3>
          {article.title}
        </h3>

        <p className={styles.excerpt}>
          {article.excerpt}
        </p>

        <div className={styles.reason}>
          <Sparkles size={15} />

          <span>
            {getRecommendationReason(article)}
          </span>
        </div>

        {/* <div className={styles.footer}>
          <span>
            Recommendation Score{' '}
            {article.recommendationScore}
          </span>

          <ArrowRight size={18} />
        </div> */}
      </div>
    </Link>
  );
}