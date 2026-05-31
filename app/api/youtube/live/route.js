import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const configCollection = await getCollection('config');
    const dbConfig = await configCollection.findOne({ key: 'youtube' });

    if (dbConfig?.videoId) {
      return json({
        isLive: dbConfig.isLive ?? true,
        configured: true,
        manual: true,
        videoId: dbConfig.videoId,
        channelId: dbConfig.channelId || process.env.YOUTUBE_CHANNEL_ID,
        title: dbConfig.title || null,
      });
    }

    const channelId = dbConfig?.channelId || process.env.YOUTUBE_CHANNEL_ID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!channelId || channelId.startsWith('TODO')) {
      return json({ isLive: false, configured: false });
    }

    const uploadsPlaylistId = 'UU' + channelId.slice(2);

    if (!apiKey || apiKey.startsWith('TODO')) {
      return json({ isLive: false, configured: true, channelId, uploadsPlaylistId, liveDetection: false });
    }

    try {
      const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
      const liveRes = await fetch(liveUrl);
      const liveData = await liveRes.json();

      if (liveData.items && liveData.items.length > 0) {
        const liveVideo = liveData.items[0];
        return json({
          isLive: true,
          configured: true,
          liveDetection: true,
          channelId,
          videoId: liveVideo.id.videoId,
          title: liveVideo.snippet.title,
          thumbnail: liveVideo.snippet.thumbnails.high?.url,
          channelTitle: liveVideo.snippet.channelTitle,
        });
      }

      const latestUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=1&key=${apiKey}`;
      const latestRes = await fetch(latestUrl);
      const latestData = await latestRes.json();

      if (latestData.items && latestData.items.length > 0) {
        const latest = latestData.items[0].snippet;
        return json({
          isLive: false,
          configured: true,
          liveDetection: true,
          channelId,
          videoId: latest.resourceId.videoId,
          title: latest.title,
          thumbnail: latest.thumbnails?.high?.url,
          channelTitle: latest.channelTitle,
        });
      }

      return json({ isLive: false, configured: true, liveDetection: true, channelId });
    } catch (error) {
      return json({ isLive: false, configured: true, liveDetection: false, channelId, error: error.message });
    }
  } catch (error) {
    console.error('GET /api/youtube/live error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
