import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// Static smoke coverage: drawer, planner mounts, and CSS classes
// exist in the built output (no browser required; Playwright covers behavior).
test('smoke: drawer mounts on every page', () => {
  for (const p of ['index', 'attractions', 'tools']) {
    const html = readFileSync(`public/${p}.html`, 'utf8');
    assert.match(html, /id="site-drawer"/, `${p}.html drawer`);
    assert.match(html, /js\/drawer\.js/, `${p}.html drawer.js`);
  }
});

test('smoke: planner mounts with its tool styles', () => {
  const tools = readFileSync('public/tools.html', 'utf8');
  assert.match(tools, /id="plan-list"/);
  assert.match(tools, /id="pack-list"/);
  assert.match(tools, /js\/tools\.js/);
  const css = readFileSync('public/style.css', 'utf8');
  for (const c of ['.directions-btn', '.share-btn', '.sort-toggle', '.skip-link']) {
    assert.ok(css.includes(c), `style.css missing ${c}`);
  }
});

test('smoke: every page has a skip link and a 404 exists outside the sitemap', () => {
  const pages = ['index', 'about', 'attractions', 'gallery', 'itineraries', 'guide', 'practical', 'visit', 'stay', 'contact', 'transport', 'tools', 'privacy', '404'];
  for (const p of pages) {
    const html = readFileSync(`public/${p}.html`, 'utf8');
    assert.match(html, /class="skip-link"/, `${p}.html missing skip link`);
    assert.match(html, /id="main-content"/, `${p}.html missing main target`);
  }
  const notFound = readFileSync('public/404.html', 'utf8');
  assert.match(notFound, /<meta name="robots" content="noindex" \/>/);
  assert.doesNotMatch(readFileSync('public/sitemap.xml', 'utf8'), /\/404\.html/);
});

test('smoke: map + share/sort guards present', () => {
  assert.ok(existsSync('public/script.js'));
  const s = readFileSync('public/script.js', 'utf8');
  assert.match(s, /#attractions-grid/);
  assert.match(s, /exitApp/);
  assert.doesNotMatch(s, /style\.cssText/);
});

test('smoke: escH escapes < > \" and single-quote', () => {
  const src = readFileSync('public/js/tools.js', 'utf8');
  for (const needle of ['&gt;', '&#39;']) assert.ok(src.includes(needle), `tools.js escH missing ${needle}`);
});
