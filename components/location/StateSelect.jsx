'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StateSelect({ value, onChange, className = '' }) {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStates() {
      try {
        setLoading(true);
        const response = await fetch('/api/locations/states');
        const json = await response.json();

        if (!isMounted) return;

        if (json?.success) {
          setStates(json.data || []);
        }
      } catch (error) {
        console.error('Failed to load states', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStates();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">State</label>
      <Select value={value?.id || ''} onValueChange={(selectedId) => {
        const selectedState = states.find((state) => state.id === selectedId);
        onChange(selectedState || null);
      }}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading states...' : 'Select state'} />
        </SelectTrigger>
        <SelectContent>
          {states.map((state) => (
            <SelectItem key={state.id} value={state.id}>
              {state.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
