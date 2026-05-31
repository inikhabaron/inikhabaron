'use client';
import React from 'react';
import { getCatLabel } from '@/lib/news-utils';

const CATEGORY_IMAGES = {
  spirituality: '/Spirituality.jpg',
  sports: '/Sports.jpeg',
  entertainment: '/Entertainment.jpg',
  farmers: '/Farmers.jpg',
  science: '/Science.jpg',
};

const DESC = {
  hi: { entertainment: 'लेटेस्ट फिल्म और टीवी खबरें', technology: 'गैजेट्स, ऐप्स और टेक अपडेट', health: 'हेल्थ टिप्स और मेडिकल अपडेट', sports: 'खेल की सभी ताज़ा खबरें', business: 'बाजार और कारोबार अपडेट', politics: 'देश की राजनीतिक खबरें' },
  en: { entertainment: 'Latest films and TV news', technology: 'Gadgets, apps and tech', health: 'Health tips and medical updates', sports: 'Latest sports scores', business: 'Market and business updates', politics: 'Political news and analysis' },
};



export default function CategoryShowcase({ categories, onCategoryClick, dark, selectedLanguage }) {
  return (
    <section className="kn-showcase">
      <div className="kn-showcase-hdr">
        <div className="kn-section-bar" />
        <h2 className="kn-showcase-title" style={{ color: dark ? '#E8ECF0' : '#111827' }}>
          {selectedLanguage === 'hi' ? 'अन्य प्रमुख श्रेणियां' : 'Other Major Categories'}
        </h2>
      </div>

      <div className="kn-showcase-grid">
        {[
          { slug: 'spirituality' },
          { slug: 'sports' },
          { slug: 'entertainment' },
          { slug: 'farmers' },
          { slug: 'science' }
        ].map(cat => {
          const label = getCatLabel(cat.slug, selectedLanguage);
          const desc  = DESC[selectedLanguage]?.[cat.slug] || '';
          const bg = CATEGORY_IMAGES[cat.slug] || '/Spirituality.jpg';

          return (
            <div
              key={cat.slug}
              className="kn-cat-card"
              style={{ backgroundImage: `url(${bg})` }}
              onClick={() => onCategoryClick(cat.slug)}
            >
              <div className="kn-cat-overlay" />
              <div className="kn-cat-content">
                <h4 className="kn-cat-name">{label}</h4>
                {desc && <p className="kn-cat-desc">{desc}</p>}
                <span className="kn-cat-link">{selectedLanguage === 'hi' ? 'सभी देखें' : 'View All'} &rsaquo;</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
