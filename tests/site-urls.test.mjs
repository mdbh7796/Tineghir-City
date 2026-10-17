import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The site is served from GitHub Pages. `tineghir.ma` never resolved and was
// retired (Play rejects a release whose privacy-policy URL is unreachable), so
// these guards keep every public URL pointing at the live base.
const SITE = 'https://mdbh7796.github.io/Tineghir-City';
const DEAD = /tineghir\.ma/;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

test('every canonical uses the live GitHub Pages base', () => {
  const meta = JSON.parse(readFileSync('src/templates/pages.meta.json', 'utf8'));
  for (const [key, page] of Object.entries(meta)) {
    if (key.startsWith('_')) continue;
    assert.ok(
      page.canonical.startsWith(`${SITE}/`),
      `${key} canonical must start with ${SITE}/ (got ${page.canonical})`
    );
  }
});

test('no reference to the retired tineghir.ma domain', () => {
  const files = [
    ...walk('src'),
    ...walk('scripts'),
    'README.md',
    'public/robots.txt',
    'public/index.html',
    'public/privacy.html',
    'public/script.js',
    'public/sw.js',
    'public/sitemap.xml',
  ];
  const hits = files.filter((f) => DEAD.test(readFileSync(f, 'utf8')));
  assert.deepEqual(hits, [], `retired domain still referenced in: ${hits.join(', ')}`);
});

test('robots.txt sitemap points at the Pages URL', () => {
  assert.match(
    readFileSync('public/robots.txt', 'utf8'),
    new RegExp(`Sitemap: ${esc(SITE)}/sitemap\\.xml`)
  );
});

test('privacy page and listing agree on the support email', () => {
  const email = JSON.parse(readFileSync('src/templates/pages.meta.json', 'utf8'))._site.contactEmail;
  assert.match(email, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i, 'contactEmail must look like an address');
  assert.ok(
    readFileSync('public/privacy.html', 'utf8').includes(email),
    'privacy.html must show the support email (run npm run build)'
  );
  assert.ok(
    readFileSync('docs/PLAY-LISTING-en.md', 'utf8').includes(email),
    'the Play listing must show the same support email'
  );
});

test('Play release docs exist and point at the live policy URL', () => {
  for (const f of [
    'docs/PLAY-RELEASE-CHECKLIST.md',
    'docs/PLAY-DATA-SAFETY.md',
    'docs/PLAY-CONTENT-RATING.md',
    'docs/PLAY-QA-CHECKLIST.md',
    'docs/PLAY-QA-RESULTS.md',
    'docs/RELEASE-SIGNING.md',
  ]) {
    assert.ok(existsSync(f), `${f} missing`);
  }
  for (const f of ['docs/PLAY-RELEASE-CHECKLIST.md', 'docs/PLAY-LISTING-en.md']) {
    assert.match(
      readFileSync(f, 'utf8'),
      new RegExp(`${esc(SITE)}/privacy\\.html`),
      `${f} must link the live privacy policy URL`
    );
  }
});
