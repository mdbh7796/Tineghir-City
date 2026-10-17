import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

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

test('content pages are dark-aware (no light-only surfaces)', () => {
  const pages = readdirSync('src/templates/pages').filter((f) => f.endsWith('.html'));
  assert.ok(pages.length > 0);
  for (const p of pages) {
    const html = readFileSync(`src/templates/pages/${p}`, 'utf8');
    assert.doesNotMatch(html, /text-stone-800/, `${p} has light-only text-stone-800`);
    assert.doesNotMatch(html, /bg-stone-100/, `${p} has light-only bg-stone-100`);
    for (const m of html.matchAll(/bg-white(?!\/)[^"]*/g)) {
      assert.ok(m[0].includes('dark:bg-'), `${p} has light-only card: "${m[0]}"`);
    }
  }
  const builder = readFileSync('scripts/build-pages.mjs', 'utf8');
  assert.doesNotMatch(builder, /text-stone-800/, 'build-pages has light-only text-stone-800');
  assert.doesNotMatch(builder, /bg-stone-100/, 'build-pages has light-only bg-stone-100');
});
