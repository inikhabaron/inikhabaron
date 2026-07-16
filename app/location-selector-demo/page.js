'use client';

import { useState } from 'react';
import LocationSelector from '@/components/location/LocationSelector';

export default function LocationSelectorDemoPage() {
  const [value, setValue] = useState({
    enabled: false,
    scope: 'national',
    country: 'India',
  });

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Location Selector Demo</h1>
        <p className="mb-6 text-sm text-slate-600">
          This page is only for validating the reusable selector behavior before integrating it elsewhere.
        </p>

        <LocationSelector value={value} onChange={setValue} />

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Emitted value</h2>
          <pre className="overflow-x-auto text-sm text-slate-700">{JSON.stringify(value, null, 2)}</pre>
        </div>
      </div>
    </main>
  );
}
