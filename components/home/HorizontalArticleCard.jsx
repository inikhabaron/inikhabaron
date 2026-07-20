'use client';
import React from 'react';
import Image from 'next/image';
import { getCatAccent, getCatLabel } from '@/lib/news-utils';

function HorizontalArticleCard({
  item, onClick, formatDate, selectedLanguage,
  dark, textScale, selectedFont, bdr, T1, T2, T3,
}) {
  const catColor = getCatAccent(item.category);
  const catLabel = getCatLabel(item.category, selectedLanguage);

  return (
    <div
      onClick={() => onClick(item)}
      className="kn-horiz-card"
      style={{ borderBottom: `1px solid ${bdr}` }}
    >
      <div className="kn-horiz-text">
        <span className="kn-horiz-cat" style={{ color: catColor, fontSize: `${10 * textScale}px` }}>
          {catLabel}
        </span>
        <h3 className="kn-horiz-title" style={{ color: T1, fontSize: `${15 * textScale}px`, fontFamily: selectedFont?.value }}>
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="kn-horiz-excerpt" style={{ color: T2, fontSize: `${13 * textScale}px`, fontFamily: selectedFont?.value }}>
            {item.excerpt}
          </p>
        )}
        <span style={{ color: T3, fontSize: `${11 * textScale}px` }}>{formatDate(item.publishedAt)}</span>
      </div>
      <div className="kn-horiz-thumb">
        <Image
          src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300'}
          alt={item.title}
          width={100}
          height={90}
          sizes="100px"
        />
      </div>
    </div>
  );
}

export default React.memo(HorizontalArticleCard);
