'use client';

import { Search, Download } from 'lucide-react';

import { DS } from '@/components/admin/design-system';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
];

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

export function NewsletterFilters({
  statusFilter = 'all',
  onStatusFilterChange,
  languageFilter = 'all',
  onLanguageFilterChange,
  searchQuery = '',
  onSearchChange,
  onExportCsv,
}) {
  return (
    <div
      style={{
        ...DS.card,
        marginBottom: 24,
        padding: 20,
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange?.(e.target.value)}
          style={DS.select}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          value={languageFilter}
          onChange={(e) => onLanguageFilterChange?.(e.target.value)}
          style={DS.select}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
          <Search
            size={18}
            color="#9CA3AF"
            style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)' }}
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search by email..."
            style={{ ...DS.input, padding: '10px 14px 10px 40px', borderRadius: 10 }}
          />
        </div>

        <button type="button" onClick={onExportCsv} style={DS.btn('outline')}>
          <Download size={16} />
          Export CSV
        </button>
      </div>
    </div>
  );
}
