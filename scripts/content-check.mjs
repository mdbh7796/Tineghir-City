// Fails if any stays/contacts entry is stale (>180 days since lastVerified).
// Usage: node scripts/content-check.mjs [--max-age-days=180]
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const maxAge = Number((process.argv.find((a) => a.startsWith('--max-age-days=')) ?? '=180').split('=')[1]);
const now = Date.now();
const stale = [];

const check = (file, label) => {
  const items = JSON.parse(readFileSync(join(root, file), 'utf8'));
  for (const e of items) {
    const t = Date.parse(e.lastVerified ?? '');
    if (Number.isNaN(t)) {
      stale.push(`${label} "${e.name}": missing/invalid lastVerified`);
      continue;
    }
    const ageDays = Math.floor((now - t) / 86400000);
    if (ageDays > maxAge) stale.push(`${label} "${e.name}": lastVerified ${e.lastVerified} (${ageDays}d > ${maxAge}d)`);
  }
};

check('src/templates/stays.json', 'stay');
check('src/templates/contacts.json', 'contact');

if (stale.length) {
  console.error(`content:check FAIL (${stale.length} stale)`);
  for (const s of stale) console.error(` - ${s}`);
  process.exit(1);
}
console.log('content:check PASS (all entries fresh)');
