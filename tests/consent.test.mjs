import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('consent banner exists and defaults to deny', () => {
  assert.ok(existsSync('public/js/consent.js'));
  const s = readFileSync('public/js/consent.js', 'utf8');
  assert.match(s, /tineghir-consent/);
  assert.match(s, /__consent/);
  const base = readFileSync('src/templates/base.html', 'utf8');
  assert.match(base, /consent-banner|js\/consent\.js/);
});

test('privacy doc documents opt-in analytics', () => {
  assert.ok(existsSync('docs/PRIVACY.md'));
  const d = readFileSync('docs/PRIVACY.md', 'utf8');
  assert.match(d, /consent/i);
});
