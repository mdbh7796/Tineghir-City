import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('map supports place deep-link', () => {
  const s = readFileSync('public/script.js', 'utf8');
  assert.match(s, /URLSearchParams/);
  assert.match(s, /place/);
});

test('locate and banner styles live in CSS not inline', () => {
  const css = readFileSync('src/input.css', 'utf8');
  assert.match(css, /leaflet-locate-btn/);
  assert.match(css, /tiles-banner/);
});

test('locate button announces status', () => {
  const s = readFileSync('public/script.js', 'utf8');
  assert.match(s, /aria-live|role="status"|sort-status/);
});
