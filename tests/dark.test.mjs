import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('dark variant defined for tailwind v4', () => {
  const css = readFileSync('src/input.css', 'utf8');
  assert.match(css, /custom-variant.*dark/);
  assert.match(css, /color-scheme/);
});

test('theme toggle persisted and avoids FOUC', () => {
  const base = readFileSync('src/templates/base.html', 'utf8');
  assert.match(base, /tineghir-theme/);
  assert.match(base, /prefers-color-scheme/);
  assert.match(base, /dataset\.theme/);
  assert.match(base, /theme-toggle/);
});
