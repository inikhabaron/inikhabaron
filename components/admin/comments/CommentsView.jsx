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

  sort = 'newest',
  onSortChange,

  searchQuery = '',
  onSearchChange,

  onSaveModeration,

  onApprove,
  onReject,
  onHide,
  onDelete,
  onPreview,
  onRestore,
  onPurge,
  canPurge = false,
  onToggleArticleComments,
  captchaStatus = null,
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
          captchaStatus={captchaStatus}
        />
      </div>

      {/* -----------------------------
          Review-window alert
      ------------------------------ */}

      {stats?.overdue > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 24,
            padding: '14px 18px',
            borderRadius: 12,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span>
            {stats.overdue} comment
            {stats.overdue === 1 ? ' has' : 's have'} been
            waiting for editorial review for more than 24 hours.
          </span>

          <button
            onClick={() => {
              onStatusFilterChange?.('overdue');
              onSortChange?.('oldest_unreviewed');
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #FCA5A5',
              background: '#fff',
              color: '#991B1B',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Show them
          </button>
        </div>
      )}

      {moderationSettings?.alertEnabled &&
        moderationSettings?.alertThreshold > 0 &&
        stats?.guestUnreviewed >= moderationSettings.alertThreshold && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 24,
              padding: '14px 18px',
              borderRadius: 12,
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <span>
              {stats.guestUnreviewed} guest comments are live and
              unreviewed (alert threshold:{' '}
              {moderationSettings.alertThreshold}).
            </span>

            <button
              onClick={() => {
                onStatusFilterChange?.('needs_review');
                onSortChange?.('oldest_unreviewed');
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #FCD34D',
                background: '#fff',
                color: '#92400E',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Review them
            </button>
          </div>
        )}

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
            sort={sort}
            onSortChange={onSortChange}
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
            onRestore={onRestore}
            onPurge={onPurge}
            canPurge={canPurge}
            onToggleArticleComments={onToggleArticleComments}
          />
        </div>

      </div>

    </div>
  );
}