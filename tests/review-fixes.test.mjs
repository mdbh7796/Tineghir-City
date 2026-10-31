import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('tiles manifest fetch bypasses HTTP cache', () => {
  const s = readFileSync('public/script.js', 'utf8');
  assert.doesNotMatch(s, /tiles\.json.*force-cache|force-cache.*tiles\.json/s);
  assert.match(s, /resolveTilesManifest/);
});

test('privacy doc does not claim an analytics loader', () => {
  const d = readFileSync('docs/PRIVACY.md', 'utf8');
  assert.doesNotMatch(d, /plausible|loads .*analytics/i);
});

test('release signing is env-based and optional (unsigned local builds work)', () => {
  const g = readFileSync('android/app/build.gradle', 'utf8');
  assert.ok(g.indexOf('signingConfigs') < g.indexOf('buildTypes'), 'signingConfigs must precede buildTypes');
  assert.match(g, /TINEGHIR_KEYSTORE_PATH/);
  assert.match(g, /if \(hasSigning\)/);
});
