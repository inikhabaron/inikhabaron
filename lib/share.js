export async function recordShare(articleId, platform) {
  try {
    await fetch(`/api/news/${articleId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
  } catch (error) {
    console.error('Failed to record share:', error);
  }
}