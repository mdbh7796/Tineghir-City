import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// lhci's staticDistDir autodiscovery silently caps at 5 URLs by default
// (maxAutodiscoverUrls), which let 8 of 13 pages go unchecked by the gate.
// A dedicated 404 is intentionally noindex, so it must be excluded by name
// rather than audited and failing the SEO gate.
test('lighthouse audits every real page and keeps strict error-level gates', () => {
  const c = JSON.parse(readFileSync('.lighthouserc.json', 'utf8')).ci;
  assert.equal(c.collect.staticDistDir, './public');
  assert.equal(c.collect.maxAutodiscoverUrls, 0, 'autodiscovery must not cap coverage at 5 URLs');

  const urls = c.collect.url;
  assert.ok(Array.isArray(urls), 'collect.url must list pages explicitly');

  const pages = [
    'about',
    'attractions',
    'gallery',
    'itineraries',
    'guide',
    'practical',
    'visit',
    'stay',
    'contact',
    'transport',
    'tools',
    'privacy',
  ];
  assert.ok(urls.includes('/index.html'), 'index page must be audited');
  for (const p of pages) {
    assert.ok(urls.includes(`/${p}.html`), `lighthouse does not audit /${p}.html`);
  }
  assert.equal(urls.length, pages.length + 1, 'only the 13 real pages should be audited');
  assert.ok(!urls.some((u) => u.includes('404')), '404.html must stay out of the audit (noindex)');

  for (const k of ['categories:accessibility', 'categories:seo']) {
    const [level, opts] = c.assert.assertions[k];
    assert.equal(level, 'error', `${k} must fail the build`);
    assert.ok(opts.minScore >= 0.95, `${k} minScore must stay >= 0.95`);
  }
});
