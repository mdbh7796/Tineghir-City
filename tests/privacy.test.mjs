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

test('privacy docs describe on-device location use', () => {
  assert.ok(existsSync('docs/PRIVACY.md'));
  const d = readFileSync('docs/PRIVACY.md', 'utf8');
  assert.match(d, /on-device/i);
});

test('no consent banner is shipped while there is no analytics', () => {
  const base = readFileSync('src/templates/base.html', 'utf8');
  assert.doesNotMatch(base, /js\/consent\.js/);
  for (const p of ['index', 'privacy', 'tools']) {
    const html = readFileSync(`public/${p}.html`, 'utf8');
    assert.doesNotMatch(html, /consent-banner|js\/consent\.js/, `${p}.html ships consent UI`);
  }
  const d = readFileSync('docs/PRIVACY.md', 'utf8');
  assert.match(d, /no analytics/i);
  assert.match(d, /no consent prompt/i);
});
