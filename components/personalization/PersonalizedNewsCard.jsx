'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useContext } from 'react';
import { DarkCtx, FontCtx } from '@/lib/news-contexts';
import { getCatAccent, getCatLabel } from '@/lib/news-utils';
import { ArrowRight, Sparkles, } from 'lucide-react';

import styles from './PersonalizedNewsCard.module.css';

function getRecommendationReason(article, selectedLanguage) {
  const hi = selectedLanguage === 'hi';
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
          return hi
            ? `क्योंकि आप अक्सर ${getCatLabel(match.value, 'hi')} समाचार पढ़ते हैं।`
            : `Because you frequently read ${match.value} news.`;

        case 'author':
          return hi
            ? 'क्योंकि आप इस लेखक के लेख अक्सर पढ़ते हैं।'
            : 'Because you often read this author.';

        case 'city':
          return hi
            ? `क्योंकि आप अक्सर ${match.value} की खबरें पढ़ते हैं।`
            : `Because you read news from ${match.value}.`;

        case 'language':
          return hi
            ? 'क्योंकि यह आपकी पसंदीदा भाषा से मेल खाती है।'
            : 'Because it matches your preferred language.';

        case 'tag':
          return hi
            ? `क्योंकि आपने ${match.value} में रुचि दिखाई है।`
            : `Because you're interested in ${match.value}.`;

        case 'trending':
          return hi
            ? 'क्योंकि यह खबर ट्रेंड कर रही है।'
            : 'Because this article is trending.';

        default:
          return hi
            ? 'आपके लिए अनुशंसित।'
            : 'Recommended for you.';
      }
    }

  return hi
    ? 'आपके लिए अनुशंसित।'
    : 'Recommended for you.';
}

export default function PersonalizedNewsCard({
  article, selectedLanguage,
}) {
  const dark = useContext(DarkCtx);
  const { scale } = useContext(FontCtx);
  const catColor = getCatAccent(article.category);
  const catLabel = getCatLabel(article.category, selectedLanguage);
  return (
    <Link
      href={`/news/${article.id}`}
      className="kn-card"
      style={{ backgroundColor: dark ? '#161B27' : '#FFFFFF', border: dark ? '1px solid #252E40' : 'none' }}
    >
      <div className="kn-card-img-wrap" style={{ backgroundColor: dark ? '#252E40' : '#F0F2F6' }}>
        <Image
          src={article.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600'}
          alt={article.title}
          fill
          className="kn-card-img"
        />

        <div className={styles.badge}>
          <Sparkles size={14} />

          <span> {selectedLanguage === 'hi' ? 'आपके लिए' : 'For You'}</span>
        </div>
        <div className="kn-card-bar" style={{ backgroundColor: catColor }} />
      </div>

      <div className="kn-card-body">
        <div className="kn-card-cat-row">
          <span className="kn-card-cat-dot" style={{ backgroundColor: catColor }} />
          <span className="kn-card-cat-label" style={{ color: catColor, fontSize: `${10 * scale}px` }}>{catLabel}</span>
        </div>

        <h3 className="kn-card-title" style={{ minHeight: "42px", fontSize: `${15 * scale}px`, color: dark ? '#E8ECF0' : '#111827' }}>
          {article.title}
        </h3>

        <div className={styles.reason}>
          <Sparkles size={15}/>

          <span>
            {getRecommendationReason(article, selectedLanguage)}
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