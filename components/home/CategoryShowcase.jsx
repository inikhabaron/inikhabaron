'use client';
import React from 'react';
import { getCatLabel } from '@/lib/news-utils';
import { useRouter } from 'next/navigation';

const CATEGORY_IMAGES = {
  economy: '/Economy.jpg',
  sports: '/Sports.jpeg',
  entertainment: '/Entertainment.jpg',
  farmers: '/Farmers.jpg',
  science: '/Science.jpg',
};

const DESC = {
  hi: { entertainment: 'लेटेस्ट फिल्म और टीवी खबरें', science: 'गैजेट्स, ऐप्स और टेक अपडेट', farmers: 'किसानों की सभी ताज़ा खबरें', sports: 'खेल की सभी ताज़ा खबरें', economy: 'देश की अर्थव्यवस्था की खबरें', politics: 'देश की राजनीतिक खबरें' },
  en: { entertainment: 'Latest films and TV news', science: 'Gadgets, apps and tech', farmers: 'All the latest news for farmers', sports: 'Latest sports scores', economy: 'Economic news and analysis', politics: 'Political news and analysis' },
};



export default function CategoryShowcase({ categories, onCategoryClick, dark, selectedLanguage }) {
  const router = useRouter();
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
          { slug: 'economy' },
          { slug: 'sports' },
          { slug: 'entertainment' },
          { slug: 'farmers' },
          { slug: 'science' }
        ].map(cat => {
          const label = getCatLabel(cat.slug, selectedLanguage);
          const desc  = DESC[selectedLanguage]?.[cat.slug] || '';
          const bg = CATEGORY_IMAGES[cat.slug] || '/Economy.jpg';

          return (
            <div
              key={cat.slug}
              className="kn-cat-card"
              style={{ backgroundImage: `url(${bg})` }}
              onClick={() => { onCategoryClick?.(cat.slug); router.push(`/?category=${cat.slug}`); }}
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
