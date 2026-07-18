'use client';

import { DS } from '../design-system';

const COLUMNS = ['Reporter', 'Role', 'Articles', 'Views', 'Shares', 'Comments', 'Bookmarks', 'Likes'];

function initials(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || '?';
}

function formatNumber(value) {
  return (value || 0).toLocaleString();
}

export function ReporterMetricsTable({ reporters = [], onSelectReporter }) {
  return (
    <div style={{ ...DS.card, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
            {COLUMNS.map((h) => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reporters.map((reporter) => (
            <tr
              key={reporter.id}
              style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}
              onClick={() => onSelectReporter?.(reporter.id)}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
            >
              <td style={{ padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#1d4ed8', flexShrink: 0 }}>
                    {initials(reporter.name)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: reporter.exists ? '#111827' : '#9ca3af' }}>
                    {reporter.exists ? reporter.name : 'Deleted user'}
                  </span>
                </div>
              </td>
              <td style={{ padding: '13px 16px' }}>
                {reporter.role && (
                  <span style={{ ...DS.tag, border: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{reporter.role}</span>
                )}
              </td>
              <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151' }}>{formatNumber(reporter.articlesPublished)}</td>
              <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{formatNumber(reporter.views)}</td>
              <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151' }}>{formatNumber(reporter.shares)}</td>
              <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151' }}>{formatNumber(reporter.comments)}</td>
              <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151' }}>{formatNumber(reporter.bookmarks)}</td>
              <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151' }}>{formatNumber(reporter.likes)}</td>
            </tr>
          ))}
          {reporters.length === 0 && (
            <tr><td colSpan={COLUMNS.length} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No reporter activity found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
