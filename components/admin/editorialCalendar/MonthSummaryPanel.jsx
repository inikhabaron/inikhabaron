'use client';

import { format } from 'date-fns';
import { CalendarClock, TrendingUp } from 'lucide-react';
import { DS } from '@/components/admin/design-system';

const STAT_CONFIG = [
  { key: 'published', color: '#2563eb', bg: '#dbeafe', label: 'Published' },
  { key: 'scheduled', color: '#d97706', bg: '#fef3c7', label: 'Scheduled' },
  { key: 'updated', color: '#16a34a', bg: '#dcfce7', label: 'Updated' },
  { key: 'draft', color: '#6b7280', bg: '#f1f5f9', label: 'Drafts' },
  { key: 'breaking', color: '#dc2626', bg: '#fee2e2', label: 'Breaking News' },
  { key: 'tasks', color: '#9333ea', bg: '#f3e8ff', label: 'Tasks & Notifications' },
];

function monthTotals(counts) {
  const totals = { published: 0, scheduled: 0, updated: 0, breaking: 0, draft: 0, tasks: 0 };
  for (const day of Object.values(counts || {})) {
    for (const key of Object.keys(totals)) totals[key] += day[key] || 0;
  }
  return totals;
}

export function MonthSummaryPanel({ counts, monthCursor, onSelectDate }) {
  const totals = monthTotals(counts);
  const grandTotal = Object.values(totals).reduce((sum, n) => sum + n, 0);

  const today = format(new Date(), 'yyyy-MM-dd');
  const upcoming = Object.entries(counts || {})
    .filter(([date, c]) => date >= today && (c.scheduled || 0) > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...DS.card, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <TrendingUp size={16} color="#2563eb" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{format(monthCursor, 'MMMM')} at a Glance</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>{grandTotal}</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>total activities</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STAT_CONFIG.map((stat) => (
            <div key={stat.key} style={{ background: stat.bg, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{totals[stat.key]}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...DS.card, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <CalendarClock size={16} color="#d97706" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Upcoming Scheduled</span>
        </div>

        {upcoming.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 0' }}>Nothing scheduled for the rest of this month.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {upcoming.map(([date, c]) => (
              <button
                key={date}
                onClick={() => onSelectDate(date)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
                  padding: '8px 8px', textAlign: 'left', transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{format(new Date(date), 'EEE, MMM d')}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706', background: '#fef3c7', borderRadius: 999, padding: '2px 8px' }}>
                  {c.scheduled} scheduled
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
