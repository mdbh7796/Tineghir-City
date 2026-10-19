import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');

function srcFiles(dir = 'src', out = []) {
  for (const entry of readdirSync(dir)) {
    const p = `${dir}/${entry}`;
    if (statSync(p).isDirectory()) srcFiles(p, out);
    else out.push(p);
  }
  return out;
}

test('no emoji used as UI icons in src', () => {
  const offenders = srcFiles().filter((f) => /\p{Extended_Pictographic}/u.test(read(f)));
  assert.deepEqual(offenders, [], `emoji found in: ${offenders.join(', ')}`);
});

test('every icon sprite reference resolves to a symbol', () => {
  const sprite = read('public/images/icons.svg');
  const ids = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
  assert.ok(ids.size > 20, 'sprite should ship the full icon set');
  const refs = new Set();
  for (const f of srcFiles()) {
    for (const m of read(f).matchAll(/icons\.svg#([a-z-]+)/g)) refs.add(m[1]);
  }
  const missing = [...refs].filter((r) => !ids.has(r));
  assert.deepEqual(missing, [], `missing symbols: ${missing.join(', ')}`);
});

test('gallery lightbox triggers are real links with accessible names', () => {
  const g = read('src/templates/pages/gallery.html');
  assert.equal((g.match(/lightbox-trigger/g) || []).length, 10);
  assert.doesNotMatch(g, /<div[^>]*lightbox-trigger/, 'clickable divs are not keyboard accessible');
  const anchors = g.match(/<a[\s\S]*?lightbox-trigger[\s\S]*?aria-label="[^"]+"/g) || [];
  assert.equal(anchors.length, 10, 'each trigger needs an aria-label');
});

test('lightbox markup is a modal dialog with prev/next controls', () => {
  const g = read('src/templates/pages/gallery.html');
  assert.match(g, /id="lightbox"[\s\S]*?role="dialog"[\s\S]*?aria-modal="true"/);
  assert.match(g, /id="lightbox-prev"/);
  assert.match(g, /id="lightbox-next"/);
  assert.match(g, /id="lightbox-caption"/);
});

test('lightbox script traps focus, restores it, and supports arrow keys', () => {
  const s = read('src/js/lightbox.js');
  assert.match(s, /is-open/);
  assert.match(s, /returnFocus/);
  assert.match(s, /e\.key !== 'Tab'/);
  assert.match(s, /ArrowLeft/);
  assert.match(s, /ArrowRight/);
  assert.match(s, /lightbox-open/);
  assert.match(s, /lightboxImg\.alt = slide\.alt/);
});
