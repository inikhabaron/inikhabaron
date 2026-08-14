'use client';

import Image from 'next/image';
import { cloudinaryLoader } from '@/lib/media/cloudinaryLoader';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import useCountdown from '@/hooks/useCountdown';
import { ACCENT } from '@/lib/news-utils';

// Pinned to IST rather than the visitor's own browser timezone — an event
// happening in India at a specific time should read the same date to every
// visitor, not shift for someone browsing from outside India.
function formatEventDate(date, isHindi) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function EventCard({ promotion, dark, selectedLanguage }) {
  const isHindi = selectedLanguage === 'hi';
  const isExternal = promotion.linkType === 'external';

  // Cards showing the numeric countdown tick every second; the rest only
  // need enough resolution to catch the Upcoming → Live Now → Ended phase
  // change, so they tick far less often.
  const countdown = useCountdown(promotion.eventDate, promotion.showCountdown ? 1000 : 30000);

  const eventTime = promotion.eventDate ? new Date(promotion.eventDate).getTime() : null;
  // No endDate means no explicit "coverage window" was scheduled, so the
  // live phase collapses to the instant of the event itself rather than
  // running indefinitely.
  const endTime = promotion.endDate ? new Date(promotion.endDate).getTime() : eventTime;
  const now = Date.now();
  const phase = !eventTime ? null : now < eventTime ? 'upcoming' : (endTime && now <= endTime) ? 'live' : 'ended';

  const ctaLabel = promotion.buttonText || (isHindi ? 'और पढ़ें' : 'Read More');
  const cta = (
    <span className="kn-event-cta" style={{ background: ACCENT }}>
      {ctaLabel}
      <ArrowRight size={14} aria-hidden="true" />
    </span>
  );

  return (
    <div className="kn-event-card" style={{ background: dark ? '#161B27' : '#fff', border: `1px solid ${dark ? '#252E40' : '#E8EAED'}` }}>
      <div className="kn-event-banner">
        {promotion.bannerImage ? (
          <Image
            src={promotion.bannerImage}
            alt={promotion.title}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            loader={cloudinaryLoader}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="kn-event-banner-fallback" />
        )}
        {promotion.category && <span className="kn-event-badge">{promotion.category}</span>}
      </div>

      <div className="kn-event-body">
        <h3 className="kn-event-title" style={{ color: dark ? '#E8ECF0' : '#111827' }}>{promotion.title}</h3>

        {promotion.description && (
          <p className="kn-event-desc" style={{ color: dark ? '#9BA5B4' : '#6B7280' }}>{promotion.description}</p>
        )}

        {promotion.eventDate && (
          <div className="kn-event-date-row">
            <div className="kn-event-date" style={{ color: dark ? '#9BA5B4' : '#6B7280' }}>
              <Calendar size={13} aria-hidden="true" />
              {formatEventDate(promotion.eventDate, isHindi)}
            </div>
            {phase === 'live' && (
              <span className="kn-event-phase kn-event-phase-live">{isHindi ? 'लाइव' : 'LIVE NOW'}</span>
            )}
            {phase === 'ended' && (
              <span className="kn-event-phase kn-event-phase-ended">{isHindi ? 'समाप्त' : 'ENDED'}</span>
            )}
          </div>
        )}

        {promotion.showCountdown && phase === 'upcoming' && countdown && !countdown.expired && (
          <div className="kn-event-countdown" style={{ color: ACCENT }}>
            {countdown.days > 0 && `${countdown.days}${isHindi ? 'दि' : 'd'} `}
            {countdown.hours}{isHindi ? 'घं' : 'h'} {countdown.minutes}{isHindi ? 'मि' : 'm'} {isHindi ? 'शेष' : 'left'}
          </div>
        )}

        {promotion.buttonLink && (
          isExternal ? (
            <a href={promotion.buttonLink} target="_blank" rel="noreferrer" className="kn-event-cta-link" aria-label={`${ctaLabel}: ${promotion.title}`}>{cta}</a>
          ) : (
            <Link href={promotion.buttonLink} className="kn-event-cta-link" aria-label={`${ctaLabel}: ${promotion.title}`}>{cta}</Link>
          )
        )}
      </div>
    </div>
  );
}
