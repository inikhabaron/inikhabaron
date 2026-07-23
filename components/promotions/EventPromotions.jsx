'use client';

import { useEffect, useState } from 'react';
import EventCard from './EventCard';

// Self-fetching homepage section — like CategoryShowcase, it only needs
// dark/selectedLanguage from the parent and owns its own data fetch, since
// no sibling component needs the promotions list. Renders nothing while
// loading and nothing at all once loaded if there are no active
// promotions, so it never leaves an empty section on the page.
export default function EventPromotions({ dark, selectedLanguage }) {
  const [promotions, setPromotions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/promotions', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => { if (active) setPromotions(data.promotions || []); })
      .catch((err) => console.error(err))
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  if (!loaded || promotions.length === 0) return null;

  const isHindi = selectedLanguage === 'hi';

  return (
    <section className="kn-events-section">
      <div className="kn-events-hdr">
        <div className="kn-section-bar" />
        <h2 className="kn-events-title" style={{ color: dark ? '#E8ECF0' : '#111827' }}>
          {isHindi ? 'आगामी कार्यक्रम व विशेष कवरेज' : 'Upcoming Events & Special Coverage'}
        </h2>
      </div>
      <div className="kn-events-grid">
        {promotions.map((promo) => (
          <EventCard key={promo.id} promotion={promo} dark={dark} selectedLanguage={selectedLanguage} />
        ))}
      </div>
    </section>
  );
}
