import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('optimize script emits avif variants', () => {
  const s = readFileSync('scripts/optimize-images.mjs', 'utf8');
  assert.match(s, /\.avif\(/);
  assert.match(s, /AVIF_Q/);
});

test('check-pages requires avif for responsive images', () => {
  const s = readFileSync('scripts/check-pages.mjs', 'utf8');
  assert.match(s, /avif/i);
});
