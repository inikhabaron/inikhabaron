'use client';

import { Search } from 'lucide-react';

import { DS } from '@/components/admin/design-system';

// Not all of these are comment statuses: 'needs_review', 'overdue', 'guest',
// 'guest_new', 'guest_unreviewed' and 'guest_overdue' are queue views the admin
// page maps to API query params.
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Comments' },
  { value: 'needs_review', label: 'Needs review (unreviewed)' },
  { value: 'overdue', label: 'Unreviewed over 24h' },
  { value: 'guest_unreviewed', label: 'Guest comments needing review' },
  { value: 'guest_overdue', label: 'Guest comments over 24h' },
  { value: 'guest', label: 'Guest comments' },
  { value: 'guest_new', label: 'Newest guest comments (24h)' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'reported', label: 'Reported' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'deleted', label: 'Deleted (restorable)' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest_unreviewed', label: 'Oldest unreviewed first' },
];

export function CommentFilters({
  statusFilter = 'all',
  onStatusFilterChange,
  sort = 'newest',
  onSortChange,
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

        <select
          value={sort}
          onChange={(e) =>
            onSortChange?.(e.target.value)
          }
          aria-label="Sort comments"
          style={{
            padding: '10px 14px',

            border: '1px solid #E5E7EB',

            borderRadius: 10,

            fontSize: 14,

            minWidth: 200,

            outline: 'none',

            background: '#fff',
          }}
        >
          {SORT_OPTIONS.map((option) => (
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