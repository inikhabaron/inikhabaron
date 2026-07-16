'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const scopeOptions = [
  { value: 'national', label: 'National' },
  { value: 'state', label: 'State' },
  { value: 'district', label: 'District' },
];

export default function CoverageScopeSelect({ value, onChange, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">Coverage Area</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select coverage area" />
        </SelectTrigger>
        <SelectContent>
          {scopeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
