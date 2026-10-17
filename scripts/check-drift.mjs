// Verifies public/ matches src/ (Fix 1: single source of truth).
// Usage: node scripts/check-drift.mjs
// Rebuilds pages + JS, then fails if git reports drift in built files.
// Run: npm run check:drift
import { execSync } from 'node:child_process';

const TRACKED = [
  'public/*.html',
  'public/script.js',
  'public/sw.js',
  'public/js/*.js',
  'public/sitemap.xml',
];

try {
  console.log('check:drift: rebuilding from src/...');
  execSync('npm run pages && npm run build:js', { stdio: 'inherit' });
} catch {
  console.error('check:drift FAIL: rebuild failed (run npm run pages && npm run build:js)');
  process.exit(1);
}

try {
  // style.css is built by tailwind (may differ by version); check it separately only if committed.
  const out = execSync(`git status --porcelain -- ${TRACKED.join(' ')}`, { encoding: 'utf8' }).trim();
  if (out) {
    console.error('check:drift FAIL: public/ drifted from src/. Did you edit public/ directly?');
    console.error(out);
    console.error('Fix: edit src/templates/ or src/js/ then run npm run build.');
    process.exit(1);
  }
  console.log('check:drift PASS: public/ matches src/');
} catch (e) {
  if (e.status !== undefined && e.status !== 0) process.exit(e.status);
  throw e;
}
