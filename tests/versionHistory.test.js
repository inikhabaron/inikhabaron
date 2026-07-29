const test = require('node:test');
const assert = require('node:assert/strict');
const { getVersionDisplayStatus, getVersionSummary } = require('../lib/admin/versionHistory');

test('formats version status labels and summary metadata', () => {
  const summary = getVersionSummary({ status: 'pending_review', title: 'Example title' }, 2);

  assert.equal(getVersionDisplayStatus('pending_review'), 'Pending Review');
  assert.equal(summary.versionLabel, 'Version 3');
  assert.equal(summary.title, 'Example title');
});
