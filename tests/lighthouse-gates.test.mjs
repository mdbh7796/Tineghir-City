import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// lhci's staticDistDir autodiscovery silently caps at 5 URLs by default
// (maxAutodiscoverUrls), which let 8 of 13 pages go unchecked by the gate.
test('lighthouse audits every page and keeps strict error-level gates', () => {
  const c = JSON.parse(readFileSync('.lighthouserc.json', 'utf8')).ci;
  assert.equal(c.collect.staticDistDir, './public');
  assert.equal(c.collect.maxAutodiscoverUrls, 0, 'autodiscovery must not cap coverage at 5 URLs');
  for (const k of ['categories:accessibility', 'categories:seo']) {
    const [level, opts] = c.assert.assertions[k];
    assert.equal(level, 'error', `${k} must fail the build`);
    assert.ok(opts.minScore >= 0.95, `${k} minScore must stay >= 0.95`);
  }
});
