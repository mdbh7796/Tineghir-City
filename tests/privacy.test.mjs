import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('privacy page built and linked from footer', () => {
  assert.ok(existsSync('public/privacy.html'), 'public/privacy.html missing — run npm run pages');
  const footer = readFileSync('src/templates/footer.html', 'utf8');
  assert.match(footer, /privacy\.html/);
  const html = readFileSync('public/privacy.html', 'utf8');
  assert.match(html, /Location stays on-device|location/i);
});

test('play compliance docs answer data safety and rating', () => {
  assert.ok(existsSync('docs/PLAY-DATA-SAFETY.md'));
  assert.ok(existsSync('docs/PLAY-CONTENT-RATING.md'));
  const ds = readFileSync('docs/PLAY-DATA-SAFETY.md', 'utf8');
  assert.match(ds, /ACCESS_FINE_LOCATION|precise location/i);
  assert.match(ds, /never shared|not shared|no sharing/i);
});
