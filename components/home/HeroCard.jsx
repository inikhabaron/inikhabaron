'use client';
import React from 'react';
import { getCatAccent, getCatLabel, EDITORIAL_RED } from '@/lib/news-utils';

export default function HeroCard({ item, onClick, formatDate, selectedLanguage, textScale, selectedFont }) {
  const catColor = getCatAccent(item.category);
  const catLabel = getCatLabel(item.category, selectedLanguage);

  return (
    <div onClick={() => onClick(item)} className="kn-hero">
      <img
        src={item.featuredImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900'}
        alt={item.title}
      />
      <div className="kn-hero-grad" />
      <div className="kn-hero-content">
        <div className="kn-hero-badges">
          {item.isBreaking && <span className="kn-breaking-badge">BREAKING</span>}
          <span className="kn-cat-badge" style={{ backgroundColor: catColor }}>{catLabel}</span>
        </div>
        <h2 className="kn-hero-title" style={{ fontSize: `${22 * textScale}px`, fontFamily: selectedFont?.value }}>
          {item.title}
        </h2>
        {item.excerpt && (
          <p className="kn-hero-excerpt" style={{ fontSize: `${13 * textScale}px`, fontFamily: selectedFont?.value }}>
            {item.excerpt}
          </p>
        )}
        <span className="kn-hero-date">{formatDate(item.publishedAt)}</span>
      </div>
    </div>
  );
}
