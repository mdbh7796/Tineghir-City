import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

// CC BY-SA / CC BY images are acceptable only with attribution:
// every commons-* original must be logged in assets/SOURCES.md with
// author + license + source page, and credited visibly in gallery captions.
test('attribution: every commons image is logged in SOURCES.md', () => {
  assert.ok(existsSync('assets/SOURCES.md'), 'missing assets/SOURCES.md');
  const sources = readFileSync('assets/SOURCES.md', 'utf8');
  const originals = readdirSync('assets/originals').filter((f) => f.startsWith('commons-') && f.endsWith('.jpg'));
  assert.ok(originals.length > 0, 'no commons-* originals tracked');
  for (const f of originals) {
    assert.ok(sources.includes(f), `SOURCES.md missing ${f}`);
  }
  for (const needle of ['wikimedia.org', 'CC BY']) {
    assert.ok(sources.includes(needle), `SOURCES.md missing "${needle}"`);
  }
});

test('attribution: every commons image has a visible gallery credit', () => {
  const gallery = readFileSync('src/templates/pages/gallery.html', 'utf8');
  const originals = readdirSync('assets/originals').filter((f) => f.startsWith('commons-') && f.endsWith('.jpg'));
  for (const f of originals) {
    const base = f.replace(/\.jpg$/, '');
    assert.ok(gallery.includes(`images/${base}-`), `gallery.html missing responsive use of ${f}`);
    assert.ok(gallery.includes('via Wikimedia Commons'), `gallery.html missing Commons credit near ${f}`);
  }
  assert.match(gallery, /Photo: [^<]+, CC BY(-SA)? [0-9.]+, via Wikimedia Commons/);
});
