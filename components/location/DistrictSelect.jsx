'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DistrictSelect({ state, value, onChange, className = '' }) {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state?.id) {
      setDistricts([]);
      return;
    }

    let isMounted = true;

    async function loadDistricts() {
      try {
        setLoading(true);
        const response = await fetch(`/api/locations/districts?stateId=${encodeURIComponent(state.id)}`);
        const json = await response.json();

        if (!isMounted) return;

        if (json?.success) {
          setDistricts(json.data || []);
        }
      } catch (error) {
        console.error('Failed to load districts', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDistricts();

    return () => {
      isMounted = false;
    };
  }, [state?.id]);

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">District</label>
      <Select
        value={value?.id || ''}
        onValueChange={(selectedId) => {
          const selectedDistrict = districts.find((district) => district.id === selectedId);
          onChange(selectedDistrict || null);
        }}
        disabled={!state?.id || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading districts...' : 'Select district'} />
        </SelectTrigger>
        <SelectContent>
          {districts.map((district) => (
            <SelectItem key={district.id} value={district.id}>
              {district.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
