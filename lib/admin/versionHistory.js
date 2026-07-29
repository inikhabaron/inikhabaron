export function getVersionDisplayStatus(status) {
  if (!status) return 'Unknown';
  return String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getVersionSummary(version, index) {
  return {
    versionLabel: `Version ${index + 1}`,
    title: version?.title || 'Untitled version',
    displayStatus: getVersionDisplayStatus(version?.status),
  };
}
