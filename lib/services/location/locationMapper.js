export function mapLocation(location, { includeSlug = true } = {}) {
  const dto = {
    id: location?.id || '',
    name: location?.name || '',
    nameHi: location?.nameHi || '',
  };

  if (includeSlug) {
    dto.slug = location?.slug || '';
  }

  return dto;
}
