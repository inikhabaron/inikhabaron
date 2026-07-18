'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DS } from '@/components/admin/design-system';

const TYPE_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'updated', label: 'Updated' },
  { value: 'draft', label: 'Drafts' },
  { value: 'breaking', label: 'Breaking News' },
  { value: 'tasks', label: 'Tasks / Notifications' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'reporter', label: 'Reporter' },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...DS.tag, cursor: 'pointer', border: '1px solid transparent',
        background: active ? '#2563eb' : '#f3f4f6',
        color: active ? '#fff' : '#4b5563',
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}

export function CalendarFilters({ filters, onChange, categories }) {
  const [authorInput, setAuthorInput] = useState(filters.authorName || '');

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authorInput !== (filters.authorName || '')) onChange({ ...filters, authorName: authorInput || null });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorInput]);

  const toggleType = (value) => {
    const has = filters.types.includes(value);
    const types = has ? filters.types.filter((t) => t !== value) : [...filters.types, value];
    onChange({ ...filters, types });
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <Chip active={filters.types.length === 0} onClick={() => onChange({ ...filters, types: [] })}>
        All Activities
      </Chip>
      {TYPE_OPTIONS.map((opt) => (
        <Chip key={opt.value} active={filters.types.includes(opt.value)} onClick={() => toggleType(opt.value)}>
          {opt.label}
        </Chip>
      ))}

      <div style={{ width: 1, height: 22, background: '#e5e7eb', margin: '0 4px' }} />

      <Select value={filters.role || 'all'} onValueChange={(v) => onChange({ ...filters, role: v === 'all' ? null : v })}>
        <SelectTrigger style={{ width: 130, height: 32, fontSize: 12 }}><SelectValue placeholder="Role" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          {ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.category || 'all'} onValueChange={(v) => onChange({ ...filters, category: v === 'all' ? null : v })}>
        <SelectTrigger style={{ width: 150, height: 32, fontSize: 12 }}><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {(categories || []).map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Input
        value={authorInput}
        onChange={(e) => setAuthorInput(e.target.value)}
        placeholder="Filter by author..."
        style={{ width: 170, height: 32, fontSize: 12 }}
      />
    </div>
  );
}
