'use client';

import { Bookmark, CalendarDays, Newspaper } from 'lucide-react';
import styles from './BookmarkPageHeader.module.css';

export default function BookmarkPageHeader({
  total,
  lastSaved,
  title = 'Saved Articles',
  subtitle = 'Keep articles for later reading.',
  icon = <Bookmark size={22} />,
  countLabel = 'Saved Articles',
  lastLabel = 'Last Saved',
}) {
  return (
    <div
      className={styles.wrapper}
    >
      {/* Title */}

      <h1
        className={styles.title}
      >
        {title}
      </h1>

      <p
        className={styles.subtitle}
      >
        {subtitle}
      </p>

      {/* Summary */}

      <div
        className={styles.summary}
      >
        <SummaryCard
          icon={icon}
          title={countLabel}
          value={total}
        />

        <SummaryCard
          icon={<CalendarDays size={22} />}
          title={lastLabel}
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