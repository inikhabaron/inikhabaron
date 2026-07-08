'use client';

import { Bookmark, CalendarDays, Newspaper } from 'lucide-react';
import styles from './BookmarkPageHeader.module.css';

export default function BookmarkPageHeader({
  total,
  lastSaved,
}) {
  return (
    <div
      className={styles.wrapper}
    >
      {/* Title */}

      <h1
        className={styles.title}
      >
        Saved Articles
      </h1>

      <p
        className={styles.subtitle}
      >
        Keep articles for later reading.
      </p>

      {/* Summary */}

      <div
        className={styles.summary}
      >
        <SummaryCard
          icon={<Bookmark size={22} />}
          title="Saved Articles"
          value={total}
        />

        <SummaryCard
          icon={<CalendarDays size={22} />}
          title="Last Saved"
          value={lastSaved || '—'}
        />

        {/* <SummaryCard
          icon={<Newspaper size={22} />}
          title="Categories"
          value="Coming Soon"
        /> */}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      className={styles.card}
    >
      <div
        className={styles.icon}
      >
        {icon}
      </div>

      <div
        className={styles.label}
      >
        {title}
      </div>

      <div
        className={styles.value}
      >
        {value}
      </div>
    </div>
  );
}