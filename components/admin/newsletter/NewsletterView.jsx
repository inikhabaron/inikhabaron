'use client';

import { Loader2, Mail, ChevronLeft, ChevronRight } from 'lucide-react';

import { DS } from '@/components/admin/design-system';
import { PaginationBtn } from '@/components/admin/PaginationBtn';

import { NewsletterStats } from './NewsletterStats';
import { NewsletterFilters } from './NewsletterFilters';
import { NewsletterTable } from './NewsletterTable';
import { NewsletterSendPanel } from './NewsletterSendPanel';
import { NewsletterPreviewModal } from './NewsletterPreviewModal';
import { NewsletterCampaignHistory } from './NewsletterCampaignHistory';

export function NewsletterView({
  subscribers = [],
  loading = false,

  stats = {},

  statusFilter = 'all',
  onStatusFilterChange,

  languageFilter = 'all',
  onLanguageFilterChange,

  searchQuery = '',
  onSearchChange,

  onExportCsv,

  page = 1,
  hasNext = false,
  onPrevPage,
  onNextPage,

  onToggleStatus,
  onDelete,

  sendType = 'monthly',
  onSendTypeChange,
  onPreview,
  previewLoading = false,
  previewData = null,
  onClosePreview,
  onSend,
  sending = false,
  forceResend = false,
  onForceResendChange,
  lastSendResult = null,
  campaigns = [],
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 300 }}>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        <Loader2 size={50} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#111827' }}>
          Newsletter
        </h1>

        <p style={{ fontWeight: 300, marginBottom: 20, color: '#6B7280', fontSize: 14 }}>
          Manage newsletter subscribers, filter by status or language, and export the list.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <NewsletterStats stats={stats} />
      </div>

      <NewsletterSendPanel
        activeCount={stats?.active ?? 0}
        sendType={sendType}
        onSendTypeChange={onSendTypeChange}
        onPreview={onPreview}
        previewLoading={previewLoading}
        onSend={onSend}
        sending={sending}
        forceResend={forceResend}
        onForceResendChange={onForceResendChange}
        lastResult={lastSendResult}
      />

      <NewsletterPreviewModal
        html={previewData?.html}
        subject={previewData?.subject}
        onClose={onClosePreview}
      />

      <NewsletterCampaignHistory campaigns={campaigns} />

      <div style={{ ...DS.card, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Mail size={18} color="#2563eb" />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
              Subscribers
            </h2>
          </div>

          <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
            Search, filter, deactivate or remove newsletter subscribers.
          </p>
        </div>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }}>
          <NewsletterFilters
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            languageFilter={languageFilter}
            onLanguageFilterChange={onLanguageFilterChange}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onExportCsv={onExportCsv}
          />
        </div>

        <div style={{ padding: 24 }}>
          <NewsletterTable
            subscribers={subscribers}
            loading={false}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 18 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Page {page}</span>

            <PaginationBtn disabled={page <= 1} onClick={onPrevPage}>
              <ChevronLeft size={16} />
            </PaginationBtn>

            <PaginationBtn disabled={!hasNext} onClick={onNextPage}>
              <ChevronRight size={16} />
            </PaginationBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
