import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// Guard for the offline-maps pointer: if public/tiles.json exists it must
// match the schema scripts/fetch-tiles.mjs validates (no extra size field
// required, but the three keys must be exact). Absent manifest = dormant
// layer, which is valid until the owner ships the first tile release.
test('tiles.json pointer matches fetch-tiles schema when present', () => {
  if (!existsSync('public/tiles.json')) return;
  const m = JSON.parse(readFileSync('public/tiles.json', 'utf8'));
  for (const key of ['releaseUrl', 'sha256', 'asset']) {
    assert.ok(typeof m[key] === 'string' && m[key].length, `tiles.json missing "${key}"`);
  }
  assert.match(m.releaseUrl, /^https:\/\//, 'releaseUrl must be https');
  assert.match(m.sha256, /^[0-9a-fA-F]{64}$/, 'sha256 must be 64 hex chars');
  assert.doesNotMatch(m.asset, /^public\//, 'asset is relative to public/');
});
