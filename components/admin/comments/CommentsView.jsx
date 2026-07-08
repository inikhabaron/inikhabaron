'use client';

import { DS } from '@/components/admin/design-system';

import { CommentStats } from './CommentStats';
import { CommentFilters } from './CommentFilters';
import { CommentModerationCard } from './CommentModerationCard';
import { CommentsTable } from './CommentsTable';

export function CommentsView({
  comments = [],
  loading = false,

  stats = {},

  moderationSettings = {},

  statusFilter = 'all',
  onStatusFilterChange,

  searchQuery = '',
  onSearchChange,

  onSaveModeration,

  onApprove,
  onReject,
  onHide,
  onDelete,
  onPreview,
}) {
  return (
    <div style={DS.page}>
      <div style={DS.pageHeader}>
        <div>
          <h1 style={DS.pageTitle}>
            Comments
          </h1>

          <p style={DS.pageSubtitle}>
            Moderate reader comments and manage
            community discussions.
          </p>
        </div>
      </div>

      <CommentStats
        stats={stats}
      />

      <CommentFilters
        statusFilter={statusFilter}
        onStatusFilterChange={
          onStatusFilterChange
        }
        searchQuery={searchQuery}
        onSearchChange={
          onSearchChange
        }
      />

      <CommentModerationCard
        settings={moderationSettings}
        onSave={onSaveModeration}
      />

      <CommentsTable
        comments={comments}
        loading={loading}

        onApprove={onApprove}
        onReject={onReject}
        onHide={onHide}
        onDelete={onDelete}

        onPreview={onPreview}
      />
    </div>
  );
}