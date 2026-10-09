import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('tiles manifest fetch bypasses HTTP cache', () => {
  const s = readFileSync('public/script.js', 'utf8');
  assert.doesNotMatch(s, /tiles\.json.*force-cache|force-cache.*tiles\.json/s);
  assert.match(s, /resolveTilesManifest/);
});

test('privacy doc does not overclaim analytics loader', () => {
  const d = readFileSync('docs/PRIVACY.md', 'utf8');
  const js = readFileSync('public/js/consent.js', 'utf8');
  const claimsLoader = /plausible.*pageview|loads .*analytics/i.test(d);
  const hasLoader = /plausible/i.test(js);
  assert.ok(!claimsLoader || hasLoader, 'doc claims a loader that does not exist');
});

test('signingConfigs defined before buildTypes', () => {
  const g = readFileSync('android/app/build.gradle', 'utf8');
  assert.ok(g.indexOf('signingConfigs') < g.indexOf('buildTypes'), 'signingConfigs must precede buildTypes');
});
