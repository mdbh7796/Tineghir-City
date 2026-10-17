// Verifies i18n dictionaries stay in parity (Fix 5, Phase 1: infra only).
// Full per-page translation lands later; this guards keys so EN/FR/AR can't drift.
// Usage: node scripts/i18n-check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src', 'templates', 'i18n');
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
if (!files.includes('en.json')) {
  console.error('i18n:check FAIL: missing src/templates/i18n/en.json (reference)');
  process.exit(1);
}

const keys = (o, prefix = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

const ref = JSON.parse(readFileSync(join(dir, 'en.json'), 'utf8'));
const refKeys = keys(ref).filter((k) => !['lang', 'dir'].includes(k)).sort();
let failed = false;

for (const f of files) {
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  if (!d.lang || !d.dir) {
    console.error(`i18n:check FAIL: ${f} missing lang/dir`);
    failed = true;
  }
  if (f === 'ar.json' && d.dir !== 'rtl') {
    console.error('i18n:check FAIL: ar.json dir must be "rtl"');
    failed = true;
  }
  if (f !== 'en.json' && d.dir !== 'ltr' && d.dir !== 'rtl') {
    console.error(`i18n:check FAIL: ${f} bad dir "${d.dir}"`);
    failed = true;
  }
  const ks = keys(d).filter((k) => !['lang', 'dir'].includes(k)).sort();
  for (const k of refKeys) {
    if (!ks.includes(k)) {
      console.error(`i18n:check FAIL: ${f} missing key "${k}"`);
      failed = true;
    }
  }
  for (const k of ks) {
    if (!refKeys.includes(k)) {
      console.error(`i18n:check FAIL: ${f} has extra key "${k}" (add to en.json first)`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`i18n:check PASS (${files.join(', ')})`);
