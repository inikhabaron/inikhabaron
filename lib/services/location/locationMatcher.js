import { getLocationsCollection } from '@/lib/db/locations';
import { LOCATION_TYPES } from '@/lib/location/constants';
import { normalizeSearchName } from '@/lib/location/helpers';
import { getDistricts } from './locationService';

// Matches a reverse-geocoded {stateName, districtName} pair against the
// seeded `locations` collection, so auto-detected location resolves to the
// same canonical ids/slugs the manual LocationSelector already uses.
export async function matchLocation({ stateName, districtName }) {
  if (!stateName) return { matched: false };

  const locations = await getLocationsCollection();
  const normalizedState = normalizeSearchName(stateName);

  const stateDoc = await locations.findOne({
    type: LOCATION_TYPES.STATE,
    isActive: true,
    searchName: normalizedState,
  });

  if (!stateDoc) return { matched: false };

  const stateResult = { stateId: stateDoc.id, stateName: stateDoc.name, stateSlug: stateDoc.slug };

  if (!districtName) {
    return { matched: true, scope: 'state', ...stateResult };
  }

  const normalizedDistrict = normalizeSearchName(districtName);

  let districtDoc = await locations.findOne({
    type: LOCATION_TYPES.DISTRICT,
    isActive: true,
    parentId: stateDoc.id,
    searchName: normalizedDistrict,
  });

  // Reverse-geocoded locality names frequently don't exactly match the
  // seeded district name (e.g. "Bengaluru" vs. "Bengaluru Urban") — fall
  // back to a contains-match over that state's (small, ~15-40) district list.
  if (!districtDoc) {
    const candidates = await getDistricts(stateDoc.id);
    districtDoc = candidates.find((candidate) => {
      const candidateName = normalizeSearchName(candidate.name);
      return candidateName.includes(normalizedDistrict) || normalizedDistrict.includes(candidateName);
    }) || null;
  }

  if (!districtDoc) {
    return { matched: true, scope: 'state', ...stateResult };
  }

  return {
    matched: true,
    scope: 'district',
    ...stateResult,
    districtId: districtDoc.id,
    districtName: districtDoc.name,
    districtSlug: districtDoc.slug,
  };
}
