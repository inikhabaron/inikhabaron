import cron from 'node-cron';
import { getCollection } from '@/lib/mongodb';
import logger from '@/lib/logger';

let cronJob;

export function startScheduledPublishing() {
  if (cronJob) return logger.info('Scheduled publishing already running');
  
  cronJob = cron.schedule('*/5 * * * *', async () => {
    try {
      const newsCollection = await getCollection('news');
      const now = new Date();
      
      const result = await newsCollection.updateMany(
        { 
          status: 'scheduled', 
          scheduledAt: { $lte: now } 
        },
        { 
          $set: { 
            status: 'published', 
            publishedAt: now,
            updatedAt: now 
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        logger.info('Published scheduled articles', { count: result.modifiedCount });
      }
    } catch (error) {
      logger.error('Scheduled publishing error', { error: error?.message || error });
    }
  });
  
  logger.info('Scheduled publishing job started (runs every 5 minutes)');
}

export function stopScheduledPublishing() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    logger.info('Scheduled publishing job stopped');
  }
}
