/**
 * Builds the Mongo query for news visible to a given user location.
 *
 * A district-scoped user must see national + their state's + their
 * district's articles, not district articles only, so each scope the
 * user actually has (state, district) gets its own additive $or clause.
 */
export function buildLocationQuery(location) {
  const loc = location || { enabled: false, scope: 'national', country: 'India' };

  const clauses = [{ 'location.enabled': false }];

  if (loc.enabled && loc.stateId) {
    clauses.push({
      'location.scope': 'state',
      'location.stateId': loc.stateId,
    });
  }

  if (loc.enabled && loc.stateId && loc.districtId) {
    clauses.push({
      'location.scope': 'district',
      'location.stateId': loc.stateId,
      'location.districtId': loc.districtId,
    });
  }

  return {
    status: 'published',
    $or: clauses,
  };
}
