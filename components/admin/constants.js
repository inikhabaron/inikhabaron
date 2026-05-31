export const SIDEBAR_W = 230;

export const statusColors = {
  draft: 'bg-gray-500',
  pending_review: 'bg-yellow-500',
  needs_revision: 'bg-orange-500',
  ready_to_publish: 'bg-blue-500',
  published: 'bg-green-500',
  scheduled: 'bg-blue-500',
  rejected: 'bg-red-500',
};

export const statusOptionsByRole = {
  reporter: [{ value: 'draft', label: 'Draft' }],
  editor: [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'needs_revision', label: 'Needs Revision' },
  ],
  admin: [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'needs_revision', label: 'Needs Revision' },
    { value: 'ready_to_publish', label: 'Ready to Publish' },
    { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' },
  ],
};

export const statusFilterOptionsByRole = {
  reporter: [
    { value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' }, { value: 'needs_revision', label: 'Needs Revision' },
  ],
  editor: [
    { value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' }, { value: 'needs_revision', label: 'Needs Revision' },
    { value: 'ready_to_publish', label: 'Ready to Publish' }, { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' }, { value: 'rejected', label: 'Rejected' },
  ],
  admin: [
    { value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' }, { value: 'needs_revision', label: 'Needs Revision' },
    { value: 'ready_to_publish', label: 'Ready to Publish' }, { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' }, { value: 'rejected', label: 'Rejected' },
  ],
};

export const STATUS_LABELS = {
  draft: 'Drafts', pending_review: 'Pending', needs_revision: 'Revision',
  ready_to_publish: 'Ready', published: 'Published', scheduled: 'Scheduled', rejected: 'Rejected',
};

export const STATUS_STYLES = {
  draft: { color: '#b45309', bg: '#fef3c7' },
  pending_review: { color: '#1d4ed8', bg: '#dbeafe' },
  needs_revision: { color: '#c2410c', bg: '#ffedd5' },
  ready_to_publish: { color: '#6d28d9', bg: '#ede9fe' },
  published: { color: '#065f46', bg: '#d1fae5' },
  scheduled: { color: '#0e7490', bg: '#cffafe' },
  rejected: { color: '#991b1b', bg: '#fee2e2' },
};
