'use client';
import React from 'react';
import { getCatLabel } from '@/lib/news-utils';

export default function LatestNews({ items, onArticleClick, dark, selectedLanguage, formatDate }) {
  return (
    <aside className="kn-latest" style={{ backgroundColor: dark ? '#161B27' : '#ffffff', border: `1px solid ${dark ? '#252E40' : '#E8EAED'}`, maxHeight: '1000px', overflowY: 'auto' }}>
      <div className="kn-latest-header">
        <div className="kn-latest-bar" />
        <h3 className="kn-latest-title" style={{ color: dark ? '#E8ECF0' : '#111827' }}>
          {selectedLanguage === 'hi' ? 'ताजा खबरें' : 'Latest News'}
        </h3>
      </div>

      {items.map(item => (
        <div
          key={item.id}
          className="kn-latest-item"
          style={{ borderBottomColor: dark ? '#252E40' : '#F0F2F5' }}
          onClick={() => onArticleClick(item)}
        >
          <div className="kn-latest-text">
            <span className="kn-latest-cat">{getCatLabel(item.category, selectedLanguage)}</span>
            <p className="kn-latest-item-title" style={{ color: dark ? '#d1d5db' : '#333' }}>{item.title}</p>
            <span className="kn-latest-date">{formatDate(item.publishedAt)}</span>
          </div>
          <div className="kn-latest-thumb">
            <img
              src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200'}
              alt={item.title}
            />
          </div>
        </div>
      ))}

      <button className="kn-latest-view-all">
        {selectedLanguage === 'hi' ? 'सभी खबरें देखें' : 'View All News'} &rsaquo;
      </button>
    </aside>
  );
}
