export function logApiError(route, error) {
  console.error(`\n========== API ERROR ==========`);

  console.error('Route:', route);

  console.error('Message:', error.message);

  console.error('Stack:', error.stack);

  console.error('Full Error:', error);

  console.error(`===============================\n`);
}