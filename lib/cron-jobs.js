import cron from 'node-cron';
import { getCollection } from '@/lib/mongodb';

let cronJob;

export function startScheduledPublishing() {
  if (cronJob) return console.log('✓ Scheduled publishing already running');
  
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
        console.log(`✓ Published ${result.modifiedCount} scheduled articles`);
      }
    } catch (error) {
      console.error('Scheduled publishing error:', error);
    }
  });
  
  console.log('✓ Scheduled publishing job started (runs every 5 minutes)');
}

export function stopScheduledPublishing() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('✓ Scheduled publishing job stopped');
  }
}
