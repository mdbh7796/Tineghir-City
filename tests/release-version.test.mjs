import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

test('release-version script exposes versionCodeFor and currentVersion', async () => {
  assert.ok(existsSync('scripts/release-version.mjs'), 'scripts/release-version.mjs missing');
  const mod = await import('../scripts/release-version.mjs');
  assert.equal(typeof mod.versionCodeFor, 'function');
  assert.equal(typeof mod.currentVersion, 'function');
  assert.equal(mod.versionCodeFor(['v1.0.0', 'v1.1.0']), 3);
  assert.ok(mod.versionCodeFor(['v1.0.0']) < mod.versionCodeFor(['v1.0.0', 'v1.1.0']));
  const cur = mod.currentVersion();
  assert.match(cur.name, /^\d+\.\d+\.\d+$/);
  assert.ok(Number.isInteger(cur.code) && cur.code >= 1);
});
