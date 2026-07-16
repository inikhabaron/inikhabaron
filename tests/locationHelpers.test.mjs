import assert from 'node:assert/strict';
import { createLocation } from '../lib/location/helpers.js';

const state = createLocation({
  name: 'Maharashtra',
  type: 'state',
  order: 1,
});

const district = createLocation({
  name: 'Aurangabad',
  type: 'district',
  parentId: state.id,
  parentSlug: state.slug,
  order: 1,
});

assert.equal(district.slug, 'maharashtra-aurangabad');
assert.equal(district.id, 'district-maharashtra-aurangabad');

console.log('location helper regression test passed');
