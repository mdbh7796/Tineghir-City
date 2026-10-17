import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

test('i18n dictionaries have key parity + rtl for Arabic', () => {
  const dir = 'src/templates/i18n';
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  assert.ok(files.includes('en.json'));
  assert.ok(files.includes('fr.json'));
  assert.ok(files.includes('ar.json'));
  const flat = (o, p = '') =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
  const ref = flat(JSON.parse(readFileSync(`${dir}/en.json`, 'utf8'))).sort();
  for (const f of files) {
    const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    assert.ok(d.lang && d.dir, `${f} lang/dir`);
    const ks = flat(d).sort();
    assert.deepEqual(ks, ref, `${f} key parity`);
  }
  const ar = JSON.parse(readFileSync(`${dir}/ar.json`, 'utf8'));
  assert.equal(ar.dir, 'rtl');
});

test('base.html stays English-only until fr/ar URLs exist', () => {
  const base = readFileSync('src/templates/base.html', 'utf8');
  assert.match(base, /<html lang="en"/);
  // Self-referential hreflang on an English-only page is an SEO anti-pattern.
  assert.doesNotMatch(base, /hreflang="(fr|ar|x-default)"/);
});
