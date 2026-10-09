import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('QA checklist covers the device and permission matrix', () => {
  assert.ok(existsSync('docs/PLAY-QA-CHECKLIST.md'));
  const d = readFileSync('docs/PLAY-QA-CHECKLIST.md', 'utf8');
  for (const needle of ['airplane', 'denied', 'rotation', 'dark mode', 'back button', 'cold start', 'pre-launch report']) {
    assert.match(d, new RegExp(needle, 'i'), `missing: ${needle}`);
  }
  assert.ok(existsSync('docs/PLAY-QA-RESULTS.md'));
});
