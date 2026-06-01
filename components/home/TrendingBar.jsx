'use client';
import React from 'react';

export default function TrendingBar({ tags, selectedLanguage, onTagClick, dark }) {
  const fallback = selectedLanguage === 'hi'
    ? ['लोकसभा चुनाव', 'महंगाई', 'शेयर बाजार', 'मौसम अपडेट', 'पेट्रोल डीजल दाम']
    : ['Elections', 'Inflation', 'Stock Market', 'Weather', 'Fuel Prices'];

  const displayTags = tags.length > 0 ? tags.slice(0, 5) : fallback;

  return (
    <div className="kn-trending" style={{ backgroundColor: dark ? '#161B27' : '#ffffff', borderBottomColor: dark ? '#252E40' : '#E8EAED' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="kn-trending-badge">
          {selectedLanguage === 'hi' ? 'ट्रेंडिंग' : 'Trending'}
        </span>
        <div className="kn-trending-tags">
          {displayTags.map((tag, i) => {
            const name = typeof tag === 'string' ? tag : tag.name;
            return (
              <button
                key={i}
                className="kn-trending-tag"
                style={{ borderColor: dark ? '#252E40' : '#E8EAED', color: dark ? '#9BA5B4' : '#4B5563' }}
                onClick={() => onTagClick(name)}
              >
                # {name}
              </button>
            );
          })}
        </div>
        {/* <button className="kn-trending-all">
          {selectedLanguage === 'hi' ? 'सभी देखें' : 'View All'} &rsaquo;
        </button> */}
      </div>
    </div>
  );
}
