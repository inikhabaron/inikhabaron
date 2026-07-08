'use client';

import { Search } from 'lucide-react';

import { DS } from '@/components/admin/design-system';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Comments' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'reported', label: 'Reported' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'rejected', label: 'Rejected' },
];

export function CommentFilters({
  statusFilter = 'all',
  onStatusFilterChange,
  searchQuery = '',
  onSearchChange,
}) {
  return (
    <div
      style={{
        ...DS.card,

        marginBottom: 24,

        padding: 20,

        display: 'flex',
        gap: 18,

        flexWrap: 'wrap',

        alignItems: 'center',

        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) =>
            onStatusFilterChange?.(
              e.target.value
            )
          }
          style={{
            padding: '10px 14px',

            border: '1px solid #E5E7EB',

            borderRadius: 10,

            fontSize: 14,

            minWidth: 180,

            outline: 'none',

            background: '#fff',
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          position: 'relative',

          width: 320,

          maxWidth: '100%',
        }}
      >
        <Search
          size={18}
          color="#9CA3AF"
          style={{
            position: 'absolute',

            top: '50%',

            left: 12,

            transform:
              'translateY(-50%)',
          }}
        />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) =>
            onSearchChange?.(
              e.target.value
            )
          }
          placeholder="Search comments, users or articles..."
          style={{
            width: '100%',

            padding:
              '10px 14px 10px 40px',

            border:
              '1px solid #E5E7EB',

            borderRadius: 10,

            fontSize: 14,

            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}