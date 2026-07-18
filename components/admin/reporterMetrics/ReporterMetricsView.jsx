'use client';

import { LoadingSpinner } from '../LoadingSpinner';
import { ReporterMetricsTable } from './ReporterMetricsTable';

export function ReporterMetricsView({ metrics = [], loading = false, onSelectReporter }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Reporter Metrics</h2>
        <p style={{ fontWeight: 300, marginTop: 6, color: '#6b7280', fontSize: 14 }}>
          Published articles, views, shares, comments, bookmarks and likes per author. Click a row for the full breakdown.
        </p>
      </div>
      <ReporterMetricsTable reporters={metrics} onSelectReporter={onSelectReporter} />
    </div>
  );
}
