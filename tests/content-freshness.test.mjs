import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const MAX_AGE_DAYS = 180;

test('content freshness: stays + contacts have recent lastVerified', () => {
  for (const [file, label] of [['src/templates/stays.json', 'stay'], ['src/templates/contacts.json', 'contact']]) {
    const items = JSON.parse(readFileSync(file, 'utf8'));
    assert.ok(items.length > 0, `${file} empty`);
    for (const e of items) {
      assert.match(e.lastVerified ?? '', /^\d{4}-\d{2}-\d{2}$/, `${label} "${e.name}" missing lastVerified`);
      const ageDays = Math.floor((Date.now() - Date.parse(e.lastVerified)) / 86400000);
      assert.ok(ageDays <= MAX_AGE_DAYS, `${label} "${e.name}" stale: ${e.lastVerified} (${ageDays}d)`);
    }
  }
});

test('content freshness: footer has report-outdated link', () => {
  const html = readFileSync('public/contact.html', 'utf8');
  assert.match(html, /report.*outdated|outdated.*report/i);
});
