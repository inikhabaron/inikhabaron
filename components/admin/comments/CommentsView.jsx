'use client';

import { Loader2, MessageSquare } from 'lucide-react';

import { DS } from '@/components/admin/design-system';

import { CommentStats } from './CommentStats';
import { CommentFilters } from './CommentFilters';
import { CommentsTable } from './CommentsTable';
import { CommentModerationSettings } from './CommentModerationSettings';

export function CommentsView({
  comments = [],
  loading = false,

  stats = {},

  moderationSettings = {},
  setModerationSettings,

  savingModeration = false,

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
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 300,
        }}
      >
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        <Loader2
          size={50}
          style={{
            animation: 'spin 1s linear infinite',
            color: '#2563eb',
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>

      {/* -----------------------------
          Page Header
      ------------------------------ */}

      <div style={DS.pageHeader}>
        <div>
          <h1 style={{...DS.pageTitle, fontSize: 20, fontWeight: 700, marginBottom: 10}}>
            Comments
          </h1>

          <p style={{...DS.pageSubtitle, fontWeight: 300, marginBottom: 20 }}>
            Moderate reader comments and manage
            community discussions.
          </p>
        </div>
      </div>

      {/* -----------------------------
          Moderation Settings
      ------------------------------ */}

      <div
        style={{
          ...DS.card,
          marginBottom: 24,
          overflow: 'hidden',
        }}
      >
        <CommentModerationSettings
          settings={moderationSettings}
          setSettings={setModerationSettings}
          saving={savingModeration}
          onSave={onSaveModeration}
        />
      </div>

      {/* -----------------------------
          Statistics
      ------------------------------ */}

      <div
        style={{
          marginBottom: 24,
        }}
      >
        <CommentStats
          stats={stats}
        />
      </div>

      {/* -----------------------------
          Comments Card
      ------------------------------ */}

      <div
        style={{
          ...DS.card,
          overflow: 'hidden',
        }}
      >

        {/* Card Header */}

        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #F3F4F6',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
            }}
          >
            <MessageSquare
              size={18}
              color="#2563eb"
            />

            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: '#111827',
              }}
            >
              Reader Comments
            </h2>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#6B7280',
            }}
          >
            Review, approve, reject or hide
            comments submitted by readers.
          </p>
        </div>

        {/* Filters */}

        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F3F4F6',
          }}
        >
          <CommentFilters
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
          />
        </div>

        {/* Table */}

        <div
          style={{
            padding: 24,
          }}
        >
          <CommentsTable
            comments={comments}
            loading={false}
            onApprove={onApprove}
            onReject={onReject}
            onHide={onHide}
            onDelete={onDelete}
            onPreview={onPreview}
          />
        </div>

      </div>

    </div>
  );
}