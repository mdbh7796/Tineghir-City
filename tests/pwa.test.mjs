import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('webmanifest exists and is installable', () => {
  assert.ok(existsSync('public/manifest.webmanifest'));
  const m = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.theme_color, '#1c1917');
  assert.ok(m.icons.some((i) => i.sizes === '512x512'));
});

test('service worker caches shell and versioned tiles', () => {
  assert.ok(existsSync('public/sw.js'));
  const s = readFileSync('public/sw.js', 'utf8');
  assert.match(s, /CACHE_VERSION/);
  assert.match(s, /tiles\.json/);
});

test('base template links manifest and registers SW', () => {
  const b = readFileSync('src/templates/base.html', 'utf8');
  assert.match(b, /rel="manifest"/);
  assert.match(b, /serviceWorker/);
});
