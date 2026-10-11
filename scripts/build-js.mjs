// Bundles src/js/*.js -> public/script.js and src/sw.js -> public/sw.js.
// Sources live in src/; public/ output is committed for Capacitor webDir.
// Usage: node scripts/build-js.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src', 'js');
const outJs = join(root, 'public', 'script.js');
const outSw = join(root, 'public', 'sw.js');

const ORDER = [
  'attractions-data.js',
  'reveal.js',
  'lightbox.js',
  'map.js',
  'cards.js',
  'sort.js',
  'back.js',
];

const files = ORDER.filter((f) => {
  try { readFileSync(join(srcDir, f)); return true; }
  catch { console.error(`build:js: missing src/js/${f}`); process.exit(1); }
});
// Guard against orphan modules silently excluded from the bundle.
const onDisk = readdirSync(srcDir).filter((f) => f.endsWith('.js')).sort();
const extra = onDisk.filter((f) => !ORDER.includes(f));
if (extra.length) {
  console.error(`build:js: unlisted src/js files: ${extra.join(', ')} — add to ORDER`);
  process.exit(1);
}

const header = `// Built from src/js/*.js — do not edit directly. Run: npm run build:js\n`;
const body = files.map((f) => `// --- src/js/${f} ---\n` + readFileSync(join(srcDir, f), 'utf8').trim()).join('\n\n');
writeFileSync(outJs, header + body + '\n');
console.log(`build:js: wrote public/script.js from ${files.join(', ')}`);

// Service worker: src/sw.js is canonical, public/sw.js is the deployed copy.
const sw = readFileSync(join(root, 'src', 'sw.js'), 'utf8');
writeFileSync(outSw, sw.endsWith('\n') ? sw : sw + '\n');
console.log('build:js: wrote public/sw.js from src/sw.js');
