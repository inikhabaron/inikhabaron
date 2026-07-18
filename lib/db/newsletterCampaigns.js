import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

const newsletterCampaignIndexes = [
  { keys: { startedAt: -1 }, options: { name: 'started_desc' } },
  { keys: { type: 1, month: 1 }, options: { name: 'type_month' } },
];

export function getNewsletterCampaignsCollection() {
  return getDbCollection(
    COLLECTIONS.NEWSLETTER_CAMPAIGNS,
    newsletterCampaignIndexes
  );
}
