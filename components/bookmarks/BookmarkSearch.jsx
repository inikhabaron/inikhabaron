'use client';

import { Search, X } from 'lucide-react';
import styles from './BookmarkSearch.module.css';

export default function BookmarkSearch({
  value,
  onChange,
}) {
  return (
    <div
      className={styles.wrapper}
    >
      <Search
        className={styles.searchIcon}
        size={18}
      />

      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search saved articles..."
        onBlur={(e) => {
          e.target.style.borderColor = '#E5E7EB';
          e.target.style.boxShadow = 'none';
        }}
      />

      {value && (
        <button
          className={styles.clear}
          onClick={() => onChange('')}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}