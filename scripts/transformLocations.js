import fs from 'fs';
import path from 'path';

import {
  createLocation,
  generateLocationId,
  slugifyLocation,
} from '../lib/location/helpers.js';

import { LOCATION_TYPES } from '../lib/location/constants.js';

const RAW_FILE = path.join(
  process.cwd(),
  'data',
  'raw',
  'india-states-districts.json'
);

const OUTPUT_FILE = path.join(
  process.cwd(),
  'data',
  'generated',
  'locations.json'
);

const STATE_NAME_MAP = {
  'Andaman and Nicobar Island (UT)': 'Andaman and Nicobar Islands',
  'Delhi (NCT)': 'Delhi',
  'Jammu and Kashmir (UT)': 'Jammu and Kashmir',
  'Ladakh (UT)': 'Ladakh',
  'Lakshadweep (UT)': 'Lakshadweep',
  'Puducherry (UT)': 'Puducherry',
  'Chandigarh (UT)': 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu (UT)':
    'Dadra and Nagar Haveli and Daman and Diu',
};

function normalizeStateName(name) {
  return STATE_NAME_MAP[name] || name;
}

const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));

const locations = [];

raw.states.forEach((stateData, stateIndex) => {
  const stateName = normalizeStateName(stateData.state);

  const state = createLocation({
    name: stateName,
    type: LOCATION_TYPES.STATE,
    order: stateIndex + 1,
  });

  locations.push(state);

  stateData.districts.forEach((districtName, districtIndex) => {
    const district = createLocation({
      name: districtName,
      type: LOCATION_TYPES.DISTRICT,
      parentId: state.id,
      parentSlug: state.slug,
      order: districtIndex + 1,
    });

    locations.push(district);
  });
});

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'jayeshgupta91/Indian-States-Districts',
  locations,
};

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(output, null, 2),
  'utf8'
);

console.log(
  `✅ Generated ${locations.length} locations → ${OUTPUT_FILE}`
);